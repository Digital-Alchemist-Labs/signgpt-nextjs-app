/**
 * Integrated Sign Recognition Service
 * 기존 OpenVINO 기반 서비스와 새로운 WebSocket 기반 서비스를 통합
 */

import { EstimatedPose } from "./PoseService";
import { environment } from "@/config/environment";
import OpenVinoSignRecognitionService, {
  SignRecognitionResult as OpenVinoResult,
} from "./OpenVinoSignRecognitionService";
import WebSocketSignRecognitionService, {
  RecognitionResult as WebSocketResult,
} from "./WebSocketSignRecognitionService";

export interface SignRecognitionResult {
  text: string;
  confidence: number;
  timestamp: Date;
  recognizedWords?: string[];
  source?: "openvino" | "websocket";
}

export interface SignRecognitionOptions {
  language?: string;
  signLanguage?: string;
  minConfidence?: number;
  recognitionMode?: "openvino" | "websocket" | "hybrid";
}

export interface RecognitionSession {
  isActive: boolean;
  history: SignRecognitionResult[];
  startTime?: Date;
  endTime?: Date;
}

export class IntegratedSignRecognitionService {
  private readonly apiBaseUrl: string;
  private readonly defaultOptions: SignRecognitionOptions = {
    language: "ko",
    signLanguage: "ksl",
    minConfidence: 0.5,
    recognitionMode: "hybrid", // 기본값을 hybrid로 설정
  };

  // 서비스 인스턴스들
  private openVinoService: OpenVinoSignRecognitionService;
  private webSocketService: WebSocketSignRecognitionService | null = null;

  // 세션 관리
  private currentSession: RecognitionSession = {
    isActive: false,
    history: [],
  };

  // 콜백 함수들
  private onRecognitionResult?: (result: SignRecognitionResult) => void;
  private onConnectionChange?: (connected: boolean) => void;
  private onFrameCountUpdate?: (count: number) => void;
  private onError?: (error: string) => void;

  // 상태 관리
  private recognizedWords: string[] = [];
  private lastRecognitionTime = 0;
  private readonly recognitionInterval = 1000;

  constructor(
    apiBaseUrl?: string,
    options: {
      onRecognitionResult?: (result: SignRecognitionResult) => void;
      onConnectionChange?: (connected: boolean) => void;
      onFrameCountUpdate?: (count: number) => void;
      onError?: (error: string) => void;
    } = {}
  ) {
    this.apiBaseUrl =
      apiBaseUrl ||
      environment.apiBaseUrl ||
      environment.signGptClientUrl ||
      "http://localhost:8001";

    // 콜백 함수 설정
    this.onRecognitionResult = options.onRecognitionResult;
    this.onConnectionChange = options.onConnectionChange;
    this.onFrameCountUpdate = options.onFrameCountUpdate;
    this.onError = options.onError;

    // OpenVINO 서비스 초기화
    this.openVinoService = new OpenVinoSignRecognitionService();
  }

  /**
   * WebSocket 서비스 초기화 및 연결
   */
  async initializeWebSocket(serverUrl?: string): Promise<void> {
    if (this.webSocketService) {
      this.webSocketService.disconnect();
    }

    this.webSocketService = new WebSocketSignRecognitionService({
      serverUrl,
      onConnectionChange: (connected) => {
        console.log("WebSocket connection status:", connected);
        this.onConnectionChange?.(connected);
      },
      onFrameCountUpdate: (count) => {
        this.onFrameCountUpdate?.(count);
      },
      onRecognitionResult: (result) => {
        const signResult: SignRecognitionResult = {
          text: result.recognized_word,
          confidence: result.confidence,
          timestamp: new Date(result.timestamp * 1000),
          recognizedWords: [result.recognized_word],
          source: "websocket",
        };

        // 세션이 활성화된 경우 히스토리에 추가
        if (this.currentSession.isActive) {
          this.currentSession.history.push(signResult);
        }

        this.onRecognitionResult?.(signResult);
      },
      onError: (error) => {
        console.error("WebSocket error:", error);
        this.onError?.(error);
      },
    });

    try {
      await this.webSocketService.connect();
      console.log("WebSocket service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize WebSocket service:", error);
      this.onError?.("WebSocket 연결 실패");
      throw error;
    }
  }

  /**
   * 세션 시작
   */
  startSession(): void {
    console.log("수어 인식 세션 시작");
    this.currentSession = {
      isActive: true,
      history: [],
      startTime: new Date(),
    };

    // WebSocket 데이터 초기화
    if (this.webSocketService) {
      this.webSocketService.clearData();
    }

    // OpenVINO 버퍼 초기화
    this.openVinoService.clearBuffer();
    this.recognizedWords = [];
  }

  /**
   * 세션 종료
   */
  endSession(): RecognitionSession {
    console.log("수어 인식 세션 종료");
    this.currentSession.isActive = false;
    this.currentSession.endTime = new Date();

    const session = { ...this.currentSession };

    // 세션 데이터 초기화
    this.currentSession = {
      isActive: false,
      history: [],
    };

    return session;
  }

  /**
   * 포즈 데이터 추가 (모든 모드에서 사용)
   */
  addPose(pose: EstimatedPose): void {
    // OpenVINO 서비스에 포즈 추가
    this.openVinoService.addPose(pose);
  }

  /**
   * 키포인트 직접 전송 (WebSocket 모드용)
   */
  sendKeypoints(keypoints: number[][]): boolean {
    if (!this.webSocketService) {
      console.warn("WebSocket service not initialized");
      return false;
    }

    return this.webSocketService.sendKeypointsAndRecognize(keypoints);
  }

  /**
   * 통합 인식 처리
   */
  async processBuffer(
    options?: SignRecognitionOptions
  ): Promise<SignRecognitionResult | null> {
    const opts = { ...this.defaultOptions, ...options };
    const now = Date.now();

    // 너무 자주 처리하지 않도록 제한
    if (now - this.lastRecognitionTime < this.recognitionInterval) {
      return null;
    }

    switch (opts.recognitionMode) {
      case "openvino":
        return this.processOpenVinoRecognition(opts);

      case "websocket":
        // WebSocket 모드에서는 키포인트가 자동으로 전송되고 결과가 콜백으로 처리됨
        return null;

      case "hybrid":
      default:
        // Hybrid 모드: WebSocket이 연결되어 있으면 WebSocket 사용, 아니면 OpenVINO 사용
        if (
          this.webSocketService &&
          this.webSocketService.getConnectionStatus()
        ) {
          return null; // WebSocket으로 처리됨
        } else {
          return this.processOpenVinoRecognition(opts);
        }
    }
  }

  /**
   * OpenVINO 기반 인식 처리
   */
  private async processOpenVinoRecognition(
    options: SignRecognitionOptions
  ): Promise<SignRecognitionResult | null> {
    const now = Date.now();
    this.lastRecognitionTime = now;

    if (!this.openVinoService.isReady()) {
      return null;
    }

    const bufferStatus = this.openVinoService.getBufferStatus();
    if (!bufferStatus.ready) {
      return null;
    }

    try {
      const openVinoResult = await this.openVinoService.recognizeSign();

      if (
        !openVinoResult ||
        openVinoResult.confidence < (options.minConfidence || 0.5)
      ) {
        return null;
      }

      // 인식된 단어 누적
      this.recognizedWords.push(openVinoResult.word);
      console.log(
        "Recognized word:",
        openVinoResult.word,
        "Confidence:",
        openVinoResult.confidence
      );

      let resultText = openVinoResult.word;

      // 충분한 단어가 모이면 LLM으로 자연어 생성
      if (this.recognizedWords.length >= 3) {
        const naturalText = await this.processWordsWithLLM(
          this.recognizedWords
        );
        if (naturalText) {
          resultText = naturalText;
        }
      }

      const result: SignRecognitionResult = {
        text: resultText,
        confidence: openVinoResult.confidence,
        timestamp: openVinoResult.timestamp,
        recognizedWords: [...this.recognizedWords],
        source: "openvino",
      };

      // 세션이 활성화된 경우 히스토리에 추가
      if (this.currentSession.isActive) {
        this.currentSession.history.push(result);
      }

      // 자연어 문장을 생성했으면 단어 버퍼 초기화
      if (
        this.recognizedWords.length >= 3 &&
        resultText !== openVinoResult.word
      ) {
        this.recognizedWords = [];
      }

      return result;
    } catch (error) {
      console.error("Sign recognition failed:", error);
      this.onError?.("수어 인식 실패");
      return null;
    }
  }

  /**
   * LLM을 사용한 자연어 문장 생성
   */
  private async processWordsWithLLM(words: string[]): Promise<string | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `다음 수어 단어들을 자연스러운 문장으로 만들어주세요: ${words.join(
            ", "
          )}`,
          context: "sign_language_processing",
        }),
      });

      if (!response.ok) {
        console.warn("LLM API not available, using word concatenation");
        return words.join(" ");
      }

      const data = await response.json();
      return data.content || words.join(" ");
    } catch (error) {
      console.warn("LLM processing failed, using word concatenation:", error);
      return words.join(" ");
    }
  }

  /**
   * 버퍼 및 데이터 초기화
   */
  clearBuffer(): void {
    this.openVinoService.clearBuffer();
    this.recognizedWords = [];
    this.lastRecognitionTime = 0;

    if (this.webSocketService) {
      this.webSocketService.clearData();
    }
  }

  /**
   * 현재 인식 상태 반환
   */
  getRecognitionStatus(): {
    isReady: boolean;
    bufferStatus: { current: number; required: number; ready: boolean };
    recognizedWords: string[];
    webSocketConnected: boolean;
    currentSession: RecognitionSession;
    frameCount: number;
  } {
    return {
      isReady: this.openVinoService.isReady(),
      bufferStatus: this.openVinoService.getBufferStatus(),
      recognizedWords: [...this.recognizedWords],
      webSocketConnected: this.webSocketService?.getConnectionStatus() || false,
      currentSession: { ...this.currentSession },
      frameCount: this.webSocketService?.getFrameCount() || 0,
    };
  }

  /**
   * WebSocket 서비스 연결 해제
   */
  disconnectWebSocket(): void {
    if (this.webSocketService) {
      this.webSocketService.disconnect();
      this.webSocketService = null;
    }
  }

  /**
   * 서비스 종료 및 정리
   */
  destroy(): void {
    this.disconnectWebSocket();
    this.clearBuffer();

    if (this.currentSession.isActive) {
      this.endSession();
    }
  }

  /**
   * API 가용성 확인
   */
  async checkApiAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`, {
        method: "GET",
        timeout: 5000,
      } as RequestInit);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default IntegratedSignRecognitionService;
