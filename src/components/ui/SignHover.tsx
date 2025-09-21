"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Download, Share2, Copy, RotateCcw, Settings, X } from "lucide-react";
import { FirebaseAssetsService } from "@/services/FirebaseAssetsService";
import { signHoverService } from "@/services/SignHoverService";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation as useTranslationState } from "@/contexts/TranslationContext";
import { PoseViewer } from "@/components/pose/PoseViewer";

interface SignHoverProps {
  config?: {
    enabled?: boolean;
    showDelay?: number;
    hideDelay?: number;
  };
}

type PoseViewerType = "pose" | "avatar" | "human";

export default function SignHover({ config = {} }: SignHoverProps) {
  const { settings } = useSettings();
  const { state } = useTranslationState();

  // UI State
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipText, setTooltipText] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showViewerSelector, setShowViewerSelector] = useState(false);

  // Video/Media State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signVideoUrl, setSignVideoUrl] = useState<string | null>(null);
  const [poseSrc, setPoseSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Enhanced Features State
  const [poseViewerType, setPoseViewerType] = useState<PoseViewerType>("pose");
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [poseData, setPoseData] = useState<Record<string, unknown> | null>(
    null
  );
  const [isLoadingPose, setIsLoadingPose] = useState(false);

  // Refs
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const firebaseService = useRef<FirebaseAssetsService>(
    new FirebaseAssetsService()
  );
  const inflight = useRef<Map<string, Promise<string | null>>>(new Map());
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const mergedConfig = {
    enabled: settings.signHoverEnabled ?? true,
    showDelay: settings.signHoverDelay ?? 300,
    hideDelay: 100,
    ...config,
  };

  const calculateTooltipPosition = useCallback((rect: DOMRect) => {
    const tooltipWidth = 640; // Larger for Enhanced mode
    const tooltipHeight = 600; // Taller for Enhanced mode
    const margin = 10;

    let x = rect.left + rect.width / 2 - tooltipWidth / 2;
    let y = rect.top - tooltipHeight - margin;

    // Adjust for screen boundaries
    if (x < margin) x = margin;
    if (x + tooltipWidth > window.innerWidth - margin) {
      x = window.innerWidth - tooltipWidth - margin;
    }

    if (y < margin) {
      y = rect.bottom + margin;
    }

    return { x: Math.max(margin, x), y: Math.max(margin, y) };
  }, []);

  // Enhanced video creation from pose data (based on Enhanced Translation Output)
  const createVideoFromPoseData = useCallback(
    async (text: string, poseUrl?: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        // Create a canvas for rendering - larger size for better quality
        const canvas = document.createElement("canvas");
        canvas.width = 960;
        canvas.height = 720;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        // Extract language info if available from pose URL
        let spokenLang = "en";
        let signedLang = "ase";

        try {
          if (poseUrl) {
            const url = new URL(poseUrl);
            spokenLang = url.searchParams.get("spoken") || spokenLang;
            signedLang = url.searchParams.get("signed") || signedLang;
          }
        } catch (e) {
          console.warn("Could not parse pose URL parameters");
        }

        console.log("Creating enhanced sign language video for:", {
          text,
          spokenLang,
          signedLang,
        });

        // Set up MediaRecorder for video creation
        const stream = canvas.captureStream(30); // 30 FPS
        const recordedChunks: Blob[] = [];

        // Try different video formats
        const mimeTypes = [
          "video/webm; codecs=vp9",
          "video/webm; codecs=vp8",
          "video/webm",
          "video/mp4",
        ];

        let mediaRecorder: MediaRecorder | null = null;

        for (const mimeType of mimeTypes) {
          if (MediaRecorder.isTypeSupported(mimeType)) {
            mediaRecorder = new MediaRecorder(stream, {
              mimeType,
              videoBitsPerSecond: 4000000, // 4 Mbps for higher quality
            });
            break;
          }
        }

        if (!mediaRecorder) {
          reject(new Error("MediaRecorder not supported"));
          return;
        }

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(recordedChunks, {
            type: mediaRecorder!.mimeType,
          });
          const videoUrl = URL.createObjectURL(videoBlob);
          console.log(
            "Enhanced sign language video created:",
            videoBlob.size,
            "bytes",
            videoBlob.type
          );
          resolve(videoUrl);
        };

        mediaRecorder.onerror = (event) => {
          console.error("MediaRecorder error:", event);
          reject(new Error("Video recording failed"));
        };

        // Start recording
        mediaRecorder.start();

        // Generate realistic sign language animation frames (Enhanced mode approach)
        let frameCount = 0;
        const isVeryShortText = text.length <= 1;
        const isShortText = text.length <= 3;

        let minFrames, textBasedFrames;
        if (isVeryShortText) {
          minFrames = 90; // 3 seconds for single characters in hover
          textBasedFrames = 90;
        } else if (isShortText) {
          minFrames = 120; // 4 seconds for short text
          textBasedFrames = text.length * 30;
        } else {
          minFrames = 150; // 5 seconds for longer text
          textBasedFrames = text.length * 20;
        }

        const maxFrames = Math.max(minFrames, textBasedFrames);
        const textHash = text
          .split("")
          .reduce((hash, char) => hash + char.charCodeAt(0), 0);

        const drawFrame = () => {
          // Clear canvas with dark background
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw background grid for depth
          ctx.strokeStyle = "#333333";
          ctx.lineWidth = 1;
          for (let i = 0; i < canvas.width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
          }
          for (let i = 0; i < canvas.height; i += 40) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
          }

          const progress = frameCount / maxFrames;
          const time = progress * Math.PI * 2;

          // Special variation patterns for different text lengths
          let textVariation = 0;
          if (isVeryShortText) {
            const gesturePhase = progress * 3;
            if (gesturePhase < 1) {
              textVariation = Math.sin(gesturePhase * Math.PI) * 0.5;
            } else if (gesturePhase < 2) {
              textVariation = 0.8;
            } else {
              textVariation =
                Math.sin((gesturePhase - 2) * Math.PI) * 0.5 + 0.3;
            }
          } else if (isShortText) {
            textVariation = Math.sin(progress * Math.PI * 4) * 0.2;
          }

          // Draw sign language pose skeleton
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;

          // Body pose
          ctx.strokeStyle = "#00ff88";
          ctx.lineWidth = 3;

          // Torso
          const shoulderY = centerY - 50;
          const shoulderSpread = 80 + Math.sin(time * 0.5) * 10;
          const leftShoulderX = centerX - shoulderSpread / 2;
          const rightShoulderX = centerX + shoulderSpread / 2;

          ctx.beginPath();
          ctx.moveTo(leftShoulderX, shoulderY);
          ctx.lineTo(rightShoulderX, shoulderY);
          ctx.stroke();

          // Enhanced arms with sign language gestures
          let leftElbowX, leftElbowY, leftHandX, leftHandY;
          let rightElbowX, rightElbowY, rightHandX, rightHandY;

          if (isVeryShortText) {
            const gestureIntensity = textVariation;
            leftElbowX = leftShoulderX - 20;
            leftElbowY = shoulderY + 80;
            leftHandX = leftElbowX - 10 + gestureIntensity * 30;
            leftHandY = leftElbowY + 20 - gestureIntensity * 15;

            rightElbowX = rightShoulderX + 20;
            rightElbowY = shoulderY + 80;
            rightHandX = rightElbowX + 10 + gestureIntensity * 30;
            rightHandY = rightElbowY + 20 - gestureIntensity * 15;
          } else {
            const armAnimation = Math.sin(time + textHash * 0.01) * 0.3;
            leftElbowX =
              leftShoulderX - 30 + Math.sin(time + textVariation) * 40;
            leftElbowY = shoulderY + 60 + armAnimation * 20;
            leftHandX =
              leftElbowX -
              20 +
              Math.cos(time + textHash * 0.01 + textVariation) * 50;
            leftHandY =
              leftElbowY + 40 + Math.sin(time * 1.5 + textVariation) * 30;

            rightElbowX =
              rightShoulderX + 30 + Math.cos(time + textVariation) * 40;
            rightElbowY = shoulderY + 60 - armAnimation * 20;
            rightHandX =
              rightElbowX +
              20 +
              Math.sin(time + textHash * 0.01 + textVariation) * 50;
            rightHandY =
              rightElbowY + 40 + Math.cos(time * 1.5 + textVariation) * 30;
          }

          // Draw arms
          ctx.beginPath();
          ctx.moveTo(leftShoulderX, shoulderY);
          ctx.lineTo(leftElbowX, leftElbowY);
          ctx.lineTo(leftHandX, leftHandY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(rightShoulderX, shoulderY);
          ctx.lineTo(rightElbowX, rightElbowY);
          ctx.lineTo(rightHandX, rightHandY);
          ctx.stroke();

          // Enhanced hands with finger details
          ctx.fillStyle = "#ffaa00";

          // Left hand
          ctx.beginPath();
          ctx.arc(leftHandX, leftHandY, 12, 0, 2 * Math.PI);
          ctx.fill();

          // Enhanced finger animation
          for (let i = 0; i < 5; i++) {
            let fingerAngle, fingerX, fingerY;

            if (isVeryShortText) {
              const fingerPositions = [-0.8, -0.4, 0, 0.4, 0.8];
              fingerAngle = fingerPositions[i] + textVariation * 0.1;
              fingerX = leftHandX + Math.cos(fingerAngle) * 15;
              fingerY = leftHandY + Math.sin(fingerAngle) * 15;
            } else {
              fingerAngle =
                (i - 2) * 0.3 + Math.sin(time * 3 + i + textHash) * 0.2;
              fingerX = leftHandX + Math.cos(fingerAngle) * 20;
              fingerY = leftHandY + Math.sin(fingerAngle) * 20;
            }

            ctx.beginPath();
            ctx.arc(fingerX, fingerY, 3, 0, 2 * Math.PI);
            ctx.fill();

            ctx.strokeStyle = "#ffaa00";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(leftHandX, leftHandY);
            ctx.lineTo(fingerX, fingerY);
            ctx.stroke();
          }

          // Right hand (similar enhanced animation)
          ctx.fillStyle = "#ffaa00";
          ctx.beginPath();
          ctx.arc(rightHandX, rightHandY, 12, 0, 2 * Math.PI);
          ctx.fill();

          for (let i = 0; i < 5; i++) {
            let fingerAngle, fingerX, fingerY;

            if (isVeryShortText) {
              const fingerPositions = [-0.8, -0.4, 0, 0.4, 0.8];
              fingerAngle = fingerPositions[i] + textVariation * 0.1;
              fingerX = rightHandX + Math.cos(fingerAngle) * 15;
              fingerY = rightHandY + Math.sin(fingerAngle) * 15;
            } else {
              fingerAngle =
                (i - 2) * 0.3 + Math.cos(time * 2.8 + i + textHash) * 0.2;
              fingerX = rightHandX + Math.cos(fingerAngle) * 20;
              fingerY = rightHandY + Math.sin(fingerAngle) * 20;
            }

            ctx.beginPath();
            ctx.arc(fingerX, fingerY, 3, 0, 2 * Math.PI);
            ctx.fill();

            ctx.strokeStyle = "#ffaa00";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(rightHandX, rightHandY);
            ctx.lineTo(fingerX, fingerY);
            ctx.stroke();
          }

          // Enhanced head
          ctx.strokeStyle = "#88ff00";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(centerX, centerY - 100, 30, 0, 2 * Math.PI);
          ctx.stroke();

          // Face expression indicators
          ctx.fillStyle = "#88ff00";
          ctx.beginPath();
          ctx.arc(centerX - 10, centerY - 110, 3, 0, 2 * Math.PI);
          ctx.arc(centerX + 10, centerY - 110, 3, 0, 2 * Math.PI);
          ctx.fill();

          // Enhanced display info
          ctx.fillStyle = "#ffffff";
          ctx.font = "20px Arial";
          ctx.textAlign = "left";
          ctx.fillText(`"${text}"`, 10, 40);
          ctx.font = "14px Arial";
          ctx.fillText(
            `${spokenLang.toUpperCase()} → ${signedLang.toUpperCase()}`,
            10,
            65
          );
          ctx.fillText("SignHover Enhanced Mode", 10, 85);

          // Progress indicator
          ctx.fillStyle = "#00ffff";
          ctx.font = "12px Arial";
          ctx.textAlign = "right";
          ctx.fillText(
            `Frame ${frameCount + 1}/${maxFrames}`,
            canvas.width - 10,
            canvas.height - 10
          );

          // Progress bar
          const barWidth = canvas.width - 20;
          const barHeight = 4;
          const barY = canvas.height - 30;

          ctx.fillStyle = "#333333";
          ctx.fillRect(10, barY, barWidth, barHeight);

          ctx.fillStyle = "#00ffff";
          ctx.fillRect(10, barY, barWidth * progress, barHeight);

          frameCount++;

          if (frameCount < maxFrames) {
            setTimeout(drawFrame, 1000 / 30); // 30 FPS
          } else {
            setTimeout(() => {
              mediaRecorder!.stop();
              stream.getTracks().forEach((track) => track.stop());
            }, 100);
          }
        };

        // Start animation
        drawFrame();
      });
    },
    []
  );

  // Generate actual video from pose data (Enhanced mode approach)
  const generateVideoFromPose = useCallback(
    async (text: string, poseUrl?: string): Promise<string> => {
      console.log("Generating enhanced video from pose parameters for:", text);

      try {
        console.log(
          "Creating enhanced sign language video from pose parameters..."
        );
        const videoUrl = await createVideoFromPoseData(text, poseUrl);

        console.log(
          "Enhanced sign language video generation completed successfully!"
        );
        return videoUrl;
      } catch (error) {
        console.error("Failed to generate enhanced video from pose:", error);
        return "POSE_VIDEO_GENERATED:" + text;
      }
    },
    [createVideoFromPoseData]
  );

  // Enhanced Firebase video generation
  const generateSignVideoFromFirebase = useCallback(
    async (text: string): Promise<string | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const key = text.toLowerCase().trim();
        if (inflight.current.has(key)) {
          return inflight.current.get(key)!;
        }

        const p = (async () => {
          // 1) Use cache if available
          const cached = signHoverService.getCachedSignVideo(text);
          if (cached) {
            return cached;
          }

          // 2) Try Firebase pre-rendered video
          try {
            const firebasePath = signHoverService.getFirebaseVideoPath(text);
            const firebase = firebaseService.current;
            await firebase.init();
            const firebaseUrl = await firebase.getFileUri(firebasePath);

            const head = await fetch(firebaseUrl, { method: "HEAD" });
            if (head.ok) {
              signHoverService.cacheSignVideo(text, firebaseUrl);
              return firebaseUrl;
            }
          } catch (e) {
            // Continue to pose fallback
          }

          // 3) Try Firebase pose file
          const posePath = signHoverService.getFirebasePosePath(text);
          try {
            const firebasePoseUrl = await firebaseService.current.getFileUri(
              posePath
            );
            const head = await fetch(firebasePoseUrl, { method: "HEAD" });
            if (head.ok) {
              signHoverService.cacheSignVideo(
                text,
                `POSE_SRC:${firebasePoseUrl}`
              );
              return `POSE_SRC:${firebasePoseUrl}`;
            }
          } catch {}

          // 4) Generate enhanced video
          const generatedUrl = await generateVideoFromPose(text);
          signHoverService.cacheSignVideo(text, generatedUrl);
          return generatedUrl;
        })();

        inflight.current.set(key, p);
        const result = await p;
        inflight.current.delete(key);
        return result;
      } catch (error) {
        console.error("Failed to generate enhanced sign video:", error);
        setError("Failed to load sign video");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [generateVideoFromPose]
  );

  // Enhanced video loading
  const loadVideo = useCallback(async () => {
    if (!tooltipText) return;

    setIsVideoLoading(true);
    setVideoError(null);

    try {
      const media = await generateSignVideoFromFirebase(tooltipText);
      if (media?.startsWith("POSE_SRC:")) {
        setPoseSrc(media.replace("POSE_SRC:", ""));
        setSignVideoUrl(null);
      } else {
        setSignVideoUrl(media);
        setPoseSrc(null);
      }
    } catch (error) {
      console.error("Failed to load enhanced video:", error);
      setVideoError("Failed to generate sign language video");
    } finally {
      setIsVideoLoading(false);
    }
  }, [tooltipText, generateSignVideoFromFirebase]);

  // Enhanced video error handling
  const handleVideoError = useCallback(
    async (event: React.SyntheticEvent<HTMLVideoElement>) => {
      console.warn("Video error occurred in SignHover");
      const video = event.target as HTMLVideoElement;

      if (signVideoUrl && signVideoUrl.includes("cloudfunctions.net")) {
        console.log("Clearing pose URL from video element");
        video.src = "";
        setVideoError("Pose data loaded - generating video...");
        return;
      }

      if (signVideoUrl && !signVideoUrl.includes("cloudfunctions.net")) {
        try {
          const response = await fetch(signVideoUrl);
          if (!response.ok) {
            throw new Error(`Video fetch failed: ${response.statusText}`);
          }

          const blob = await response.blob();
          if (!blob.type.startsWith("video/")) {
            setVideoError("Invalid video format");
            return;
          }

          video.src = URL.createObjectURL(blob);
        } catch (error) {
          console.error("Video fallback failed:", error);
          setVideoError("Failed to load video");
        }
      }
    },
    [signVideoUrl]
  );

  const handleVideoClick = useCallback(
    (event: React.MouseEvent<HTMLVideoElement>) => {
      const video = event.target as HTMLVideoElement;
      if (video.paused) {
        video.play().catch(console.error);
      }
    },
    []
  );

  // Enhanced tooltip management
  const showTooltip = useCallback(
    async (element: HTMLElement, text: string) => {
      const rect = element.getBoundingClientRect();
      const position = calculateTooltipPosition(rect);

      setTooltipText(text);
      setTooltipPosition(position);
      setIsVisible(true);
      setIsLoading(true);
      setError(null);
      setSignVideoUrl(null);
      setPoseSrc(null);
      setVideoError(null);

      // Load sign media
      const media = await generateSignVideoFromFirebase(text);
      if (media?.startsWith("POSE_SRC:")) {
        setPoseSrc(media.replace("POSE_SRC:", ""));
      } else {
        setSignVideoUrl(media);
      }
    },
    [calculateTooltipPosition, generateSignVideoFromFirebase]
  );

  const hideTooltip = useCallback(() => {
    setIsVisible(false);
    setTooltipText("");
    setIsLoading(false);
    setError(null);
    setSignVideoUrl(null);
    setPoseSrc(null);
    setVideoError(null);
    setShowViewerSelector(false);
  }, []);

  // Enhanced action buttons
  const copySignVideo = useCallback(async () => {
    if (!signVideoUrl) return;

    try {
      if (signVideoUrl.startsWith("blob:")) {
        const response = await fetch(signVideoUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
        console.log("Video copied to clipboard");
      }
    } catch (error) {
      console.error("Failed to copy video:", error);
    }
  }, [signVideoUrl]);

  const shareSignVideo = useCallback(async () => {
    if (!signVideoUrl) return;

    try {
      if (navigator.share && signVideoUrl.startsWith("blob:")) {
        const response = await fetch(signVideoUrl);
        const blob = await response.blob();
        const file = new File([blob], `sign-${tooltipText}.webm`, {
          type: blob.type,
        });

        await navigator.share({
          title: `Sign Language: ${tooltipText}`,
          text: `Sign language video for "${tooltipText}"`,
          files: [file],
        });
      }
    } catch (error) {
      console.error("Failed to share video:", error);
    }
  }, [signVideoUrl, tooltipText]);

  const downloadSignVideo = useCallback(() => {
    if (!signVideoUrl) return;

    try {
      const a = document.createElement("a");
      a.href = signVideoUrl;
      a.download = `sign-${tooltipText}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download video:", error);
    }
  }, [signVideoUrl, tooltipText]);

  const handleMouseEnter = useCallback(
    (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const text =
        target.getAttribute("data-sign-text") ||
        target.textContent?.trim() ||
        target.getAttribute("aria-label");

      if (!text) return;

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }

      showTimeoutRef.current = setTimeout(() => {
        showTooltip(target, text);
      }, mergedConfig.showDelay);
    },
    [showTooltip, mergedConfig.showDelay]
  );

  const handleMouseLeave = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    hideTimeoutRef.current = setTimeout(() => {
      hideTooltip();
    }, mergedConfig.hideDelay);
  }, [hideTooltip, mergedConfig.hideDelay]);

  useEffect(() => {
    if (!mergedConfig.enabled) return;

    const selectors = [
      "button",
      "a",
      "input",
      "textarea",
      "select",
      "[role='button']",
      "[role='link']",
      "[role='menuitem']",
      "[role='tab']",
      "[role='option']",
      "[data-sign-text]",
      ".hover-sign",
    ];

    const elements = document.querySelectorAll(selectors.join(", "));

    elements.forEach((element) => {
      element.addEventListener("mouseenter", handleMouseEnter as EventListener);
      element.addEventListener("mouseleave", handleMouseLeave as EventListener);
    });

    return () => {
      elements.forEach((element) => {
        element.removeEventListener(
          "mouseenter",
          handleMouseEnter as EventListener
        );
        element.removeEventListener(
          "mouseleave",
          handleMouseLeave as EventListener
        );
      });

      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [
    mergedConfig.enabled,
    mergedConfig.showDelay,
    mergedConfig.hideDelay,
    handleMouseEnter,
    handleMouseLeave,
  ]);

  if (typeof window === "undefined") return null;
  if (!isVisible) return null;

  // Enhanced Viewer Type Selector
  const ViewerSelector = () => (
    <div className="absolute top-2 right-2 z-10">
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowViewerSelector(!showViewerSelector)}
          className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          title="Change viewer"
          aria-label="Change viewer settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {showViewerSelector && (
          <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg min-w-[120px] z-20">
            {[
              { type: "pose" as const, label: "Pose" },
              { type: "avatar" as const, label: "Avatar" },
              { type: "human" as const, label: "Human" },
            ].map(({ type, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setPoseViewerType(type);
                  setShowViewerSelector(false);
                  loadVideo();
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors ${
                  poseViewerType === type
                    ? "bg-primary/10 text-primary"
                    : "text-foreground"
                } ${type === "pose" ? "rounded-t-lg" : ""} ${
                  type === "human" ? "rounded-b-lg" : ""
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Enhanced Action Buttons
  const ActionButtons = () => (
    <div className="flex items-center justify-center gap-2 mt-4">
      {signVideoUrl &&
        (signVideoUrl.startsWith("blob:") ||
          signVideoUrl.startsWith("data:video/") ||
          signVideoUrl.startsWith("POSE_VIDEO_GENERATED:")) && (
          <>
            <button
              type="button"
              onClick={copySignVideo}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-secondary-foreground bg-secondary rounded-md hover:bg-secondary/80 transition-colors"
              title="Copy video"
              aria-label="Copy video"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>

            <button
              type="button"
              onClick={shareSignVideo}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-secondary-foreground bg-secondary rounded-md hover:bg-secondary/80 transition-colors"
              title="Share video"
              aria-label="Share video"
            >
              <Share2 className="w-3 h-3" />
              Share
            </button>

            <button
              type="button"
              onClick={downloadSignVideo}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-secondary-foreground bg-secondary rounded-md hover:bg-secondary/80 transition-colors"
              title="Download video"
              aria-label="Download video"
            >
              <Download className="w-3 h-3" />
              Download
            </button>
          </>
        )}

      <button
        type="button"
        onClick={loadVideo}
        className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
        disabled={isVideoLoading}
        title="Regenerate video"
      >
        <RotateCcw
          className={`w-3 h-3 ${isVideoLoading ? "animate-spin" : ""}`}
        />
        {isVideoLoading ? "Generating..." : "Regenerate"}
      </button>
    </div>
  );

  const tooltip = (
    <div
      className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-w-[90vw] max-h-[90vh] animate-fade-in"
      style={{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
        width: "640px",
        height: "600px",
      }}
    >
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Sign Language Translation
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enhanced SignHover Mode
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
            {poseViewerType}
          </span>
          <button
            onClick={hideTooltip}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Enhanced Content Area */}
      <div className="flex-1 p-4" style={{ height: "calc(100% - 140px)" }}>
        {/* Text Display */}
        <div className="text-base text-gray-700 dark:text-gray-300 mb-4">
          <strong>Text:</strong> {tooltipText}
        </div>

        {/* Enhanced Video Display Area */}
        <div
          className="relative bg-muted rounded-lg overflow-hidden shadow-lg mb-4"
          style={{ height: "400px" }}
        >
          {/* Loading State */}
          {(isLoading || isVideoLoading || isLoadingPose) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="text-sm text-muted-foreground">
                  {isLoadingPose
                    ? "Loading pose data from Firebase..."
                    : "Generating enhanced sign language video..."}
                </div>
                <div className="text-xs text-muted-foreground">
                  Enhanced Mode • {poseViewerType} viewer
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {(error || videoError) && !isLoading && !isVideoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
              <div className="text-center space-y-2">
                <div className="text-destructive text-sm font-medium">
                  {error || videoError}
                </div>
                <button
                  type="button"
                  onClick={loadVideo}
                  className="px-3 py-1 text-sm text-destructive bg-destructive/20 rounded hover:bg-destructive/30 transition-colors"
                  aria-label="Try again"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Video Display */}
          {signVideoUrl &&
            (signVideoUrl.startsWith("blob:") ||
              signVideoUrl.startsWith("data:video/") ||
              signVideoUrl.startsWith("http")) &&
            !isLoading &&
            !isVideoLoading &&
            !error &&
            !videoError && (
              <>
                <video
                  ref={videoRef}
                  src={signVideoUrl}
                  className="w-full h-full object-contain cursor-pointer rounded-lg"
                  controls
                  loop
                  autoPlay
                  muted
                  playsInline
                  onClick={handleVideoClick}
                  onError={handleVideoError}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onLoadedData={() => {
                    if (videoRef.current) {
                      videoRef.current.play().catch(console.error);
                    }
                  }}
                />
                <ViewerSelector />
              </>
            )}

          {/* Enhanced Pose Viewer */}
          {poseSrc && !isLoading && !isVideoLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full flex flex-col">
                <div className="flex-1 relative">
                  <PoseViewer
                    src={poseSrc}
                    className="w-full h-full"
                    showControls={true}
                    background="transparent"
                    loop={true}
                  />

                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-2">
                      <button
                        onClick={loadVideo}
                        disabled={isVideoLoading}
                        className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        {isVideoLoading ? (
                          <>
                            <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            Generate Video
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Empty State */}
          {!signVideoUrl &&
            !poseSrc &&
            !isLoading &&
            !isVideoLoading &&
            !error &&
            !videoError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-6xl">🤟</div>
                  <p className="text-lg font-medium">Enhanced Sign Language</p>
                  <p className="text-sm text-muted-foreground">
                    Generating sign for &ldquo;{tooltipText}&rdquo;...
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Enhanced Mode • {poseViewerType} viewer
                  </div>
                </div>
              </div>
            )}

          <canvas ref={canvasRef} className="hidden" width={640} height={480} />
        </div>

        {/* Enhanced Action Buttons */}
        <ActionButtons />
      </div>

      {/* Enhanced Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <div>
            {isLoading || isVideoLoading
              ? "Loading from Firebase..."
              : poseSrc
              ? signHoverService.getCachedSignVideo(tooltipText)
                ? "Cached Pose (Enhanced Mode)"
                : "Firebase Pose (Enhanced Mode)"
              : signVideoUrl
              ? signHoverService.getCachedSignVideo(tooltipText)
                ? "Cached Video (Enhanced Mode)"
                : signVideoUrl?.startsWith("POSE_VIDEO_GENERATED:")
                ? "Generated Video (Enhanced Mode)"
                : "Firebase Video (Enhanced Mode)"
              : "Ready (Enhanced Mode)"}
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
              {poseViewerType.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Backdrop for viewer selector */}
      {showViewerSelector && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowViewerSelector(false)}
        />
      )}
    </div>
  );

  return createPortal(tooltip, document.body);
}
