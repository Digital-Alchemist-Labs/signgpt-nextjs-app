"use client";

export abstract class LanguageDetectionService {
  abstract init(): Promise<void>;
  abstract detectSpokenLanguage(text: string): Promise<string | null>;
}

/**
 * CLD3-based language detection service
 */
export class CLD3LanguageDetectionService extends LanguageDetectionService {
  private cld3: {
    findLanguage: (text: string) => { language: string; probability: number };
  } | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // CLD3 is not available in this environment, use fallback
      console.warn("CLD3 language detection not available, using fallback");
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize CLD3:", error);
      throw new Error("Language detection service initialization failed");
    }
  }

  async detectSpokenLanguage(text: string): Promise<string | null> {
    if (!this.isInitialized) {
      await this.init();
    }

    if (!text.trim()) {
      return null;
    }

    // CLD3 not available, use browser-based detection as fallback
    const browserDetection = new BrowserLanguageDetectionService();
    await browserDetection.init();
    return browserDetection.detectSpokenLanguage(text);
  }
}

/**
 * MediaPipe-based language detection service
 */
export class MediaPipeLanguageDetectionService extends LanguageDetectionService {
  private languageDetector:
    | {
        detect: (text: string) => {
          classifications: Array<{
            categories: Array<{ categoryName: string; score: number }>;
          }>;
        };
      }
    | CLD3LanguageDetectionService
    | BrowserLanguageDetectionService
    | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // MediaPipe is not available in this environment, use fallback
      console.warn(
        "MediaPipe language detection not available, using fallback"
      );
      const fallback = new BrowserLanguageDetectionService();
      await fallback.init();
      this.languageDetector = fallback;
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize MediaPipe language detector:", error);
      // Fallback to browser-based detection
      const fallback = new BrowserLanguageDetectionService();
      await fallback.init();
      this.languageDetector = fallback;
      this.isInitialized = true;
    }
  }

  async detectSpokenLanguage(text: string): Promise<string | null> {
    if (!this.isInitialized) {
      await this.init();
    }

    if (!text.trim()) {
      return null;
    }

    try {
      // Use the fallback service (browser-based detection)
      if (this.languageDetector instanceof BrowserLanguageDetectionService) {
        return await this.languageDetector.detectSpokenLanguage(text);
      }

      // If we have CLD3 service, use it
      if (this.languageDetector instanceof CLD3LanguageDetectionService) {
        return await this.languageDetector.detectSpokenLanguage(text);
      }

      // If we have MediaPipe detector object, use it
      if (this.languageDetector && "detect" in this.languageDetector) {
        const result = this.languageDetector.detect(text);
        if (
          result &&
          result.classifications &&
          result.classifications.length > 0
        ) {
          const topResult = result.classifications[0];
          if (topResult.categories && topResult.categories.length > 0) {
            const topCategory = topResult.categories[0];
            if (topCategory.score > 0.7) {
              return topCategory.categoryName;
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Language detection failed:", error);
      return null;
    }
  }
}

/**
 * Browser-based language detection service (fallback)
 */
export class BrowserLanguageDetectionService extends LanguageDetectionService {
  private isInitialized = false;

  async init(): Promise<void> {
    this.isInitialized = true;
  }

  async detectSpokenLanguage(text: string): Promise<string | null> {
    if (!text.trim()) {
      return null;
    }

    // Simple heuristic-based detection as fallback
    const patterns: Record<string, RegExp[]> = {
      en: [/\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi],
      de: [/\b(der|die|das|und|oder|aber|in|auf|an|zu|für|von|mit|durch)\b/gi],
      fr: [/\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi],
      es: [/\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi],
      it: [/\b(il|la|i|le|e|o|ma|in|su|a|per|di|con|da)\b/gi],
    };

    let bestMatch = { language: null as string | null, score: 0 };

    for (const [language, regexes] of Object.entries(patterns)) {
      let matches = 0;
      for (const regex of regexes) {
        const found = text.match(regex);
        if (found) {
          matches += found.length;
        }
      }

      const score = matches / text.split(" ").length;
      if (score > bestMatch.score && score > 0.1) {
        bestMatch = { language, score };
      }
    }

    return bestMatch.language;
  }
}

/**
 * Factory function to create the appropriate language detection service
 */
export function createLanguageDetectionService(): LanguageDetectionService {
  // Try to use MediaPipe first, fallback to CLD3, then browser-based
  if (typeof window !== "undefined") {
    return new MediaPipeLanguageDetectionService();
  }

  return new BrowserLanguageDetectionService();
}
