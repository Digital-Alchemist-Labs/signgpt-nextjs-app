import { SignHoverData } from "@/types/sign-hover";

// 기본 수어 데이터 매핑
const DEFAULT_SIGN_MAPPINGS: Record<string, Partial<SignHoverData>> = {
  // 기본 UI 요소
  button: {
    signImageUrl: "/assets/signs/button.png",
    description: "버튼을 나타내는 수어입니다.",
    category: "button",
  },
  click: {
    signImageUrl: "/assets/signs/click.png",
    description: "클릭 동작을 나타내는 수어입니다.",
    category: "button",
  },
  submit: {
    signImageUrl: "/assets/signs/submit.png",
    description: "제출을 나타내는 수어입니다.",
    category: "button",
  },
  cancel: {
    signImageUrl: "/assets/signs/cancel.png",
    description: "취소를 나타내는 수어입니다.",
    category: "button",
  },
  save: {
    signImageUrl: "/assets/signs/save.png",
    description: "저장을 나타내는 수어입니다.",
    category: "button",
  },

  // 네비게이션 요소
  home: {
    signImageUrl: "/assets/signs/home.png",
    description: "홈/집을 나타내는 수어입니다.",
    category: "navigation",
  },
  settings: {
    signImageUrl: "/assets/signs/settings.png",
    description: "설정을 나타내는 수어입니다.",
    category: "navigation",
  },
  menu: {
    signImageUrl: "/assets/signs/menu.png",
    description: "메뉴를 나타내는 수어입니다.",
    category: "navigation",
  },
  back: {
    signImageUrl: "/assets/signs/back.png",
    description: "뒤로가기를 나타내는 수어입니다.",
    category: "navigation",
  },
  next: {
    signImageUrl: "/assets/signs/next.png",
    description: "다음을 나타내는 수어입니다.",
    category: "navigation",
  },

  // 입력 요소
  input: {
    signImageUrl: "/assets/signs/input.png",
    description: "입력을 나타내는 수어입니다.",
    category: "input",
  },
  text: {
    signImageUrl: "/assets/signs/text.png",
    description: "텍스트를 나타내는 수어입니다.",
    category: "input",
  },
  search: {
    signImageUrl: "/assets/signs/search.png",
    description: "검색을 나타내는 수어입니다.",
    category: "input",
  },
  select: {
    signImageUrl: "/assets/signs/select.png",
    description: "선택을 나타내는 수어입니다.",
    category: "dropdown",
  },
  choose: {
    signImageUrl: "/assets/signs/choose.png",
    description: "선택을 나타내는 수어입니다.",
    category: "dropdown",
  },

  // 언어 관련
  language: {
    signImageUrl: "/assets/signs/language.png",
    description: "언어를 나타내는 수어입니다.",
    category: "dropdown",
  },
  english: {
    signImageUrl: "/assets/signs/english.png",
    description: "영어를 나타내는 수어입니다.",
    category: "dropdown",
  },
  korean: {
    signImageUrl: "/assets/signs/korean.png",
    description: "한국어를 나타내는 수어입니다.",
    category: "dropdown",
  },
  translate: {
    signImageUrl: "/assets/signs/translate.png",
    description: "번역을 나타내는 수어입니다.",
    category: "general",
  },

  // 일반적인 동작
  open: {
    signImageUrl: "/assets/signs/open.png",
    description: "열기를 나타내는 수어입니다.",
    category: "general",
  },
  close: {
    signImageUrl: "/assets/signs/close.png",
    description: "닫기를 나타내는 수어입니다.",
    category: "general",
  },
  start: {
    signImageUrl: "/assets/signs/start.png",
    description: "시작을 나타내는 수어입니다.",
    category: "button",
  },
  stop: {
    signImageUrl: "/assets/signs/stop.png",
    description: "정지를 나타내는 수어입니다.",
    category: "button",
  },
  help: {
    signImageUrl: "/assets/signs/help.png",
    description: "도움을 나타내는 수어입니다.",
    category: "general",
  },
  about: {
    signImageUrl: "/assets/signs/about.png",
    description: "정보/소개를 나타내는 수어입니다.",
    category: "general",
  },

  // SignGPT 특화 용어
  signgpt: {
    signImageUrl: "/assets/signs/signgpt.png",
    description: "SignGPT 애플리케이션을 나타내는 수어입니다.",
    category: "general",
  },
  pose: {
    signImageUrl: "/assets/signs/pose.png",
    description: "자세/포즈를 나타내는 수어입니다.",
    category: "general",
  },
  camera: {
    signImageUrl: "/assets/signs/camera.png",
    description: "카메라를 나타내는 수어입니다.",
    category: "general",
  },
  video: {
    signImageUrl: "/assets/signs/video.png",
    description: "비디오를 나타내는 수어입니다.",
    category: "general",
  },
  upload: {
    signImageUrl: "/assets/signs/upload.png",
    description: "업로드를 나타내는 수어입니다.",
    category: "button",
  },
  download: {
    signImageUrl: "/assets/signs/download.png",
    description: "다운로드를 나타내는 수어입니다.",
    category: "button",
  },
};

// 한국어 매핑
const KOREAN_SIGN_MAPPINGS: Record<string, Partial<SignHoverData>> = {
  버튼: DEFAULT_SIGN_MAPPINGS["button"],
  클릭: DEFAULT_SIGN_MAPPINGS["click"],
  제출: DEFAULT_SIGN_MAPPINGS["submit"],
  취소: DEFAULT_SIGN_MAPPINGS["cancel"],
  저장: DEFAULT_SIGN_MAPPINGS["save"],
  홈: DEFAULT_SIGN_MAPPINGS["home"],
  설정: DEFAULT_SIGN_MAPPINGS["settings"],
  메뉴: DEFAULT_SIGN_MAPPINGS["menu"],
  뒤로: DEFAULT_SIGN_MAPPINGS["back"],
  다음: DEFAULT_SIGN_MAPPINGS["next"],
  입력: DEFAULT_SIGN_MAPPINGS["input"],
  텍스트: DEFAULT_SIGN_MAPPINGS["text"],
  검색: DEFAULT_SIGN_MAPPINGS["search"],
  선택: DEFAULT_SIGN_MAPPINGS["select"],
  언어: DEFAULT_SIGN_MAPPINGS["language"],
  영어: DEFAULT_SIGN_MAPPINGS["english"],
  한국어: DEFAULT_SIGN_MAPPINGS["korean"],
  번역: DEFAULT_SIGN_MAPPINGS["translate"],
  열기: DEFAULT_SIGN_MAPPINGS["open"],
  닫기: DEFAULT_SIGN_MAPPINGS["close"],
  시작: DEFAULT_SIGN_MAPPINGS["start"],
  정지: DEFAULT_SIGN_MAPPINGS["stop"],
  도움: DEFAULT_SIGN_MAPPINGS["help"],
  정보: DEFAULT_SIGN_MAPPINGS["about"],
  자세: DEFAULT_SIGN_MAPPINGS["pose"],
  카메라: DEFAULT_SIGN_MAPPINGS["camera"],
  비디오: DEFAULT_SIGN_MAPPINGS["video"],
  업로드: DEFAULT_SIGN_MAPPINGS["upload"],
  다운로드: DEFAULT_SIGN_MAPPINGS["download"],
};

class SignHoverService {
  private signMappings: Record<string, Partial<SignHoverData>>;
  private customMappings: Record<string, Partial<SignHoverData>> = {};
  private videoCache: Map<string, string> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5분

  constructor() {
    this.signMappings = { ...DEFAULT_SIGN_MAPPINGS, ...KOREAN_SIGN_MAPPINGS };
  }

  /**
   * 텍스트에 대한 수어 데이터를 가져옵니다
   */
  getSignData(text: string): SignHoverData | null {
    if (!text) return null;

    const normalizedText = this.normalizeText(text);

    // 정확한 매칭 시도
    let signData: Partial<SignHoverData> | null =
      this.signMappings[normalizedText] ||
      this.customMappings[normalizedText] ||
      null;

    if (!signData) {
      // 부분 매칭 시도
      signData = this.findPartialMatch(normalizedText);
    }

    if (!signData) {
      // 키워드 추출 시도
      signData = this.findKeywordMatch(normalizedText);
    }

    if (signData) {
      return {
        text,
        ...signData,
        category: signData.category || "general",
      };
    }

    return null;
  }

  /**
   * 커스텀 수어 매핑을 추가합니다
   */
  addCustomMapping(text: string, signData: Partial<SignHoverData>): void {
    const normalizedText = this.normalizeText(text);
    this.customMappings[normalizedText] = signData;
  }

  /**
   * 여러 커스텀 매핑을 한번에 추가합니다
   */
  addCustomMappings(mappings: Record<string, Partial<SignHoverData>>): void {
    Object.entries(mappings).forEach(([text, signData]) => {
      this.addCustomMapping(text, signData);
    });
  }

  /**
   * 텍스트를 정규화합니다
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s가-힣]/g, "") // 특수문자 제거
      .replace(/\s+/g, " "); // 여러 공백을 하나로
  }

  /**
   * 부분 매칭을 시도합니다
   */
  private findPartialMatch(text: string): Partial<SignHoverData> | null {
    const words = text.split(" ");

    // 각 단어에 대해 매칭 시도
    for (const word of words) {
      if (this.signMappings[word] || this.customMappings[word]) {
        return this.signMappings[word] || this.customMappings[word];
      }
    }

    // 포함 관계 확인
    for (const [key, value] of Object.entries(this.signMappings)) {
      if (text.includes(key) || key.includes(text)) {
        return value;
      }
    }

    for (const [key, value] of Object.entries(this.customMappings)) {
      if (text.includes(key) || key.includes(text)) {
        return value;
      }
    }

    return null;
  }

  /**
   * 키워드 기반 매칭을 시도합니다
   */
  private findKeywordMatch(text: string): Partial<SignHoverData> | null {
    // UI 요소 타입 추론
    if (text.match(/(버튼|button|btn|클릭|click)/i)) {
      return DEFAULT_SIGN_MAPPINGS["button"];
    }

    if (text.match(/(입력|input|텍스트|text)/i)) {
      return DEFAULT_SIGN_MAPPINGS["input"];
    }

    if (text.match(/(선택|select|드롭다운|dropdown|옵션|option)/i)) {
      return DEFAULT_SIGN_MAPPINGS["select"];
    }

    if (text.match(/(검색|search|찾기|find)/i)) {
      return DEFAULT_SIGN_MAPPINGS["search"];
    }

    if (text.match(/(설정|setting|config|환경)/i)) {
      return DEFAULT_SIGN_MAPPINGS["settings"];
    }

    if (text.match(/(메뉴|menu|네비|nav)/i)) {
      return DEFAULT_SIGN_MAPPINGS["menu"];
    }

    if (text.match(/(언어|language|lang)/i)) {
      return DEFAULT_SIGN_MAPPINGS["language"];
    }

    if (text.match(/(번역|translate|trans)/i)) {
      return DEFAULT_SIGN_MAPPINGS["translate"];
    }

    return null;
  }

  /**
   * 모든 매핑 데이터를 가져옵니다
   */
  getAllMappings(): Record<string, Partial<SignHoverData>> {
    return { ...this.signMappings, ...this.customMappings };
  }

  /**
   * 특정 카테고리의 매핑을 가져옵니다
   */
  getMappingsByCategory(
    category: string
  ): Record<string, Partial<SignHoverData>> {
    const result: Record<string, Partial<SignHoverData>> = {};
    const allMappings = this.getAllMappings();

    Object.entries(allMappings).forEach(([key, value]) => {
      if (value.category === category) {
        result[key] = value;
      }
    });

    return result;
  }

  /**
   * 수어 영상을 캐시에 저장합니다
   */
  cacheSignVideo(text: string, videoUrl: string): void {
    const normalizedText = this.normalizeText(text);
    this.videoCache.set(normalizedText, videoUrl);
    this.cacheExpiry.set(normalizedText, Date.now() + this.CACHE_DURATION);
  }

  /**
   * 캐시에서 수어 영상을 가져옵니다
   */
  getCachedSignVideo(text: string): string | null {
    const normalizedText = this.normalizeText(text);
    const expiry = this.cacheExpiry.get(normalizedText);

    if (expiry && Date.now() < expiry) {
      return this.videoCache.get(normalizedText) || null;
    }

    // 캐시가 만료되었으면 제거
    if (expiry) {
      this.videoCache.delete(normalizedText);
      this.cacheExpiry.delete(normalizedText);
    }

    return null;
  }

  /**
   * 캐시를 정리합니다
   */
  clearCache(): void {
    this.videoCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * 만료된 캐시를 정리합니다
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now >= expiry) {
        this.videoCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }

  /**
   * Enhanced mode와 호환되는 텍스트 정규화 (Enhanced mode approach)
   */
  sanitizeTextForFirebase(text: string): string {
    return (text || "").toLowerCase().replace(/[^a-z0-9]/g, "_");
  }

  /**
   * Firebase에서 수어 비디오 URL을 생성합니다 (Enhanced mode approach)
   */
  getFirebaseVideoPath(text: string): string {
    const sanitizedText = this.sanitizeTextForFirebase(text);
    return `sign_videos/${sanitizedText}.mp4`;
  }

  /**
   * Firebase에서 수어 포즈 URL을 생성합니다 (Enhanced mode approach)
   */
  getFirebasePosePath(text: string): string {
    const sanitizedText = this.sanitizeTextForFirebase(text);
    return `sign_poses/${sanitizedText}.pose`;
  }

  /**
   * 캐시 통계를 반환합니다 (Enhanced mode debugging support)
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.videoCache.size,
      entries: Array.from(this.videoCache.keys()),
    };
  }

  /**
   * Enhanced mode 호환성을 위한 캐시 유효성 검사
   */
  isCacheValid(text: string): boolean {
    const normalizedText = this.normalizeText(text);
    const expiry = this.cacheExpiry.get(normalizedText);
    return expiry ? Date.now() < expiry : false;
  }
}

// 싱글톤 인스턴스
export const signHoverService = new SignHoverService();

export default SignHoverService;
