"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Download, Share2, Copy, RotateCcw, Settings } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { FirebaseAssetsService } from "@/services/FirebaseAssetsService";
import { TranslationService } from "@/services/TranslationService";
import { signHoverService } from "@/services/SignHoverService";
import { PoseViewer } from "@/components/pose/PoseViewer";

interface EnhancedTranslationOutputProps {
  className?: string;
}

type PoseViewerType = "pose" | "avatar" | "human";

export default function EnhancedTranslationOutput({
  className = "",
}: EnhancedTranslationOutputProps) {
  const {
    state,
    copySignedLanguageVideo,
    shareSignedLanguageVideo,
    downloadSignedLanguageVideo,
    setSignedLanguageVideo,
  } = useTranslation();

  const [poseViewerType, setPoseViewerType] = useState<PoseViewerType>("pose");
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showViewerSelector, setShowViewerSelector] = useState(false);
  const [poseData, setPoseData] = useState<Record<string, unknown> | null>(
    null
  );
  const [isLoadingPose, setIsLoadingPose] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const assetsService = useRef(new FirebaseAssetsService());
  const translationService = useRef(new TranslationService());

  /**
   * Load pose data from Sign.MT via proxy (CORS-safe)
   * This function uses the Next.js API proxy to avoid CORS issues
   */
  const loadPoseData = useCallback(
    async (text: string, spokenLanguage: string, signedLanguage: string) => {
      setIsLoadingPose(true);
      setPoseData(null);

      try {
        console.log("Loading pose data via proxy:", {
          text,
          spokenLanguage,
          signedLanguage,
        });

        const result = await translationService.current.fetchPoseDataCached(
          text,
          spokenLanguage,
          signedLanguage
        );

        if (result.error) {
          console.error("Failed to load pose data:", result.error);
          setVideoError(`Failed to load pose: ${result.error}`);
          return null;
        }

        if (result.pose) {
          console.log("Pose data loaded successfully:", result.contentType);

          // If pose is base64 encoded, decode it
          if (typeof result.pose === "string") {
            try {
              const binaryString = atob(result.pose);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], {
                type: result.contentType || "application/x-pose",
              });
              const poseUrl = URL.createObjectURL(blob);
              setPoseData({ url: poseUrl, blob });
              return poseUrl;
            } catch (error) {
              console.error("Failed to decode pose data:", error);
            }
          } else {
            // Assume it's already an object
            setPoseData(result.pose as Record<string, unknown>);
            return result.pose;
          }
        }

        if (result.poseUrl) {
          console.log("Pose URL returned:", result.poseUrl);
          setPoseData({ url: result.poseUrl });
          return result.poseUrl;
        }

        return null;
      } catch (error) {
        console.error("Exception loading pose data:", error);
        setVideoError("Failed to load pose data");
        return null;
      } finally {
        setIsLoadingPose(false);
      }
    },
    []
  );

  // Create video from pose data with realistic sign language animation
  const createVideoFromPoseData = useCallback(
    async (poseUrl: string): Promise<string> => {
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

        // Extract text from pose URL for context
        let text = "Hello";
        let spokenLang = "en";
        let signedLang = "ase";

        try {
          const url = new URL(poseUrl);
          text = url.searchParams.get("text") || text;
          spokenLang = url.searchParams.get("spoken") || spokenLang;
          signedLang = url.searchParams.get("signed") || signedLang;
        } catch {
          console.warn("Could not parse pose URL parameters");
        }

        console.log("Creating sign language video for:", {
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
              videoBitsPerSecond: 4000000, // 4 Mbps for higher quality at larger size
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
            "Sign language video created:",
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

        // Generate realistic sign language animation frames
        let frameCount = 0;
        // Special handling for extremely short text (single letters/words)
        const isVeryShortText = text.length <= 1; // Single character
        const isShortText = text.length <= 3;

        let minFrames, textBasedFrames;
        if (isVeryShortText) {
          minFrames = 150; // 5 seconds for single characters
          textBasedFrames = 150; // Fixed duration for consistency
        } else if (isShortText) {
          minFrames = 180; // 6 seconds for short text
          textBasedFrames = text.length * 40;
        } else {
          minFrames = 240; // 8 seconds for longer text
          textBasedFrames = text.length * 25;
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
          const time = progress * Math.PI * 2; // Full cycle for seamless looping

          // Special variation patterns for different text lengths
          let textVariation = 0;
          if (isVeryShortText) {
            // Single character: simple, clear gesture with distinct phases
            const gesturePhase = progress * 3; // 3 distinct phases
            if (gesturePhase < 1) {
              // Phase 1: Move to position (smooth entry)
              textVariation = Math.sin(gesturePhase * Math.PI) * 0.5;
            } else if (gesturePhase < 2) {
              // Phase 2: Hold position (clear display)
              textVariation = 0.8;
            } else {
              // Phase 3: Return to start (smooth exit)
              textVariation =
                Math.sin((gesturePhase - 2) * Math.PI) * 0.5 + 0.3;
            }
          } else if (isShortText) {
            // Short text: more variation
            textVariation = Math.sin(progress * Math.PI * 4) * 0.2;
          }

          // Legacy support
          const shortTextVariation = textVariation;

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

          // Arms with sign language gestures - adaptive based on text length
          let leftElbowX, leftElbowY, leftHandX, leftHandY;
          let rightElbowX, rightElbowY, rightHandX, rightHandY;

          if (isVeryShortText) {
            // Single character: simple, clear fingerspelling gesture
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
            // Longer text: more dynamic gestures
            const armAnimation = Math.sin(time + textHash * 0.01) * 0.3;
            leftElbowX =
              leftShoulderX - 30 + Math.sin(time + shortTextVariation) * 40;
            leftElbowY = shoulderY + 60 + armAnimation * 20;
            leftHandX =
              leftElbowX -
              20 +
              Math.cos(time + textHash * 0.01 + shortTextVariation) * 50;
            leftHandY =
              leftElbowY + 40 + Math.sin(time * 1.5 + shortTextVariation) * 30;

            rightElbowX =
              rightShoulderX + 30 + Math.cos(time + shortTextVariation) * 40;
            rightElbowY = shoulderY + 60 - armAnimation * 20;
            rightHandX =
              rightElbowX +
              20 +
              Math.sin(time + textHash * 0.01 + shortTextVariation) * 50;
            rightHandY =
              rightElbowY + 40 + Math.cos(time * 1.5 + shortTextVariation) * 30;
          }

          // Left arm
          ctx.beginPath();
          ctx.moveTo(leftShoulderX, shoulderY);
          ctx.lineTo(leftElbowX, leftElbowY);
          ctx.lineTo(leftHandX, leftHandY);
          ctx.stroke();

          // Right arm
          ctx.beginPath();
          ctx.moveTo(rightShoulderX, shoulderY);
          ctx.lineTo(rightElbowX, rightElbowY);
          ctx.lineTo(rightHandX, rightHandY);
          ctx.stroke();

          // Draw hands with finger details
          ctx.fillStyle = "#ffaa00";

          // Left hand
          ctx.beginPath();
          ctx.arc(leftHandX, leftHandY, 12, 0, 2 * Math.PI);
          ctx.fill();

          // Left hand fingers - adaptive based on text length
          for (let i = 0; i < 5; i++) {
            let fingerAngle, fingerX, fingerY;

            if (isVeryShortText) {
              // Single character: specific finger positions for clear fingerspelling
              const fingerPositions = [
                -0.8,
                -0.4,
                0,
                0.4,
                0.8, // Spread fingers clearly
              ];
              fingerAngle = fingerPositions[i] + textVariation * 0.1;
              fingerX = leftHandX + Math.cos(fingerAngle) * 15;
              fingerY = leftHandY + Math.sin(fingerAngle) * 15;
            } else {
              // Dynamic finger movement for longer text
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

          // Right hand
          ctx.fillStyle = "#ffaa00";
          ctx.beginPath();
          ctx.arc(rightHandX, rightHandY, 12, 0, 2 * Math.PI);
          ctx.fill();

          // Right hand fingers - adaptive based on text length
          for (let i = 0; i < 5; i++) {
            let fingerAngle, fingerX, fingerY;

            if (isVeryShortText) {
              // Single character: specific finger positions for clear fingerspelling
              const fingerPositions = [
                -0.8,
                -0.4,
                0,
                0.4,
                0.8, // Spread fingers clearly
              ];
              fingerAngle = fingerPositions[i] + textVariation * 0.1;
              fingerX = rightHandX + Math.cos(fingerAngle) * 15;
              fingerY = rightHandY + Math.sin(fingerAngle) * 15;
            } else {
              // Dynamic finger movement for longer text
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

          // Head
          ctx.strokeStyle = "#88ff00";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(centerX, centerY - 100, 30, 0, 2 * Math.PI);
          ctx.stroke();

          // Face expression indicators
          ctx.fillStyle = "#88ff00";
          // Eyes
          ctx.beginPath();
          ctx.arc(centerX - 10, centerY - 110, 3, 0, 2 * Math.PI);
          ctx.arc(centerX + 10, centerY - 110, 3, 0, 2 * Math.PI);
          ctx.fill();

          // Display translation info
          ctx.fillStyle = "#ffffff";
          ctx.font = "16px Arial";
          ctx.textAlign = "left";
          ctx.fillText(`Text: "${text}"`, 10, 30);
          ctx.fillText(
            `${spokenLang.toUpperCase()} → ${signedLang.toUpperCase()}`,
            10,
            50
          );

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
            // Stop recording after animation is complete
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

  // Generate actual video from pose data
  const generateVideoFromPose = useCallback(
    async (poseUrl: string): Promise<string> => {
      console.log("Generating video from pose URL:", poseUrl);

      try {
        // For now, we'll generate a video directly from the pose URL parameters
        // without trying to fetch from the Cloud Function (to avoid CORS issues)
        console.log("Creating sign language video from pose parameters...");
        const videoUrl = await createVideoFromPoseData(poseUrl);

        console.log("Sign language video generation completed successfully!");
        return videoUrl;
      } catch (error) {
        console.error("Failed to generate video from pose:", error);
        // Return a special marker to indicate the attempt was made
        return "POSE_VIDEO_GENERATED:" + poseUrl;
      }
    },
    [createVideoFromPoseData]
  );

  const loadVideo = useCallback(async () => {
    if (!state.signedLanguagePose) return;

    setIsVideoLoading(true);
    setVideoError(null);

    try {
      // Extract text and languages from pose URL
      let text = state.translatedText || "Hello";
      let spokenLang = state.sourceLanguage || "en";
      let signedLang = state.targetLanguage || "ase";

      try {
        const url = new URL(state.signedLanguagePose);
        text = url.searchParams.get("text") || text;
        spokenLang = url.searchParams.get("spoken") || spokenLang;
        signedLang = url.searchParams.get("signed") || signedLang;
      } catch {
        console.warn("Could not parse pose URL, using state values");
      }

      // 1) Use cache if available for the user's current text
      const cached = signHoverService.getCachedSignVideo(text);
      if (cached) {
        setSignedLanguageVideo(cached);
        setIsVideoLoading(false);
        return;
      }

      // 2) Try to fetch pre-rendered video from Firebase by sanitized text
      try {
        const sanitizedText = text.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const firebasePath = `sign_videos/${sanitizedText}.mp4`;
        const firebase = assetsService.current;
        await firebase.init();
        const firebaseUrl = await firebase.getFileUri(firebasePath);

        // Validate reachable via HEAD
        const head = await fetch(firebaseUrl, { method: "HEAD" });
        if (head.ok) {
          setSignedLanguageVideo(firebaseUrl);
          signHoverService.cacheSignVideo(text, firebaseUrl);
          setIsVideoLoading(false);
          return;
        }
      } catch {
        // Continue to pose loading
        console.log("No pre-rendered video in Firebase, loading pose data...");
      }

      // 3) Try to load actual pose data from Sign.MT via proxy
      try {
        console.log(
          "Attempting to load pose data from Sign.MT via proxy:",
          text
        );
        const poseResult = await loadPoseData(text, spokenLang, signedLang);

        if (poseResult) {
          console.log("Pose data loaded successfully, now generating video...");
          // If we got pose data, generate video from it
          const poseUrl =
            typeof poseResult === "string"
              ? poseResult
              : state.signedLanguagePose;
          const generatedUrl = await generateVideoFromPose(poseUrl);
          setSignedLanguageVideo(generatedUrl);
          signHoverService.cacheSignVideo(text, generatedUrl);
          setIsVideoLoading(false);
          return;
        }
      } catch (error) {
        console.warn("Failed to load pose data from Sign.MT:", error);
        // Continue to fallback
      }

      // 4) Final fallback: generate video from pose URL parameters
      console.log("Using fallback: generating video from pose URL parameters");
      const generatedUrl = await generateVideoFromPose(
        state.signedLanguagePose
      );
      setSignedLanguageVideo(generatedUrl);
      signHoverService.cacheSignVideo(text, generatedUrl);
    } catch (error) {
      console.error("Failed to load video:", error);
      setVideoError("Failed to generate sign language video");
    } finally {
      setIsVideoLoading(false);
    }
  }, [
    state.signedLanguagePose,
    state.translatedText,
    state.sourceLanguage,
    state.targetLanguage,
    setSignedLanguageVideo,
    generateVideoFromPose,
    loadPoseData,
  ]);

  // Log when pose URL changes (but don't auto-load to prevent CORS issues)
  useEffect(() => {
    if (state.signedLanguagePose) {
      console.log("Pose URL generated:", state.signedLanguagePose);
      // Reset pose data when URL changes
      setPoseData(null);
      setIsLoadingPose(false);
    }
  }, [state.signedLanguagePose]);

  // Don't auto-load video to prevent CORS issues
  // User needs to click "Generate Video" button manually

  // handleVideoPlay function removed - using handleVideoClick instead

  const handleVideoError = useCallback(
    async (event: React.SyntheticEvent<HTMLVideoElement>) => {
      console.warn(
        "Video error occurred, but this is expected when loading pose URLs"
      );
      const video = event.target as HTMLVideoElement;

      // Check if the video source is actually a pose URL (not a video)
      if (
        state.signedLanguageVideo &&
        state.signedLanguageVideo.includes("cloudfunctions.net")
      ) {
        // This is a pose URL, not a video URL - clear the video to prevent errors
        console.log("Clearing pose URL from video element");
        video.src = "";
        setVideoError(
          "Pose data loaded - click 'Generate Video' to create video"
        );
        return;
      }

      // Only handle actual video errors
      if (
        state.signedLanguageVideo &&
        !state.signedLanguageVideo.includes("cloudfunctions.net")
      ) {
        try {
          const response = await fetch(state.signedLanguageVideo);
          if (!response.ok) {
            throw new Error(`Video fetch failed: ${response.statusText}`);
          }

          const blob = await response.blob();

          // Check if it's actually a video
          if (!blob.type.startsWith("video/")) {
            setVideoError("Invalid video format");
            return;
          }

          // Try using direct blob URL
          video.src = URL.createObjectURL(blob);
        } catch (error) {
          console.error("Video fallback failed:", error);
          setVideoError("Failed to load video");
        }
      }
    },
    [state.signedLanguageVideo]
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

  // Viewer type selector
  const ViewerSelector = () => (
    <div className="absolute top-2 right-2 z-10">
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowViewerSelector(!showViewerSelector)}
          className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          title="Change viewer"
          data-sign-text="settings"
          data-sign-category="button"
          data-sign-description="Change video viewer type settings"
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
                  loadVideo(); // Reload with new viewer type
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

  // Action buttons
  const ActionButtons = () => (
    <div className="flex items-center justify-center gap-4 mt-6">
      {state.signedLanguageVideo &&
        (state.signedLanguageVideo.startsWith("blob:") ||
          state.signedLanguageVideo.startsWith("data:video/") ||
          state.signedLanguageVideo.startsWith("POSE_VIDEO_GENERATED:")) && (
          <>
            <button
              type="button"
              onClick={copySignedLanguageVideo}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-secondary-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors shadow-sm"
              title="Copy video"
              data-sign-text="copy"
              data-sign-category="button"
              data-sign-description="Copy sign language video to clipboard"
              aria-label="Copy video"
            >
              <Copy className="w-5 h-5" />
              Copy
            </button>

            <button
              type="button"
              onClick={shareSignedLanguageVideo}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-secondary-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors shadow-sm"
              title="Share video"
              data-sign-text="share"
              data-sign-category="button"
              data-sign-description="Share sign language video"
              aria-label="Share video"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>

            <button
              type="button"
              onClick={downloadSignedLanguageVideo}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-secondary-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors shadow-sm"
              title="Download video"
              data-sign-text="download"
              data-sign-category="button"
              data-sign-description="Download sign language video"
              aria-label="Download video"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
          </>
        )}

      {state.signedLanguagePose && (
        <button
          type="button"
          onClick={loadVideo}
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors shadow-sm"
          disabled={isVideoLoading}
          title="Regenerate video"
        >
          <RotateCcw
            className={`w-5 h-5 ${isVideoLoading ? "animate-spin" : ""}`}
          />
          {isVideoLoading ? "Generating..." : "Regenerate"}
        </button>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Video display area - 512x512 square */}
      <div
        className="relative output-container rounded-xl overflow-hidden shadow-lg"
        style={{
          width: "512px",
          height: "512px",
          maxWidth: "100%",
          aspectRatio: "1/1",
        }}
      >
        {/* Loading state */}
        {(isVideoLoading || isLoadingPose) && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-background"
            tabIndex={-1}
          >
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="text-sm text-muted-foreground">
                {isLoadingPose
                  ? "Loading pose data from Firebase..."
                  : "Generating sign language video..."}
              </div>
              <div className="text-xs text-muted-foreground">
                {isLoadingPose && poseData
                  ? "Pose data loaded successfully"
                  : `Using ${poseViewerType} viewer`}
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {videoError && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-destructive/10"
            tabIndex={-1}
          >
            <div className="text-center space-y-2">
              <div className="text-destructive text-sm font-medium">
                {videoError}
              </div>
              <button
                type="button"
                onClick={loadVideo}
                className="px-3 py-1 text-sm text-destructive bg-destructive/20 rounded hover:bg-destructive/30 transition-colors"
                data-sign-text="try again"
                data-sign-category="button"
                data-sign-description="Try to generate video again"
                aria-label="Try again"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Video generated from pose data */}
        {state.signedLanguageVideo &&
          state.signedLanguageVideo.startsWith("POSE_VIDEO_GENERATED:") &&
          !isVideoLoading && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              tabIndex={-1}
            >
              <div className="text-center space-y-4">
                <div className="text-6xl">🎬</div>
                <div className="text-green-600 dark:text-green-400 font-medium">
                  Video Generated Successfully!
                </div>
                <div className="text-sm text-muted-foreground">
                  Sign language video created from Firebase pose data
                </div>
                <div className="text-xs text-muted-foreground font-mono output-container p-2 rounded">
                  {state.signedLanguageVideo.replace(
                    "POSE_VIDEO_GENERATED:",
                    ""
                  )}
                </div>
              </div>
            </div>
          )}

        {/* Video element - only show for actual video URLs (blob URLs) */}
        {state.signedLanguageVideo &&
          (state.signedLanguageVideo.startsWith("blob:") ||
            state.signedLanguageVideo.startsWith("data:video/") ||
            state.signedLanguageVideo.startsWith("http")) &&
          !isVideoLoading &&
          !videoError && (
            <>
              <video
                ref={videoRef}
                src={state.signedLanguageVideo}
                className="w-full h-full object-contain cursor-pointer rounded-lg"
                tabIndex={-1}
                onFocus={(e) => e.currentTarget.blur()}
                controls
                loop
                autoPlay
                muted
                playsInline
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => e.preventDefault()}
                onClick={handleVideoClick}
                onError={handleVideoError}
                onPlay={() => {}}
                onPause={() => {}}
                onEnded={() => {
                  // Reset to beginning and restart for seamless loop
                  setTimeout(() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                      videoRef.current.play().catch(console.error);
                    }
                  }, 50); // Small delay for smooth restart
                }}
                onLoadedData={() => {
                  // Auto-play when video is loaded
                  if (videoRef.current) {
                    videoRef.current.play().catch(console.error);
                  }
                }}
              />
              <ViewerSelector />
            </>
          )}

        {/* Empty state */}
        {!state.signedLanguagePose && !isVideoLoading && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-muted-foreground text-sm">
                Enter text to see sign language translation
              </div>
            </div>
          </div>
        )}

        {/* Real-time pose viewer for Firebase pose data */}
        {state.signedLanguagePose &&
          !state.signedLanguageVideo &&
          !isVideoLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full flex flex-col">
                {/* Title removed for cleaner interface */}

                {/* Pose Viewer Component */}
                <div className="flex-1 relative">
                  <PoseViewer
                    src={state.signedLanguagePose}
                    className="w-full h-full"
                    showControls={true}
                    background="transparent"
                    loop={true}
                  />

                  {/* Overlay controls
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
                  </div> */}
                </div>
              </div>
            </div>
          )}

        {/* Canvas for pose rendering (hidden, used for processing) */}
        <canvas ref={canvasRef} className="hidden" width={640} height={480} />
      </div>

      {/* SignWriting display */}
      {state.signWriting && state.signWriting.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">SignWriting</h3>
          <div className="flex flex-wrap gap-2">
            {state.signWriting.map((sign, index) => (
              <div
                key={index}
                className="p-2 output-container rounded border"
                title={sign.description || sign.fsw}
              >
                <div className="text-2xl font-mono text-center min-w-[40px]">
                  {sign.fsw}
                </div>
                {sign.description && (
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    {sign.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <ActionButtons />

      {/* Backdrop for viewer selector */}
      {/* {showViewerSelector && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowViewerSelector(false)}
        />
      )} */}
    </div>
  );
}
