/**
 * SimpleSignCamera - 수어 인식을 위한 간단한 카메라 컴포넌트
 * VideoPoseProcessor의 복잡한 UI 없이 카메라만 표시
 */

"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import { usePose } from "@/contexts/PoseContext";
import { EstimatedPose } from "@/services/PoseService";

export interface SimpleSignCameraProps {
  className?: string;
  onPoseDetected?: (pose: EstimatedPose) => void;
  isRecording: boolean;
}

export const SimpleSignCamera: React.FC<SimpleSignCameraProps> = ({
  className = "",
  onPoseDetected,
  isRecording,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { state, loadModel, processPoseFromVideo } = usePose();

  // 카메라 시작
  const startCamera = useCallback(async () => {
    try {
      setError(null);

      // MediaPipe 모델 로딩을 시도하되, 실패해도 카메라는 켜기
      if (!state.isLoaded) {
        try {
          await loadModel();
        } catch (modelError) {
          console.warn(
            "MediaPipe model loading failed, continuing with camera only:",
            modelError
          );
          // 모델 로딩 실패해도 카메라는 계속 진행
        }
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      if (videoRef.current) {
        const video = videoRef.current;

        // Set video properties before setting source
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;

        // Set the media stream
        video.srcObject = mediaStream;

        // Wait for video to be ready and play
        const playVideo = async () => {
          try {
            // Check if video already has metadata
            if (video.readyState >= 1) {
              console.log("Video metadata already available:", {
                width: video.videoWidth,
                height: video.videoHeight,
                readyState: video.readyState,
              });
            } else {
              // Wait for loadedmetadata event with improved error handling
              await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                  console.warn(
                    "Video metadata loading timeout, attempting to continue..."
                  );
                  // Don't reject immediately, try to continue if video seems ready
                  if (video.readyState >= 1 && video.videoWidth > 0) {
                    console.log(
                      "Video appears ready despite timeout, continuing..."
                    );
                    resolve(undefined);
                  } else {
                    reject(new Error("Video metadata loading timeout"));
                  }
                }, 15000); // Increased timeout to 15 seconds

                video.onloadedmetadata = () => {
                  clearTimeout(timeout);
                  console.log("Video metadata loaded:", {
                    width: video.videoWidth,
                    height: video.videoHeight,
                    readyState: video.readyState,
                  });
                  resolve(undefined);
                };

                video.onerror = (event) => {
                  clearTimeout(timeout);
                  console.error("Video loading error:", event);
                  reject(new Error("Video loading error"));
                };

                // Also listen for canplay event as fallback
                video.oncanplay = () => {
                  if (video.videoWidth > 0 && video.videoHeight > 0) {
                    clearTimeout(timeout);
                    console.log("Video can play (fallback):", {
                      width: video.videoWidth,
                      height: video.videoHeight,
                      readyState: video.readyState,
                    });
                    resolve(undefined);
                  }
                };
              });
            }

            // Ensure video is still in DOM and try to play
            if (document.contains(video)) {
              try {
                await video.play();
                console.log("Video started playing successfully");

                // Verify playback after a short delay
                setTimeout(() => {
                  if (document.contains(video)) {
                    console.log("Video playback verification:", {
                      paused: video.paused,
                      ended: video.ended,
                      currentTime: video.currentTime,
                      readyState: video.readyState,
                      videoWidth: video.videoWidth,
                      videoHeight: video.videoHeight,
                    });

                    // If still paused, try to play again
                    if (video.paused && !video.ended) {
                      console.log("Video paused unexpectedly, restarting...");
                      video.play().catch((playError) => {
                        if (playError.name !== "AbortError") {
                          console.error("Video restart failed:", playError);
                        }
                      });
                    }
                  }
                }, 200);
              } catch (playError) {
                // Handle different types of play errors
                const errorName =
                  playError instanceof Error ? playError.name : "Unknown";
                if (errorName === "NotAllowedError") {
                  console.warn(
                    "Autoplay prevented by browser policy, user interaction required"
                  );
                  setError(
                    "브라우저에서 자동 재생이 차단되었습니다. 화면을 클릭해주세요."
                  );
                } else if (errorName === "AbortError") {
                  console.log("Video play aborted (normal during cleanup)");
                } else {
                  console.error("Video play failed:", playError);
                  setError(
                    "비디오 재생에 실패했습니다. 카메라를 다시 시도해주세요."
                  );
                }
                throw playError;
              }
            }
          } catch (error) {
            const errorName = error instanceof Error ? error.name : "Unknown";
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            if (errorName !== "AbortError") {
              console.error("Video setup failed:", error);
              if (!errorMessage.includes("자동 재생이 차단")) {
                setError(
                  "카메라 비디오 재생에 실패했습니다. 페이지를 새로고침하고 다시 시도해주세요."
                );
              }
            }
            throw error;
          }
        };

        // Start video playback with retry logic
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            await playVideo();
            break; // Success, exit retry loop
          } catch (playError) {
            retryCount++;
            console.warn(
              `Video playback attempt ${retryCount}/${maxRetries} failed:`,
              playError
            );

            if (retryCount >= maxRetries) {
              throw playError; // Re-throw the last error
            }

            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      setStream(mediaStream);
      console.log("Camera stream set successfully:", {
        tracks: mediaStream.getTracks().length,
        videoTracks: mediaStream.getVideoTracks().length,
      });
    } catch (error) {
      console.error("Failed to start camera:", error);

      // Provide more specific error messages
      const errorName = error instanceof Error ? error.name : "Unknown";
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorName === "NotAllowedError") {
        setError(
          "카메라 접근 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요."
        );
      } else if (errorName === "NotFoundError") {
        setError(
          "카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요."
        );
      } else if (errorName === "NotReadableError") {
        setError(
          "카메라가 다른 애플리케이션에서 사용 중입니다. 다른 프로그램을 종료하고 다시 시도해주세요."
        );
      } else if (errorMessage.includes("timeout")) {
        setError(
          "카메라 초기화 시간이 초과되었습니다. 페이지를 새로고침하고 다시 시도해주세요."
        );
      } else if (errorMessage.includes("자동 재생이 차단")) {
        // Error already set in playVideo function
      } else {
        setError(
          "카메라에 접근할 수 없습니다. 브라우저를 새로고침하고 다시 시도해주세요."
        );
      }
    }
  }, [state.isLoaded, loadModel]);

  // 카메라 정지
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      // Pause video first to prevent AbortError
      videoRef.current.pause();

      // Wait for pause to complete before cleaning up
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.load();
        }
      }, 10);
    }
  }, [stream]);

  // 포즈 처리
  const processCurrentFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.paused || video.ended || !isRecording) {
      console.log("Skipping frame processing:", {
        hasVideo: !!video,
        paused: video?.paused,
        ended: video?.ended,
        isRecording,
      });
      return;
    }

    // Check video dimensions before processing
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      // Only log once per session to avoid console spam
      if (!video.dataset.dimensionWarningLogged) {
        console.log("Video dimensions not ready, waiting for video to load:", {
          width: video.videoWidth,
          height: video.videoHeight,
          readyState: video.readyState,
        });
        video.dataset.dimensionWarningLogged = "true";
      }
      return;
    }

    // Clear the warning flag once video is ready
    if (video.dataset.dimensionWarningLogged) {
      console.log("Video dimensions now ready:", {
        width: video.videoWidth,
        height: video.videoHeight,
        readyState: video.readyState,
      });
      delete video.dataset.dimensionWarningLogged;
    }

    try {
      // MediaPipe가 로드되지 않았으면 포즈 처리 건너뛰기
      if (!state.isLoaded) {
        console.log("MediaPipe not loaded, skipping pose processing");
        return;
      }

      console.log("Processing frame for pose detection...");
      await processPoseFromVideo(video);

      if (onPoseDetected && state.currentPose) {
        console.log("Pose detected, calling onPoseDetected");
        onPoseDetected(state.currentPose);
      } else {
        console.log("No pose detected or no callback");
      }
    } catch (error) {
      // Native 에러는 조용히 무시 (MediaPipe 관련 에러)
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage && errorMessage.includes("abort")) {
        console.warn("MediaPipe processing aborted, skipping frame");
        return;
      }

      // Check for ROI dimension errors specifically
      if (
        errorMessage &&
        errorMessage.includes("ROI width and height must be > 0")
      ) {
        console.warn("MediaPipe ROI dimension error, video not ready yet");
        return;
      }

      console.error("Failed to process pose:", error);
    }
  }, [
    processPoseFromVideo,
    onPoseDetected,
    state.currentPose,
    isRecording,
    state.isLoaded,
  ]);

  // 녹화 상태에 따라 카메라 시작/정지
  useEffect(() => {
    if (isRecording && !stream) {
      startCamera();
    } else if (!isRecording && stream) {
      stopCamera();
    }
  }, [isRecording, stream, startCamera, stopCamera]);

  // 포즈 감지 루프 및 비디오 상태 모니터링
  useEffect(() => {
    if (!isRecording) return;

    const frameInterval = setInterval(processCurrentFrame, 100); // 10fps

    // Video health check - ensure video stays playing
    const healthCheckInterval = setInterval(() => {
      const video = videoRef.current;
      if (video && stream && isRecording) {
        // Check if video got paused unexpectedly
        if (video.paused && !video.ended && video.readyState > 0) {
          console.log("Video paused unexpectedly, attempting to resume...");
          video.play().catch((error) => {
            if (error.name !== "AbortError") {
              console.warn("Auto-resume failed:", error);
            }
          });
        }

        // Check if video lost its source
        if (!video.srcObject && stream) {
          console.log("Video lost source, reattaching stream...");
          video.srcObject = stream;
        }
      }
    }, 1000); // Check every second

    return () => {
      clearInterval(frameInterval);
      clearInterval(healthCheckInterval);
    };
  }, [isRecording, processCurrentFrame, stream]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className={`simple-sign-camera ${className}`}>
      <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
          controls={false}
          style={{
            transform: "scaleX(-1)", // 거울 효과
            backgroundColor: "#000", // 검은 배경으로 비디오 영역 확인
          }}
          onLoadedMetadata={() => console.log("Video metadata loaded event")}
          onCanPlay={() => console.log("Video can play event")}
          onPlay={() => console.log("Video play event")}
          onError={(e) => console.error("Video error:", e)}
        />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/10">
            <div className="text-center text-red-500 p-4">
              <p className="text-sm mb-3">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  if (stream) {
                    stopCamera();
                  }
                  setTimeout(() => {
                    startCamera();
                  }, 500);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                카메라 재시작
              </button>
            </div>
          </div>
        )}

        {!stream && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center text-muted-foreground">
              <div className="w-12 h-12 border-2 border-muted-foreground rounded-full flex items-center justify-center mx-auto mb-2">
                📹
              </div>
              <p className="text-sm">카메라 준비 중...</p>
            </div>
          </div>
        )}

        {/* 녹화 상태 표시 */}
        {isRecording && stream && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            REC
          </div>
        )}

        {/* 디버깅 정보 표시 */}
        {stream && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-xs">
            <div>Camera: {stream ? "✓" : "✗"}</div>
            <div>MediaPipe: {state.isLoaded ? "✓" : "✗"}</div>
            <div>Processing: {state.isProcessing ? "✓" : "✗"}</div>
            {state.error && (
              <div className="text-red-400">Error: {state.error}</div>
            )}
          </div>
        )}

        {/* 비디오 재생 버튼 (일시정지 상태이거나 에러 상태일 때) */}
        {isRecording && stream && (videoRef.current?.paused || error) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center">
              <button
                onClick={async () => {
                  if (videoRef.current) {
                    try {
                      console.log("Manual play button clicked");
                      setError(null);

                      // Reset video if needed
                      if (videoRef.current.readyState === 0) {
                        console.log("Resetting video source...");
                        const currentStream = videoRef.current
                          .srcObject as MediaStream;
                        videoRef.current.srcObject = null;
                        videoRef.current.load();
                        await new Promise((resolve) =>
                          setTimeout(resolve, 100)
                        );
                        videoRef.current.srcObject = currentStream;

                        // Wait for metadata to load again
                        await new Promise((resolve) => {
                          videoRef.current!.onloadedmetadata = () =>
                            resolve(undefined);
                        });
                      }

                      await videoRef.current.play();
                      console.log("Video resumed successfully");
                    } catch (error) {
                      console.error("Failed to resume video:", error);
                      setError(
                        "비디오 재생에 실패했습니다. 카메라 권한을 확인해주세요."
                      );
                    }
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-full flex items-center gap-3 transition-colors shadow-lg"
              >
                <div className="w-0 h-0 border-l-[16px] border-l-white border-y-[8px] border-y-transparent ml-1"></div>
                카메라 시작
              </button>
              {error && (
                <p className="mt-3 text-sm text-red-400 max-w-xs">{error}</p>
              )}
              <p className="mt-2 text-xs text-gray-400 max-w-xs">
                카메라가 검은 화면으로 표시되면 이 버튼을 클릭하세요
              </p>
            </div>
          </div>
        )}

        {/* 테스트 버튼 (MediaPipe 없이 테스트) */}
        {isRecording && !state.isLoaded && (
          <div className="absolute bottom-4 left-4">
            <button
              onClick={() => {
                console.log("Test button clicked - simulating pose detection");
                if (onPoseDetected) {
                  // Mock pose data for testing
                  const mockPose = {
                    faceLandmarks: [],
                    poseLandmarks: [],
                    leftHandLandmarks: Array.from({ length: 21 }, (_, i) => ({
                      x: Math.random(),
                      y: Math.random(),
                      z: Math.random(),
                    })),
                    rightHandLandmarks: Array.from({ length: 21 }, (_, i) => ({
                      x: Math.random(),
                      y: Math.random(),
                      z: Math.random(),
                    })),
                    image: document.createElement("canvas"),
                  };
                  onPoseDetected(mockPose);
                }
              }}
              className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
            >
              Test Recognition
            </button>
          </div>
        )}
      </div>

      {/* 상태 정보 */}
      {state.error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          포즈 감지 오류: {state.error}
        </div>
      )}
    </div>
  );
};

export default SimpleSignCamera;
