"use client";

import { environment, getSignMtApiUrl } from "@/config/environment";

export class TranslationService {
  // Comprehensive list of signed languages from the Angular app
  static readonly signedLanguages = [
    "ase", // American Sign Language (ISO 639-3)
    "asl", // American Sign Language (common abbreviation)
    "gsg", // German Sign Language
    "fsl", // French Sign Language
    "bfi", // British Sign Language
    "ils", // Israeli Sign Language
    "sgg", // Swiss German Sign Language
    "ssr", // Swiss-Italian Sign Language
    "slf", // Swiss-French Sign Language
    "isr", // Indian Sign Language
    "ssp", // Spanish Sign Language
    "jos", // Jordanian Sign Language
    "rsl-by", // Russian Sign Language (Belarus)
    "bqn", // Bulgarian Sign Language
    "csl", // Chinese Sign Language
    "csq", // Croatia Sign Language
    "cse", // Czech Sign Language
    "dsl", // Danish Sign Language
    "ins", // Indonesian Sign Language
    "nzs", // New Zealand Sign Language
    "eso", // Estonian Sign Language
    "fse", // Finnish Sign Language
    "asq", // Austrian Sign Language
    "gss-cy", // Greek Sign Language (Cyprus)
    "gss", // Greek Sign Language
    "icl", // Icelandic Sign Language
    "ise", // Irish Sign Language
    "jsl", // Japanese Sign Language
    "lsl", // Latvian Sign Language
    "lls", // Lithuanian Sign Language
    "psc", // Polish Sign Language
    "pso", // Polish Sign Language (old)
    "bzs", // Brazilian Sign Language
    "psr", // Portuguese Sign Language
    "rms", // Romanian Sign Language
    "rsl", // Russian Sign Language
    "svk", // Slovak Sign Language
    "aed", // Argentine Sign Language
    "csg", // Chilean Sign Language
    "csf", // Colombian Sign Language
    "mfs", // Mexican Sign Language
    "swl", // Swedish Sign Language
    "tsm", // Turkish Sign Language
    "ukl", // Ukrainian Sign Language
    "pks", // Pakistani Sign Language
  ];

  // Comprehensive list of spoken languages from the Angular app
  static readonly spokenLanguages = [
    "en",
    "de",
    "fr",
    "af",
    "sq",
    "am",
    "ar",
    "hy",
    "az",
    "eu",
    "be",
    "bn",
    "bs",
    "bg",
    "ca",
    "ceb",
    "ny",
    "zh",
    "co",
    "hr",
    "cs",
    "da",
    "nl",
    "eo",
    "et",
    "tl",
    "fi",
    "fy",
    "gl",
    "ka",
    "es",
    "el",
    "gu",
    "ht",
    "ha",
    "haw",
    "he",
    "hi",
    "hmn",
    "hu",
    "is",
    "ig",
    "id",
    "ga",
    "it",
    "ja",
    "jv",
    "kn",
    "kk",
    "km",
    "rw",
    "ko",
    "ku",
    "ky",
    "lo",
    "la",
    "lv",
    "lt",
    "lb",
    "mk",
    "mg",
    "ms",
    "ml",
    "mt",
    "mi",
    "mr",
    "mn",
    "my",
    "ne",
    "no",
    "or",
    "ps",
    "fa",
    "pl",
    "pt",
    "pa",
    "ro",
    "ru",
    "sm",
    "gd",
    "sr",
    "st",
    "sn",
    "sd",
    "si",
    "sk",
    "sl",
    "so",
    "su",
    "sw",
    "sv",
    "tg",
    "ta",
    "tt",
    "te",
    "th",
    "tr",
    "tk",
    "uk",
    "ur",
    "ug",
    "uz",
    "vi",
    "cy",
    "xh",
    "yi",
    "yo",
    "zu",
  ];

  private lastSpokenLanguageSegmenter: {
    language: string;
    segmenter: Intl.Segmenter;
  } | null = null;

  /**
   * Split spoken text into sentences using the Intl.Segmenter API
   */
  splitSpokenSentences(language: string, text: string): string[] {
    // If the browser does not support the Segmenter API (Firefox<127), return the whole text as a single segment
    if (!("Segmenter" in Intl)) {
      return [text];
    }

    // Construct a segmenter for the given language, can take 1ms~
    if (this.lastSpokenLanguageSegmenter?.language !== language) {
      this.lastSpokenLanguageSegmenter = {
        language,
        segmenter: new Intl.Segmenter(language, { granularity: "sentence" }),
      };
    }

    const segments = this.lastSpokenLanguageSegmenter.segmenter.segment(text);
    return Array.from(segments).map((segment) => segment.segment);
  }

  /**
   * Normalize spoken language text using the sign.mt API
   */
  async normalizeSpokenLanguageText(
    language: string,
    text: string
  ): Promise<string> {
    const params = new URLSearchParams();
    params.set("lang", language);
    params.set("text", text);
    const url = getSignMtApiUrl("text-normalization") + "?" + params.toString();

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("Failed to normalize text:", error);
      return text; // Return original text if normalization fails
    }
  }

  /**
   * Describe SignWriting using the sign.mt API
   */
  async describeSignWriting(fsw: string): Promise<string> {
    const url = getSignMtApiUrl("signwriting-description");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: { fsw } }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.result.description;
    } catch (error) {
      console.error("Failed to describe SignWriting:", error);
      throw error;
    }
  }

  /**
   * Normalize sign language code (ASL -> ASE for API compatibility)
   */
  static normalizeSignLanguageCode(code: string): string {
    // Convert ASL to ASE for API compatibility
    if (code === "asl") {
      return "ase";
    }
    return code;
  }

  /**
   * Get the URL for spoken-to-signed translation
   */
  translateSpokenToSigned(
    text: string,
    spokenLanguage: string,
    signedLanguage: string
  ): string {
    // Normalize the signed language code for API compatibility
    const normalizedSignedLanguage =
      TranslationService.normalizeSignLanguageCode(signedLanguage);

    const url = `${
      environment.signMtCloudFunctionUrl
    }?text=${encodeURIComponent(
      text
    )}&spoken=${spokenLanguage}&signed=${normalizedSignedLanguage}`;

    console.log("TranslationService.translateSpokenToSigned called:");
    console.log("  - text:", text);
    console.log("  - spokenLanguage:", spokenLanguage);
    console.log("  - signedLanguage:", signedLanguage);
    console.log("  - normalizedSignedLanguage:", normalizedSignedLanguage);
    console.log("  - generated URL:", url);

    return url;
  }

  /**
   * Check if a language code is a signed language
   */
  static isSignedLanguage(languageCode: string): boolean {
    return TranslationService.signedLanguages.includes(languageCode);
  }

  /**
   * Check if a language code is a spoken language
   */
  static isSpokenLanguage(languageCode: string): boolean {
    return TranslationService.spokenLanguages.includes(languageCode);
  }

  /**
   * Get language name from code (basic implementation)
   * This should be enhanced with proper language names
   */
  static getLanguageName(code: string): string {
    const languageNames: Record<string, string> = {
      // Spoken languages
      en: "English",
      de: "German",
      fr: "French",
      es: "Spanish",
      it: "Italian",
      pt: "Portuguese",
      ru: "Russian",
      zh: "Chinese",
      ja: "Japanese",
      ko: "Korean",
      ar: "Arabic",
      hi: "Hindi",

      // Signed languages
      ase: "American Sign Language",
      asl: "American Sign Language (ASL)",
      gsg: "German Sign Language",
      fsl: "French Sign Language",
      bfi: "British Sign Language",
      jsl: "Japanese Sign Language",
      csl: "Chinese Sign Language",
      bzs: "Brazilian Sign Language",
      ils: "Israeli Sign Language",
    };

    return languageNames[code] || code.toUpperCase();
  }

  /**
   * Validate translation parameters
   */
  static validateTranslationParams(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): boolean {
    if (!text.trim()) return false;
    if (!sourceLanguage || !targetLanguage) return false;

    const isSourceSpoken = TranslationService.isSpokenLanguage(sourceLanguage);
    const isTargetSigned = TranslationService.isSignedLanguage(targetLanguage);
    const isSourceSigned = TranslationService.isSignedLanguage(sourceLanguage);
    const isTargetSpoken = TranslationService.isSpokenLanguage(targetLanguage);

    // Valid combinations: spoken->signed or signed->spoken
    return (
      (isSourceSpoken && isTargetSigned) || (isSourceSigned && isTargetSpoken)
    );
  }

  /**
   * Fetch pose data from Sign.MT via proxy (CORS-safe)
   * This method uses the Next.js API proxy to avoid CORS issues
   */
  async fetchPoseData(
    text: string,
    spokenLanguage: string,
    signedLanguage: string
  ): Promise<{
    pose?: unknown;
    poseUrl?: string;
    contentType?: string;
    error?: string;
    fallback?: boolean;
  }> {
    try {
      // Normalize the signed language code for API compatibility
      const normalizedSignedLanguage =
        TranslationService.normalizeSignLanguageCode(signedLanguage);

      console.log("Fetching pose data via proxy:", {
        text,
        spokenLanguage,
        signedLanguage: normalizedSignedLanguage,
      });

      const response = await fetch("/api/translate-pose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          spokenLanguage,
          signedLanguage: normalizedSignedLanguage,
        }),
      });

      // Handle graceful fallback for 503 or access denied
      if (response.status === 503 || response.status === 403 || response.status === 401) {
        const errorData = await response.json();
        console.info(
          "Sign.MT API unavailable (expected on Vercel), using local fallback:",
          errorData
        );
        return {
          error: errorData.error || "Sign.MT API unavailable",
          fallback: true,
        };
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.warn("Sign.MT API error:", errorData);
        
        // Check if server suggests fallback
        if (errorData.fallback) {
          return {
            error: errorData.error || `HTTP error! status: ${response.status}`,
            fallback: true,
          };
        }
        
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      
      // Check if response suggests fallback
      if (data.fallback) {
        return {
          error: data.error || "Sign.MT API unavailable",
          fallback: true,
        };
      }
      
      return data;
    } catch (error) {
      console.error("Failed to fetch pose data:", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: true, // Always suggest fallback on error
      };
    }
  }

  /**
   * Fetch pose data with caching support
   */
  private poseCache = new Map<
    string,
    Promise<{
      pose?: unknown;
      poseUrl?: string;
      contentType?: string;
      error?: string;
      fallback?: boolean;
    }>
  >();

  async fetchPoseDataCached(
    text: string,
    spokenLanguage: string,
    signedLanguage: string
  ): Promise<{
    pose?: unknown;
    poseUrl?: string;
    contentType?: string;
    error?: string;
    fallback?: boolean;
  }> {
    const cacheKey = `${text}:${spokenLanguage}:${signedLanguage}`;

    // Check if we have a pending or completed request
    if (!this.poseCache.has(cacheKey)) {
      const promise = this.fetchPoseData(text, spokenLanguage, signedLanguage);
      this.poseCache.set(cacheKey, promise);

      // Clean up cache after some time to prevent memory leaks
      promise.finally(() => {
        setTimeout(() => {
          this.poseCache.delete(cacheKey);
        }, 60000); // 1 minute cache
      });
    }

    return this.poseCache.get(cacheKey)!;
  }
}
