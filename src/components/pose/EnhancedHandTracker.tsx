"use client";

import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

interface HandTrackerProps {
  onKeypointsDetected: (keypoints: number[][]) => void;
  isRecording: boolean;
  showKeypoints?: boolean; // 키포인트 표시 여부를 제어하는 prop 추가
}

export interface HandTrackerRef {
  startTracking: () => void;
  stopTracking: () => void;
  retryCamera: () => void;
  startAutoRecording: () => void;
  stopAutoRecording: () => void;
}

const HandTracker = forwardRef<HandTrackerRef, HandTrackerProps>(
  ({ onKeypointsDetected, isRecording, showKeypoints = true }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const handsRef = useRef<unknown>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);
    const mediaPipeRef = useRef<unknown>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [elementsReady, setElementsReady] = useState(false);
    const [isAutoRecording, setIsAutoRecording] = useState(false);
    const lastRecognitionTime = useRef<number>(0);
    const recognitionInterval = 2000; // 2초
    const collectedKeypoints = useRef<number[][]>([]);

    // MediaPipe 라이브러리 동적 로드 (Holistic 사용)
    const loadMediaPipe = async () => {
      if (mediaPipeRef.current) return mediaPipeRef.current;

      try {
        console.log("MediaPipe Holistic 라이브러리 로딩 중...");

        // 방법 1: npm 패키지 시도
        try {
          console.log("MediaPipe Holistic npm 패키지 로딩 시도...");

          const holisticModule = await import("@mediapipe/holistic");
          const drawingUtilsModule = await import("@mediapipe/drawing_utils");

          console.log("MediaPipe 모듈 구조:", {
            holisticKeys: Object.keys(holisticModule),
            drawingKeys: Object.keys(drawingUtilsModule),
          });

          // 더 포괄적인 방식으로 함수 찾기
          // Holistic 클래스 찾기
          const holisticClass =
            holisticModule.Holistic ||
            holisticModule.default?.Holistic ||
            holisticModule.default ||
            (typeof holisticModule.default === "function"
              ? holisticModule.default
              : null);

          const Holistic = holisticClass;

          // Drawing utilities 찾기
          const drawConnectorsFunc =
            drawingUtilsModule.drawConnectors ||
            drawingUtilsModule.default?.drawConnectors;
          const drawConnectors = drawConnectorsFunc;
          const drawLandmarksFunc =
            drawingUtilsModule.drawLandmarks ||
            drawingUtilsModule.default?.drawLandmarks;

          const drawLandmarks = drawLandmarksFunc;

          // Connections 찾기
          const handConnections =
            holisticModule.HAND_CONNECTIONS ||
            holisticModule.default?.HAND_CONNECTIONS;
          const HAND_CONNECTIONS = handConnections;
          const poseConnections =
            holisticModule.POSE_CONNECTIONS ||
            holisticModule.default?.POSE_CONNECTIONS;
          const POSE_CONNECTIONS = poseConnections;
          const facemeshContours =
            holisticModule.FACEMESH_CONTOURS ||
            holisticModule.default?.FACEMESH_CONTOURS;
          const FACEMESH_CONTOURS = facemeshContours;

          if (Holistic && typeof Holistic === "function") {
            mediaPipeRef.current = {
              Holistic,
              drawConnectors,
              drawLandmarks,
              HAND_CONNECTIONS,
              POSE_CONNECTIONS,
              FACEMESH_CONTOURS,
            };

            console.log(
              "✅ MediaPipe Holistic 라이브러리 로딩 성공 (npm 패키지)"
            );
            return mediaPipeRef.current;
          }
        } catch (npmError) {
          console.warn("❌ Holistic npm 패키지 로딩 실패:", npmError);
        }

        // 방법 2: window 객체에서 MediaPipe 확인 (CDN 로드된 경우)
        if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).Holistic) {
          console.log("CDN에서 로드된 MediaPipe Holistic 사용");
          mediaPipeRef.current = {
            Holistic: (window as unknown as Record<string, unknown>).Holistic,
            drawConnectors: (window as unknown as Record<string, unknown>).drawConnectors,
            drawLandmarks: (window as unknown as Record<string, unknown>).drawLandmarks,
            HAND_CONNECTIONS: (window as unknown as Record<string, unknown>).HAND_CONNECTIONS,
            POSE_CONNECTIONS: (window as unknown as Record<string, unknown>).POSE_CONNECTIONS,
            FACEMESH_CONTOURS: (window as unknown as Record<string, unknown>).FACEMESH_CONTOURS,
          };

          console.log("MediaPipe Holistic 라이브러리 로딩 완료 (CDN)");
          return mediaPipeRef.current;
        }

        // MediaPipe 없이도 카메라는 작동하도록 fallback
        console.warn(
          "⚠️ MediaPipe Holistic 라이브러리 로딩 실패, 카메라만 표시됩니다."
        );
        mediaPipeRef.current = {
          Holistic: null,
          drawConnectors: null,
          drawLandmarks: null,
          HAND_CONNECTIONS: null,
          POSE_CONNECTIONS: null,
          FACEMESH_CONTOURS: null,
        };
        return mediaPipeRef.current;
      } catch (error) {
        console.error("MediaPipe Holistic 라이브러리 로딩 실패:", error);
        throw new Error("MediaPipe Holistic 라이브러리를 로드할 수 없습니다.");
      }
    };

    // 키포인트를 리스트로 변환 (카메라 반전에 맞춰 x좌표 반전)
    const landmarkToList = (landmarks: Array<{x: number; y: number; z?: number}>) => {
      const keypoints: number[] = [];
      for (let i = 0; i < 21; i++) {
        // x 좌표를 반전시켜서 카메라 반전과 일치시킴 (MediaPipe 좌표는 0~1 범위)
        const flippedX = 1 - landmarks[i].x;
        keypoints.push(flippedX, landmarks[i].y);
      }
      return keypoints;
    };

    // 컴포넌트 마운트 후 DOM 요소 준비 상태를 true로 설정
    useEffect(() => {
      console.log("컴포넌트 마운트됨 - DOM 요소 준비 상태를 true로 설정");
      setElementsReady(true);
    }, []);

    // 카메라 초기화 함수
    const initializeCamera = async () => {
      console.log("카메라 초기화 시작...");

      // DOM 요소 재확인 및 대기
      let retryCount = 0;
      const maxRetries = 20;

      while (
        (!videoRef.current || !canvasRef.current) &&
        retryCount < maxRetries
      ) {
        console.log(`DOM 요소 재확인 중... (${retryCount + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, 50));
        retryCount++;
      }

      if (!videoRef.current || !canvasRef.current) {
        throw new Error("DOM 요소를 찾을 수 없습니다.");
      }

      console.log("DOM 요소 확인 완료");

      // MediaPipe 라이브러리 로드
      const mediaPipe = await loadMediaPipe();

      // 브라우저 카메라 지원 확인
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("이 브라우저는 카메라를 지원하지 않습니다.");
      }

      console.log("카메라 권한 요청 중...");

      // 카메라 스트림 시작
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: "user", // 전면 카메라 우선
          frameRate: { ideal: 30, min: 15 },
        },
        audio: false,
      });

      console.log("카메라 스트림 획득 성공");

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      // 비디오 자동 재생 설정
      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;

      await new Promise((resolve, reject) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            console.log("비디오 메타데이터 로딩 완료");
            resolve(undefined);
          };

          videoRef.current.onerror = (error) => {
            console.error("비디오 로딩 오류:", error);
            reject(error);
          };

          // 비디오 재생 시작
          videoRef.current.play().catch((playError) => {
            console.error("비디오 재생 오류:", playError);
          });

          // 타임아웃 추가
          setTimeout(() => reject(new Error("비디오 로딩 타임아웃")), 10000);
        }
      });

      // MediaPipe Holistic 모델 초기화
      let holistic: unknown = null;
      const typedMediaPipe = mediaPipe as Record<string, unknown>;
      if (typedMediaPipe.Holistic && typeof typedMediaPipe.Holistic === "function") {
        console.log("MediaPipe Holistic 모델 초기화 중...");
        holistic = new (typedMediaPipe.Holistic as new (config: unknown) => unknown)({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
          },
        });

        const typedHolistic = holistic as Record<string, unknown>;
        (typedHolistic.setOptions as (options: Record<string, unknown>) => void)({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          refineFaceLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        (typedHolistic.onResults as (callback: (results: Record<string, unknown>) => void) => void)((results: Record<string, unknown>) => {
          if (!canvasRef.current || !videoRef.current) return;

          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          // 캔버스 클리어
          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // 비디오 프레임 그리기
          try {
            if (results.image) {
              ctx.drawImage(results.image as CanvasImageSource, 0, 0, canvas.width, canvas.height);
            } else if (videoRef.current.readyState >= 2) {
              ctx.drawImage(
                videoRef.current,
                0,
                0,
                canvas.width,
                canvas.height
              );
            }
          } catch (drawError) {
            console.error("캔버스 그리기 오류:", drawError);
          }

          // 키포인트 표시가 활성화된 경우에만 랜드마크 그리기
          if (showKeypoints) {
            // 얼굴 랜드마크 그리기
            if (
              results.faceLandmarks &&
              typedMediaPipe.drawConnectors &&
              typedMediaPipe.FACEMESH_CONTOURS
            ) {
              (typedMediaPipe.drawConnectors as (ctx: CanvasRenderingContext2D, landmarks: unknown, connections: unknown, options?: unknown) => void)(
                ctx,
                results.faceLandmarks,
                typedMediaPipe.FACEMESH_CONTOURS,
                {
                  color: "#C0C0C070",
                  lineWidth: 1,
                }
              );
            }

            // 포즈(상반신) 랜드마크 그리기
            if (
              results.poseLandmarks &&
              typedMediaPipe.drawConnectors &&
              typedMediaPipe.POSE_CONNECTIONS
            ) {
              (typedMediaPipe.drawConnectors as (ctx: CanvasRenderingContext2D, landmarks: unknown, connections: unknown, options?: unknown) => void)(
                ctx,
                results.poseLandmarks,
                typedMediaPipe.POSE_CONNECTIONS,
                {
                  color: "#00CEFF",
                  lineWidth: 2,
                }
              );
              if (typedMediaPipe.drawLandmarks) {
                (typedMediaPipe.drawLandmarks as (ctx: CanvasRenderingContext2D, landmarks: unknown, options?: unknown) => void)(ctx, results.poseLandmarks, {
                  color: "#FF0000",
                  lineWidth: 1,
                  radius: 2,
                });
              }
            }

            // 손 랜드마크 그리기 (왼손)
            if (
              results.leftHandLandmarks &&
              typedMediaPipe.drawConnectors &&
              typedMediaPipe.HAND_CONNECTIONS
            ) {
              (typedMediaPipe.drawConnectors as (ctx: CanvasRenderingContext2D, landmarks: unknown, connections: unknown, options?: unknown) => void)(
                ctx,
                results.leftHandLandmarks,
                typedMediaPipe.HAND_CONNECTIONS,
                {
                  color: "#CC0000",
                  lineWidth: 2,
                }
              );
              if (typedMediaPipe.drawLandmarks) {
                (typedMediaPipe.drawLandmarks as (ctx: CanvasRenderingContext2D, landmarks: unknown, options?: unknown) => void)(ctx, results.leftHandLandmarks, {
                  color: "#00FF00",
                  lineWidth: 1,
                  radius: 3,
                });
              }
            }

            // 손 랜드마크 그리기 (오른손)
            if (
              results.rightHandLandmarks &&
              typedMediaPipe.drawConnectors &&
              typedMediaPipe.HAND_CONNECTIONS
            ) {
              (typedMediaPipe.drawConnectors as (ctx: CanvasRenderingContext2D, landmarks: unknown, connections: unknown, options?: unknown) => void)(
                ctx,
                results.rightHandLandmarks,
                typedMediaPipe.HAND_CONNECTIONS,
                {
                  color: "#0000CC",
                  lineWidth: 2,
                }
              );
              if (typedMediaPipe.drawLandmarks) {
                (typedMediaPipe.drawLandmarks as (ctx: CanvasRenderingContext2D, landmarks: unknown, options?: unknown) => void)(ctx, results.rightHandLandmarks, {
                  color: "#00FF00",
                  lineWidth: 1,
                  radius: 3,
                });
              }
            }
          }

          // 키포인트 추출 및 전송 (손 키포인트만 서버로 전송)
          if (results.leftHandLandmarks && results.rightHandLandmarks) {
            const leftHand = landmarkToList(results.leftHandLandmarks as Array<{x: number; y: number; z?: number}>);
            const rightHand = landmarkToList(results.rightHandLandmarks as Array<{x: number; y: number; z?: number}>);
            const combinedKeypoints = [...leftHand, ...rightHand];

            // 자동 녹화 모드일 때 키포인트 수집
            if (isAutoRecording) {
              collectedKeypoints.current.push(combinedKeypoints);

              // 2초마다 수집된 키포인트 전송
              const currentTime = Date.now();
              if (
                currentTime - lastRecognitionTime.current >=
                recognitionInterval
              ) {
                if (collectedKeypoints.current.length > 0) {
                  console.log(
                    `2초간 수집된 손 키포인트 전송: ${collectedKeypoints.current.length}개 프레임`
                  );
                  onKeypointsDetected(collectedKeypoints.current);
                  collectedKeypoints.current = []; // 전송 후 초기화
                }
                lastRecognitionTime.current = currentTime;
              }
            }

            // 기존 녹화 모드 (버튼 기반)
            if (isRecording) {
              onKeypointsDetected([combinedKeypoints]);
            }
          }

          ctx.restore();
        });

        // 비디오 처리 시작
        const processVideo = async () => {
          if (!videoRef.current || !holistic) return;

          if (videoRef.current.readyState >= 2) {
            try {
              const holisticTyped = holistic as Record<string, unknown>;
              await (holisticTyped.send as (data: {image: HTMLVideoElement}) => Promise<void>)({ image: videoRef.current });
            } catch (error) {
              console.error("비디오 프레임 처리 오류:", error);
            }
          }

          animationRef.current = requestAnimationFrame(processVideo);
        };

        processVideo();
      } else {
        // MediaPipe 없이 카메라만 표시하는 fallback
        console.log("MediaPipe 없이 카메라 피드만 표시합니다.");

        const drawVideoFrame = () => {
          if (!canvasRef.current || !videoRef.current) return;

          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (!ctx || videoRef.current.readyState < 2) return;

          try {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          } catch (error) {
            console.error("비디오 프레임 그리기 오류:", error);
          }

          requestAnimationFrame(drawVideoFrame);
        };

        drawVideoFrame();
      }

      handsRef.current = holistic;
      setIsInitialized(true);
    };

    // MediaPipe 초기화
    useEffect(() => {
      if (!elementsReady) return;

      const initializeMediaPipe = async () => {
        try {
          await initializeCamera();

          // 카메라 초기화 완료 후 자동으로 자동 녹화 모드 시작
          console.log("카메라 초기화 완료 - 자동 녹화 모드 시작");
          setIsAutoRecording(true);
          lastRecognitionTime.current = Date.now();
          collectedKeypoints.current = [];
        } catch (err: unknown) {
          console.error("MediaPipe initialization error:", err);
          let errorMessage = "카메라 초기화에 실패했습니다.";

          if ((err as Error).name === "NotAllowedError") {
            errorMessage =
              "카메라 접근 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.";
          } else if ((err as Error).name === "NotFoundError") {
            errorMessage =
              "카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.";
          } else if ((err as Error).name === "NotReadableError") {
            errorMessage = "카메라가 다른 애플리케이션에서 사용 중입니다.";
          } else if ((err as Error).name === "OverconstrainedError") {
            errorMessage = "요청한 카메라 설정을 지원하지 않습니다.";
          } else if ((err as Error).message) {
            errorMessage = (err as Error).message;
          }

          setError(errorMessage);
        }
      };

      const timer = setTimeout(() => {
        initializeMediaPipe();
      }, 50);

      return () => {
        clearTimeout(timer);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };
    }, [elementsReady, initializeCamera]);

    // 카메라 재시작 함수
    const retryCamera = async () => {
      console.log("카메라 재시작 시작...");
      setIsRetrying(true);
      setError(null);
      setIsInitialized(false);

      // 기존 스트림 정리
      if (streamRef.current) {
        console.log("기존 스트림 정리 중...");
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // 애니메이션 정리
      if (animationRef.current) {
        console.log("애니메이션 정리 중...");
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      // MediaPipe 정리
      if (handsRef.current) {
        console.log("MediaPipe 정리 중...");
        handsRef.current = null;
      }

      // 잠시 대기 후 재초기화
      setTimeout(async () => {
        try {
          console.log("카메라 재초기화 시작...");
          setIsRetrying(false);
          await initializeCamera();
        } catch (err: unknown) {
          console.error("카메라 재시작 실패:", err);
          setIsRetrying(false);

          let errorMessage = "카메라 재시작에 실패했습니다.";
          if ((err as Error).name === "NotAllowedError") {
            errorMessage =
              "카메라 접근 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.";
          } else if ((err as Error).name === "NotFoundError") {
            errorMessage =
              "카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.";
          } else if ((err as Error).name === "NotReadableError") {
            errorMessage = "카메라가 다른 애플리케이션에서 사용 중입니다.";
          } else if ((err as Error).message) {
            errorMessage = (err as Error).message;
          }

          setError(errorMessage);
        }
      }, 1000);
    };

    // 외부에서 호출할 수 있는 메서드들
    useImperativeHandle(ref, () => ({
      startTracking: () => {
        console.log("Tracking started");
      },
      stopTracking: () => {
        console.log("Tracking stopped");
      },
      retryCamera: retryCamera,
      startAutoRecording: () => {
        console.log("자동 녹화 시작");
        setIsAutoRecording(true);
        lastRecognitionTime.current = Date.now();
        collectedKeypoints.current = [];
      },
      stopAutoRecording: () => {
        console.log("자동 녹화 중지");
        setIsAutoRecording(false);
        collectedKeypoints.current = [];
      },
    }));

    if (error) {
      return (
        <div className="w-full h-80 bg-red-100 border border-red-300 rounded-lg flex items-center justify-center">
          <div className="text-red-600 text-center">
            <p className="font-semibold">오류 발생</p>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={retryCamera}
              disabled={isRetrying}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isRetrying ? "재시도 중..." : "카메라 재시작"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full">
        {/* DOM 요소는 항상 렌더링하되, 숨김 처리 */}
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="w-full h-auto bg-black rounded-lg border-2 border-white/20"
          style={{ maxHeight: "400px", transform: "scaleX(-1)" }}
        />

        {/* 로딩 오버레이 */}
        {(!elementsReady || !isInitialized) && (
          <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-gray-600 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>
                {!elementsReady ? "DOM 요소 준비 중..." : "카메라 초기화 중..."}
              </p>
            </div>
          </div>
        )}

        {/* 녹화 상태 표시 */}
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            REC
          </div>
        )}

        {/* 자동 녹화 상태 표시 */}
        {isAutoRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            AUTO REC
          </div>
        )}

        {/* 키포인트 감지 가이드 */}
        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
          얼굴과 양손을 화면에 보여주세요
        </div>
      </div>
    );
  }
);

HandTracker.displayName = "HandTracker";

export default HandTracker;
