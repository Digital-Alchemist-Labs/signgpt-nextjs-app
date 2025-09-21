import { SignHoverData } from "@/types/sign-hover";

// Default sign language data mappings
const DEFAULT_SIGN_MAPPINGS: Record<string, Partial<SignHoverData>> = {
  // Basic UI elements
  button: {
    signImageUrl: "/assets/signs/button.png",
    description: "Sign language for button.",
    category: "button",
  },
  click: {
    signImageUrl: "/assets/signs/click.png",
    description: "Sign language for click action.",
    category: "button",
  },
  submit: {
    signImageUrl: "/assets/signs/submit.png",
    description: "Sign language for submit.",
    category: "button",
  },
  cancel: {
    signImageUrl: "/assets/signs/cancel.png",
    description: "Sign language for cancel.",
    category: "button",
  },
  save: {
    signImageUrl: "/assets/signs/save.png",
    description: "Sign language for save.",
    category: "button",
  },

  // Navigation elements
  home: {
    signImageUrl: "/assets/signs/home.png",
    description: "Sign language for home.",
    category: "navigation",
  },
  settings: {
    signImageUrl: "/assets/signs/settings.png",
    description: "Sign language for settings.",
    category: "navigation",
  },
  menu: {
    signImageUrl: "/assets/signs/menu.png",
    description: "Sign language for menu.",
    category: "navigation",
  },
  back: {
    signImageUrl: "/assets/signs/back.png",
    description: "Sign language for back/previous.",
    category: "navigation",
  },
  next: {
    signImageUrl: "/assets/signs/next.png",
    description: "Sign language for next.",
    category: "navigation",
  },

  // Input elements
  input: {
    signImageUrl: "/assets/signs/input.png",
    description: "Sign language for input.",
    category: "input",
  },
  text: {
    signImageUrl: "/assets/signs/text.png",
    description: "Sign language for text.",
    category: "input",
  },
  search: {
    signImageUrl: "/assets/signs/search.png",
    description: "Sign language for search.",
    category: "input",
  },
  select: {
    signImageUrl: "/assets/signs/select.png",
    description: "Sign language for select.",
    category: "dropdown",
  },
  choose: {
    signImageUrl: "/assets/signs/choose.png",
    description: "Sign language for choose/selection.",
    category: "dropdown",
  },

  // Language related
  language: {
    signImageUrl: "/assets/signs/language.png",
    description: "Sign language for language.",
    category: "dropdown",
  },
  english: {
    signImageUrl: "/assets/signs/english.png",
    description: "Sign language for English.",
    category: "dropdown",
  },
  korean: {
    signImageUrl: "/assets/signs/korean.png",
    description: "Sign language for Korean.",
    category: "dropdown",
  },
  translate: {
    signImageUrl: "/assets/signs/translate.png",
    description: "Sign language for translate.",
    category: "general",
  },

  // General actions
  open: {
    signImageUrl: "/assets/signs/open.png",
    description: "Sign language for open.",
    category: "general",
  },
  close: {
    signImageUrl: "/assets/signs/close.png",
    description: "Sign language for close.",
    category: "general",
  },
  start: {
    signImageUrl: "/assets/signs/start.png",
    description: "Sign language for start.",
    category: "button",
  },
  stop: {
    signImageUrl: "/assets/signs/stop.png",
    description: "Sign language for stop.",
    category: "button",
  },
  help: {
    signImageUrl: "/assets/signs/help.png",
    description: "Sign language for help.",
    category: "general",
  },
  about: {
    signImageUrl: "/assets/signs/about.png",
    description: "Sign language for about/information.",
    category: "general",
  },

  // SignGPT specific terms
  signgpt: {
    signImageUrl: "/assets/signs/signgpt.png",
    description: "Sign language for SignGPT application.",
    category: "general",
  },
  pose: {
    signImageUrl: "/assets/signs/pose.png",
    description: "Sign language for pose/posture.",
    category: "general",
  },
  camera: {
    signImageUrl: "/assets/signs/camera.png",
    description: "Sign language for camera.",
    category: "general",
  },
  video: {
    signImageUrl: "/assets/signs/video.png",
    description: "Sign language for video.",
    category: "general",
  },
  upload: {
    signImageUrl: "/assets/signs/upload.png",
    description: "Sign language for upload.",
    category: "button",
  },
  download: {
    signImageUrl: "/assets/signs/download.png",
    description: "Sign language for download.",
    category: "button",
  },
};

// English mappings (duplicates for Korean words)
const KOREAN_MAPPINGS: Record<string, string> = {
  // Korean UI terms mapped to English keys
  버튼: "button",
  클릭: "click",
  제출: "submit",
  취소: "cancel",
  저장: "save",
  홈: "home",
  설정: "settings",
  메뉴: "menu",
  뒤로: "back",
  다음: "next",
  입력: "input",
  텍스트: "text",
  검색: "search",
  선택: "select",
  언어: "language",
  영어: "english",
  한국어: "korean",
  번역: "translate",
  열기: "open",
  닫기: "close",
  시작: "start",
  정지: "stop",
  도움: "help",
  정보: "about",
  자세: "pose",
  카메라: "camera",
  비디오: "video",
  업로드: "upload",
  다운로드: "download",
};

class SignHoverService {
  private readonly videoCache = new Map<string, string>();
  private readonly cacheExpiry = new Map<string, number>();
  private readonly customMappings = new Map<string, Partial<SignHoverData>>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeDefaultMappings();
  }

  /**
   * Get sign language data for text
   */
  getSignData(text: string): Partial<SignHoverData> | null {
    const normalizedText = this.normalizeText(text);

    // Try exact matching first
    if (DEFAULT_SIGN_MAPPINGS[normalizedText]) {
      return DEFAULT_SIGN_MAPPINGS[normalizedText];
    }

    // Try custom mappings
    if (this.customMappings.has(normalizedText)) {
      return this.customMappings.get(normalizedText)!;
    }

    // Try partial matching
    const partialMatch = this.findPartialMatch(normalizedText);
    if (partialMatch) {
      return partialMatch;
    }

    // Try keyword extraction
    const keywordMatch = this.findKeywordMatch(normalizedText);
    if (keywordMatch) {
      return keywordMatch;
    }

    return null;
  }

  /**
   * Add custom sign language mapping
   */
  addCustomMapping(text: string, signData: Partial<SignHoverData>): void {
    const normalizedText = this.normalizeText(text);
    this.customMappings.set(normalizedText, signData);
  }

  /**
   * Add multiple custom mappings at once
   */
  addCustomMappings(mappings: Record<string, Partial<SignHoverData>>): void {
    Object.entries(mappings).forEach(([text, signData]) => {
      this.addCustomMapping(text, signData);
    });
  }

  /**
   * Normalize text for processing
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s가-힣]/g, "") // Remove special characters
      .replace(/\s+/g, " "); // Replace multiple spaces with single space
  }

  /**
   * Find partial matches
   */
  private findPartialMatch(text: string): Partial<SignHoverData> | null {
    const words = text.split(" ");

    // Try matching each word
    for (const word of words) {
      if (DEFAULT_SIGN_MAPPINGS[word]) {
        return DEFAULT_SIGN_MAPPINGS[word];
      }
    }

    // Try inclusion relationship check
    for (const [key, value] of Object.entries(DEFAULT_SIGN_MAPPINGS)) {
      if (text.includes(key) || key.includes(text)) {
        return value;
      }
    }

    // Try Korean mappings
    for (const word of words) {
      if (KOREAN_MAPPINGS[word]) {
        const englishKey = KOREAN_MAPPINGS[word];
        if (DEFAULT_SIGN_MAPPINGS[englishKey]) {
          return DEFAULT_SIGN_MAPPINGS[englishKey];
        }
      }
    }

    return null;
  }

  /**
   * Find keyword-based matches
   */
  private findKeywordMatch(text: string): Partial<SignHoverData> | null {
    // Infer UI element type
    if (text.match(/(button|btn|click)/i)) {
      return DEFAULT_SIGN_MAPPINGS["button"];
    }

    if (text.match(/(input|text)/i)) {
      return DEFAULT_SIGN_MAPPINGS["input"];
    }

    if (text.match(/(select|dropdown|option)/i)) {
      return DEFAULT_SIGN_MAPPINGS["select"];
    }

    if (text.match(/(search|find)/i)) {
      return DEFAULT_SIGN_MAPPINGS["search"];
    }

    if (text.match(/(setting|config)/i)) {
      return DEFAULT_SIGN_MAPPINGS["settings"];
    }

    if (text.match(/(menu|nav)/i)) {
      return DEFAULT_SIGN_MAPPINGS["menu"];
    }

    if (text.match(/(language|lang)/i)) {
      return DEFAULT_SIGN_MAPPINGS["language"];
    }

    if (text.match(/(translate|trans)/i)) {
      return DEFAULT_SIGN_MAPPINGS["translate"];
    }

    return null;
  }

  /**
   * Get all mapping data
   */
  getAllMappings(): Record<string, Partial<SignHoverData>> {
    return { ...DEFAULT_SIGN_MAPPINGS };
  }

  /**
   * Get mappings for specific category
   */
  getMappingsByCategory(
    category: string
  ): Record<string, Partial<SignHoverData>> {
    const filtered: Record<string, Partial<SignHoverData>> = {};

    Object.entries(DEFAULT_SIGN_MAPPINGS).forEach(([key, value]) => {
      if (value.category === category) {
        filtered[key] = value;
      }
    });

    Object.entries(this.customMappings).forEach(([key, value]) => {
      if (value.category === category) {
        filtered[key] = value;
      }
    });

    return filtered;
  }

  /**
   * Store sign language video in cache
   */
  cacheSignVideo(text: string, videoUrl: string): void {
    const normalizedText = this.normalizeText(text);
    this.videoCache.set(normalizedText, videoUrl);
    this.cacheExpiry.set(normalizedText, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Get sign language video from cache
   */
  getCachedSignVideo(text: string): string | null {
    const normalizedText = this.normalizeText(text);
    const expiry = this.cacheExpiry.get(normalizedText);

    // Remove expired cache
    if (expiry && Date.now() > expiry) {
      this.videoCache.delete(normalizedText);
      this.cacheExpiry.delete(normalizedText);
      return null;
    }

    return this.videoCache.get(normalizedText) || null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.videoCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now > expiry) {
        this.videoCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }

  /**
   * Text normalization compatible with Enhanced mode (Enhanced mode approach)
   */
  sanitizeTextForFirebase(text: string): string {
    return (text || "").toLowerCase().replace(/[^a-z0-9]/g, "_");
  }

  /**
   * Generate sign language video URL from Firebase (Enhanced mode approach)
   */
  getFirebaseVideoPath(text: string): string {
    const sanitizedText = this.sanitizeTextForFirebase(text);
    return `sign_videos/${sanitizedText}.mp4`;
  }

  /**
   * Generate sign language pose URL from Firebase (Enhanced mode approach)
   */
  getFirebasePosePath(text: string): string {
    const sanitizedText = this.sanitizeTextForFirebase(text);
    return `sign_poses/${sanitizedText}.pose`;
  }

  /**
   * Return cache statistics (Enhanced mode debugging support)
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.videoCache.size,
      entries: Array.from(this.videoCache.keys()),
    };
  }

  /**
   * Cache validity check for Enhanced mode compatibility
   */
  isCacheValid(text: string): boolean {
    const normalizedText = this.normalizeText(text);
    const expiry = this.cacheExpiry.get(normalizedText);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * Initialize default mappings
   */
  private initializeDefaultMappings(): void {
    // Clean expired cache periodically
    setInterval(() => {
      this.cleanExpiredCache();
    }, this.CACHE_DURATION);
  }
}

// Singleton instance
export const signHoverService = new SignHoverService();

export default SignHoverService;
