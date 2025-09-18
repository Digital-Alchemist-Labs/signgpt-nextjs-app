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
}
