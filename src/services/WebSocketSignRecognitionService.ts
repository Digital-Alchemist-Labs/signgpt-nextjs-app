/**
 * WebSocket Sign Recognition Service
 * signgpt-front 프로젝트의 실시간 WebSocket 기반 수어 인식 시스템을 통합
 */


export interface RecognitionResult {
  recognized_word: string;
  confidence: number;
  timestamp: number;
}

export interface WebSocketMessage {
  type: "keypoints_added" | "recognition_result" | "cleared" | "error";
  total_frames?: number;
  recognized_word?: string;
  confidence?: number;
  timestamp?: number;
  message?: string;
}

export interface WebSocketSignRecognitionOptions {
  serverUrl?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  onConnectionChange?: (connected: boolean) => void;
  onFrameCountUpdate?: (count: number) => void;
  onRecognitionResult?: (result: RecognitionResult) => void;
  onError?: (error: string) => void;
}

export class WebSocketSignRecognitionService {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private options: Required<WebSocketSignRecognitionOptions>;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private frameCount = 0;

  constructor(options: WebSocketSignRecognitionOptions = {}) {
    this.options = {
      serverUrl: options.serverUrl || "", // Will be fetched from API proxy
      autoReconnect: options.autoReconnect ?? true,
      reconnectInterval: options.reconnectInterval || 3000,
      onConnectionChange: options.onConnectionChange || (() => {}),
      onFrameCountUpdate: options.onFrameCountUpdate || (() => {}),
      onRecognitionResult: options.onRecognitionResult || (() => {}),
      onError: options.onError || (() => {}),
    };
  }

  /**
   * WebSocket 연결 시작 (보안 강화된 프록시 방식)
   */
  async connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // API 프록시를 통해 WebSocket URL 가져오기
        if (!this.options.serverUrl) {
          const proxyResponse = await fetch("/api/websocket-proxy");
          if (!proxyResponse.ok) {
            throw new Error("Failed to get WebSocket configuration");
          }
          const { webSocketUrl } = await proxyResponse.json();
          this.options.serverUrl = webSocketUrl;
        }

        console.log("WebSocket 연결 시도 중...", this.options.serverUrl);
        this.ws = new WebSocket(this.options.serverUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          console.log("✅ WebSocket 연결 성공!");
          this.options.onConnectionChange(true);
          resolve();
        };

        this.ws.onclose = (event) => {
          this.isConnected = false;
          console.log("❌ WebSocket 연결 끊김:", event.code, event.reason);
          this.options.onConnectionChange(false);

          // 자동 재연결 시도
          if (this.options.autoReconnect) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error("❌ WebSocket 오류:", error);
          this.isConnected = false;
          this.options.onConnectionChange(false);
          this.options.onError("WebSocket 연결 오류");
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
            this.options.onError("메시지 파싱 오류");
          }
        };
      } catch (error) {
        console.error("Error connecting to WebSocket:", error);
        this.options.onError("WebSocket 연결 실패");
        reject(error);
      }
    });
  }

  /**
   * WebSocket 연결 종료
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.options.onConnectionChange(false);
  }

  /**
   * 재연결 스케줄링
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      console.log("WebSocket 재연결 시도...");
      this.connect().catch((error) => {
        console.error("재연결 실패:", error);
      });
    }, this.options.reconnectInterval);
  }

  /**
   * WebSocket 메시지 처리
   */
  private handleMessage(data: WebSocketMessage): void {
    switch (data.type) {
      case "keypoints_added":
        if (data.total_frames !== undefined) {
          this.frameCount = data.total_frames;
          this.options.onFrameCountUpdate(data.total_frames);
        }
        break;

      case "recognition_result":
        if (
          data.recognized_word !== undefined &&
          data.confidence !== undefined &&
          data.timestamp !== undefined
        ) {
          const result: RecognitionResult = {
            recognized_word: data.recognized_word,
            confidence: data.confidence,
            timestamp: data.timestamp,
          };
          this.options.onRecognitionResult(result);
        }
        break;

      case "cleared":
        this.frameCount = 0;
        this.options.onFrameCountUpdate(0);
        break;

      case "error":
        if (data.message) {
          this.options.onError(data.message);
        }
        break;

      default:
        console.warn("Unknown message type:", data);
    }
  }

  /**
   * 키포인트 데이터 전송
   */
  sendKeypoints(keypoints: number[][]): boolean {
    if (
      !this.isConnected ||
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN
    ) {
      console.warn("WebSocket이 연결되지 않았습니다.");
      return false;
    }

    try {
      this.ws.send(
        JSON.stringify({
          action: "add_keypoints",
          keypoints: keypoints,
        })
      );
      return true;
    } catch (error) {
      console.error("키포인트 전송 실패:", error);
      this.options.onError("키포인트 전송 실패");
      return false;
    }
  }

  /**
   * 수어 인식 요청
   */
  requestRecognition(): boolean {
    if (
      !this.isConnected ||
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN
    ) {
      console.warn("WebSocket이 연결되지 않았습니다.");
      return false;
    }

    try {
      this.ws.send(
        JSON.stringify({
          action: "recognize",
        })
      );
      return true;
    } catch (error) {
      console.error("인식 요청 실패:", error);
      this.options.onError("인식 요청 실패");
      return false;
    }
  }

  /**
   * 키포인트 및 인식 자동 실행 (signgpt-front 방식)
   */
  sendKeypointsAndRecognize(keypoints: number[][]): boolean {
    if (!this.sendKeypoints(keypoints)) {
      return false;
    }

    // 키포인트 전송 후 바로 인식 요청
    setTimeout(() => {
      this.requestRecognition();
    }, 100);

    return true;
  }

  /**
   * 데이터 초기화
   */
  clearData(): boolean {
    if (
      !this.isConnected ||
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN
    ) {
      console.warn("WebSocket이 연결되지 않았습니다.");
      return false;
    }

    try {
      this.ws.send(
        JSON.stringify({
          action: "clear",
        })
      );
      return true;
    } catch (error) {
      console.error("데이터 초기화 실패:", error);
      this.options.onError("데이터 초기화 실패");
      return false;
    }
  }

  /**
   * 연결 상태 확인
   */
  getConnectionStatus(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 현재 프레임 수 반환
   */
  getFrameCount(): number {
    return this.frameCount;
  }

  /**
   * 서버 URL 변경 (재연결 필요)
   */
  setServerUrl(url: string): void {
    this.options.serverUrl = url;
    if (this.isConnected) {
      this.disconnect();
      setTimeout(() => {
        this.connect();
      }, 1000);
    }
  }
}

export default WebSocketSignRecognitionService;
