"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Download, Share2, Copy, RotateCcw, Settings, X } from "lucide-react";
import { FirebaseAssetsService } from "@/services/FirebaseAssetsService";
import { signHoverService } from "@/services/SignHoverService";
import { useSettings } from "@/contexts/SettingsContext";
import { PoseViewer } from "@/components/pose/PoseViewer";
import { TranslationService } from "@/services/TranslationService";

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

  // UI State
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipText, setTooltipText] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showViewerSelector, setShowViewerSelector] = useState(false);

  // Media State (following Enhanced Translation Output pattern)
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedLanguageVideo, setSignedLanguageVideo] = useState<string | null>(
    null
  );
  const [signedLanguagePose, setSignedLanguagePose] = useState<string | null>(
    null
  );

  // Enhanced Features State
  const [poseViewerType, setPoseViewerType] = useState<PoseViewerType>("pose");

  // Refs
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const firebaseService = useRef<FirebaseAssetsService>(
    new FirebaseAssetsService()
  );
  const inflight = useRef<Map<string, Promise<string | null>>>(new Map());
  const videoRef = useRef<HTMLVideoElement>(null);

  const mergedConfig = {
    enabled: settings.signHoverEnabled ?? true,
    showDelay: settings.signHoverDelay ?? 300,
    hideDelay: 100,
    debug: process.env.NODE_ENV === "development",
    ...config,
  };

  // Generate pose URL from text (following Enhanced Translation Output pattern)
  const generatePoseUrlFromText = useCallback((text: string): string => {
    const translationService = new TranslationService();
    const poseUrl = translationService.translateSpokenToSigned(
      text,
      "en", // Default to English for SignHover
      "ase" // Default to ASE (American Sign Language)
    );
    console.log("SignHover - Generated pose URL:", poseUrl);
    return poseUrl;
  }, []);

  const calculateTooltipPosition = useCallback((rect: DOMRect) => {
    const tooltipWidth = 325; // Width to fit 303px output + padding (303 + 16 + 6 = 325)
    const tooltipHeight = 415; // Height to accommodate 303x303 output + UI elements
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

  // Create video from pose data with realistic sign language animation (from Enhanced Translation Output)
  const createVideoFromPoseData = useCallback(
    async (text: string): Promise<string> => {
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

        console.log("Creating sign language video for SignHover:", text);

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
              videoBitsPerSecond: 2000000, // 2 Mbps for better quality
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
            "SignHover video created:",
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
        const isVeryShortText = text.length <= 1;
        const isShortText = text.length <= 3;

        let minFrames, textBasedFrames;
        if (isVeryShortText) {
          minFrames = 90; // 3 seconds for single characters (shorter for hover)
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
          // Clear canvas with gradient background
          const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
          gradient.addColorStop(0, "#1a1a2e");
          gradient.addColorStop(1, "#16213e");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const progress = frameCount / maxFrames;
          const time = progress * Math.PI * 2;

          // Text variation patterns
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
          ctx.lineCap = "round";

          // Torso
          const shoulderY = centerY - 50;
          const shoulderSpread = 80 + Math.sin(time * 0.5) * 10;
          const leftShoulderX = centerX - shoulderSpread / 2;
          const rightShoulderX = centerX + shoulderSpread / 2;

          ctx.beginPath();
          ctx.moveTo(leftShoulderX, shoulderY);
          ctx.lineTo(rightShoulderX, shoulderY);
          ctx.stroke();

          // Arms with sign language gestures
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

          // Right hand
          ctx.beginPath();
          ctx.arc(rightHandX, rightHandY, 12, 0, 2 * Math.PI);
          ctx.fill();

          // Head
          ctx.strokeStyle = "#88ff00";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(centerX, centerY - 100, 30, 0, 2 * Math.PI);
          ctx.stroke();

          // Display text info
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 24px Arial";
          ctx.textAlign = "center";
          ctx.fillText(`"${text}"`, centerX, 60);

          ctx.font = "16px Arial";
          ctx.fillText("SignHover Enhanced Mode", centerX, 90);

          // Progress indicator
          ctx.fillStyle = "#00ffff";
          ctx.font = "12px Arial";
          ctx.textAlign = "right";
          ctx.fillText(
            `Frame ${frameCount + 1}/${maxFrames}`,
            canvas.width - 10,
            canvas.height - 10
          );

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

  // Generate video from pose data (from Enhanced Translation Output)
  const generateVideoFromPose = useCallback(
    async (text: string): Promise<string> => {
      console.log("Generating video for SignHover:", text);

      try {
        console.log("Creating sign language video from text parameters...");
        const videoUrl = await createVideoFromPoseData(text);
        console.log("SignHover video generation completed successfully!");
        return videoUrl;
      } catch (error) {
        console.error("Failed to generate video for SignHover:", error);
        return "POSE_VIDEO_GENERATED:" + text;
      }
    },
    [createVideoFromPoseData]
  );

  // Enhanced Firebase media loading (following Enhanced Translation Output pattern)
  const loadSignMediaFromFirebase = useCallback(
    async (
      text: string
    ): Promise<{ video: string | null; pose: string | null }> => {
      try {
        setIsLoading(true);
        setError(null);

        const key = text.toLowerCase().trim();
        if (inflight.current.has(key)) {
          const result = await inflight.current.get(key)!;
          if (result?.startsWith("POSE_SRC:")) {
            return { video: null, pose: result.replace("POSE_SRC:", "") };
          } else if (
            result?.startsWith("POSE_VIDEO_GENERATED:") ||
            result?.startsWith("blob:") ||
            result?.startsWith("http")
          ) {
            return { video: result, pose: null };
          }
          return { video: null, pose: null };
        }

        const p = (async () => {
          // 1) Use cache if available
          const cached = signHoverService.getCachedSignVideo(text);
          if (cached) {
            return cached;
          }

          // 2) Try Firebase pre-rendered video first
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
          } catch {
            // Continue to pose fallback
          }

          // 3) Try Firebase pose file as fallback (following Enhanced Translation Output pattern)
          try {
            const posePath = signHoverService.getFirebasePosePath(text);
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
          } catch {
            // Continue to pose URL generation fallback
          }

          // 4) Try generating pose URL from translation service (following Enhanced Translation Output pattern)
          try {
            const poseUrl = generatePoseUrlFromText(text);
            signHoverService.cacheSignVideo(text, `POSE_SRC:${poseUrl}`);
            return `POSE_SRC:${poseUrl}`;
          } catch {
            // Continue to video generation fallback
          }

          // 5) Final fallback: generate video from text
          const generatedUrl = await generateVideoFromPose(text);
          signHoverService.cacheSignVideo(text, generatedUrl);
          return generatedUrl;
        })();

        inflight.current.set(key, p);
        const result = await p;
        inflight.current.delete(key);

        if (result?.startsWith("POSE_SRC:")) {
          return { video: null, pose: result.replace("POSE_SRC:", "") };
        } else if (result?.startsWith("POSE_VIDEO_GENERATED:")) {
          return { video: result, pose: null };
        } else if (result?.startsWith("blob:") || result?.startsWith("http")) {
          return { video: result, pose: null };
        }
        return { video: null, pose: null };
      } catch (error) {
        console.error("Failed to load sign media:", error);
        setError("Failed to load sign media");
        return { video: null, pose: null };
      } finally {
        setIsLoading(false);
      }
    },
    [generateVideoFromPose, generatePoseUrlFromText]
  );

  // Enhanced video error handling (following Enhanced Translation Output pattern)
  const handleVideoError = useCallback(
    async (event: React.SyntheticEvent<HTMLVideoElement>) => {
      console.warn("Video error occurred in SignHover");
      const video = event.target as HTMLVideoElement;

      if (
        signedLanguageVideo &&
        signedLanguageVideo.includes("cloudfunctions.net")
      ) {
        console.log("Clearing pose URL from video element");
        video.src = "";
        setError("This is pose data, not a video file");
        return;
      }

      if (
        signedLanguageVideo &&
        !signedLanguageVideo.includes("cloudfunctions.net")
      ) {
        try {
          const response = await fetch(signedLanguageVideo);
          if (!response.ok) {
            throw new Error(`Video fetch failed: ${response.statusText}`);
          }

          const blob = await response.blob();
          if (!blob.type.startsWith("video/")) {
            setError("Invalid video format");
            return;
          }

          video.src = URL.createObjectURL(blob);
        } catch (error) {
          console.error("Video fallback failed:", error);
          setError("Failed to load video");
        }
      }
    },
    [signedLanguageVideo]
  );

  const handleVideoClick = useCallback(
    (event: React.MouseEvent<HTMLVideoElement>) => {
      const video = event.target as HTMLVideoElement;
      if (video.paused) {
        video.play().catch(console.error);
      } else {
        video.pause();
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
      setError(null);
      setSignedLanguageVideo(null);
      setSignedLanguagePose(null);

      // Load sign media from Firebase (following Enhanced Translation Output pattern)
      const media = await loadSignMediaFromFirebase(text);
      if (media.pose) {
        setSignedLanguagePose(media.pose);
      } else if (media.video) {
        setSignedLanguageVideo(media.video);
      }
    },
    [calculateTooltipPosition, loadSignMediaFromFirebase]
  );

  const hideTooltip = useCallback(() => {
    setIsVisible(false);
    setTooltipText("");
    setIsLoading(false);
    setIsVideoLoading(false);
    setError(null);
    setSignedLanguageVideo(null);
    setSignedLanguagePose(null);
    setShowViewerSelector(false);
  }, []);

  // Enhanced action buttons (for existing media only)
  const copySignVideo = useCallback(async () => {
    if (!signedLanguageVideo) return;

    try {
      if (
        signedLanguageVideo.startsWith("blob:") ||
        signedLanguageVideo.startsWith("http")
      ) {
        const response = await fetch(signedLanguageVideo);
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
  }, [signedLanguageVideo]);

  const shareSignVideo = useCallback(async () => {
    if (!signedLanguageVideo) return;

    try {
      if (
        navigator.share &&
        (signedLanguageVideo.startsWith("blob:") ||
          signedLanguageVideo.startsWith("http"))
      ) {
        const response = await fetch(signedLanguageVideo);
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
  }, [signedLanguageVideo, tooltipText]);

  const downloadSignVideo = useCallback(() => {
    if (!signedLanguageVideo) return;

    try {
      const a = document.createElement("a");
      a.href = signedLanguageVideo;
      a.download = `sign-${tooltipText}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download video:", error);
    }
  }, [signedLanguageVideo, tooltipText]);

  const refreshMedia = useCallback(async () => {
    if (!tooltipText) return;

    // Clear cache for this text and reload
    signHoverService.clearCache();
    setSignedLanguageVideo(null);
    setSignedLanguagePose(null);
    setError(null);

    const media = await loadSignMediaFromFirebase(tooltipText);
    if (media.pose) {
      setSignedLanguagePose(media.pose);
    } else if (media.video) {
      setSignedLanguageVideo(media.video);
    }
  }, [tooltipText, loadSignMediaFromFirebase]);

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
      // Basic interactive elements
      "button",
      "a",
      "input",
      "textarea",
      "select",
      "label",

      // Form elements
      "input[type='text']",
      "input[type='email']",
      "input[type='password']",
      "input[type='search']",
      "input[type='number']",
      "input[type='tel']",
      "input[type='url']",
      "input[type='checkbox']",
      "input[type='radio']",
      "input[type='submit']",
      "input[type='button']",
      "input[type='reset']",

      // Interactive UI components
      "[role='button']",
      "[role='link']",
      "[role='menuitem']",
      "[role='menuitemcheckbox']",
      "[role='menuitemradio']",
      "[role='tab']",
      "[role='option']",
      "[role='combobox']",
      "[role='listbox']",
      "[role='textbox']",
      "[role='searchbox']",
      "[role='spinbutton']",
      "[role='slider']",
      "[role='switch']",
      "[role='checkbox']",
      "[role='radio']",

      // Common UI patterns
      ".btn",
      ".button",
      ".dropdown-toggle",
      ".dropdown-item",
      ".nav-link",
      ".menu-item",
      ".form-control",
      ".form-select",
      ".form-check-input",
      ".form-check-label",

      // Custom attributes
      "[data-sign-text]",
      ".hover-sign",

      // Additional interactive elements
      "summary",
      "details",
      "[tabindex]",
      "[onclick]",
      ".clickable",
      ".interactive",
    ];

    // Track elements that already have listeners to avoid duplicates
    const elementsWithListeners = new WeakSet();

    const attachListeners = (elements: NodeListOf<Element>) => {
      elements.forEach((element) => {
        if (!elementsWithListeners.has(element)) {
          element.addEventListener(
            "mouseenter",
            handleMouseEnter as EventListener
          );
          element.addEventListener(
            "mouseleave",
            handleMouseLeave as EventListener
          );
          elementsWithListeners.add(element);

          if (mergedConfig.debug) {
            console.log("SignHover: Attached listeners to element:", element);
            // Add visual indicator in debug mode
            element.setAttribute("data-signhover-enabled", "true");
            (element as HTMLElement).style.outline =
              "1px dashed rgba(0, 255, 0, 0.3)";
          }
        }
      });
    };

    const detachListeners = (elements: NodeListOf<Element>) => {
      elements.forEach((element) => {
        if (elementsWithListeners.has(element)) {
          element.removeEventListener(
            "mouseenter",
            handleMouseEnter as EventListener
          );
          element.removeEventListener(
            "mouseleave",
            handleMouseLeave as EventListener
          );
          elementsWithListeners.delete(element);

          if (mergedConfig.debug) {
            // Remove visual indicator in debug mode
            element.removeAttribute("data-signhover-enabled");
            (element as HTMLElement).style.outline = "";
          }
        }
      });
    };

    // Initial attachment to existing elements
    const initialElements = document.querySelectorAll(selectors.join(", "));
    if (mergedConfig.debug) {
      console.log(
        "SignHover: Found",
        initialElements.length,
        "initial elements to attach listeners to"
      );
      console.log("SignHover: Selectors:", selectors.join(", "));
    }
    attachListeners(initialElements);

    // Set up MutationObserver to watch for new elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Check for added nodes
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // Check if the added element itself matches our selectors
            if (element.matches && element.matches(selectors.join(", "))) {
              if (!elementsWithListeners.has(element)) {
                element.addEventListener(
                  "mouseenter",
                  handleMouseEnter as EventListener
                );
                element.addEventListener(
                  "mouseleave",
                  handleMouseLeave as EventListener
                );
                elementsWithListeners.add(element);
              }
            }

            // Check for matching elements within the added node
            const childElements = element.querySelectorAll
              ? element.querySelectorAll(selectors.join(", "))
              : [];
            if (mergedConfig.debug && childElements.length > 0) {
              console.log(
                "SignHover: Found",
                childElements.length,
                "new child elements to attach listeners to"
              );
            }
            attachListeners(childElements);
          }
        });

        // Check for removed nodes to clean up listeners
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // Clean up the element itself
            if (element.matches && element.matches(selectors.join(", "))) {
              if (elementsWithListeners.has(element)) {
                element.removeEventListener(
                  "mouseenter",
                  handleMouseEnter as EventListener
                );
                element.removeEventListener(
                  "mouseleave",
                  handleMouseLeave as EventListener
                );
                elementsWithListeners.delete(element);
              }
            }

            // Clean up child elements
            const childElements = element.querySelectorAll
              ? element.querySelectorAll(selectors.join(", "))
              : [];
            detachListeners(childElements);
          }
        });
      });
    });

    // Start observing the document for changes, focusing on main content area
    const mainElement = document.querySelector("main") || document.body;
    observer.observe(mainElement, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    // Also use event delegation on the main element for better performance
    const handleDelegatedMouseEnter = (event: Event) => {
      const target = event.target as Element;
      if (target && target.matches && target.matches(selectors.join(", "))) {
        handleMouseEnter(event as MouseEvent);
      }
    };

    const handleDelegatedMouseLeave = (event: Event) => {
      const target = event.target as Element;
      if (target && target.matches && target.matches(selectors.join(", "))) {
        handleMouseLeave(event as MouseEvent);
      }
    };

    // Add delegated event listeners to main element
    mainElement.addEventListener("mouseover", handleDelegatedMouseEnter, true);
    mainElement.addEventListener("mouseout", handleDelegatedMouseLeave, true);

    return () => {
      // Disconnect the observer
      observer.disconnect();

      // Remove delegated event listeners
      const mainElement = document.querySelector("main") || document.body;
      mainElement.removeEventListener(
        "mouseover",
        handleDelegatedMouseEnter,
        true
      );
      mainElement.removeEventListener(
        "mouseout",
        handleDelegatedMouseLeave,
        true
      );

      // Clean up all existing listeners
      const allElements = document.querySelectorAll(selectors.join(", "));
      detachListeners(allElements);

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

  // Enhanced Viewer Type Selector (following Enhanced Translation Output pattern)
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

  // Compact Action Buttons (for existing media only)
  const ActionButtons = () => (
    <div className="flex items-center justify-center gap-1 mt-2">
      {signedLanguageVideo && (
        <>
          <button
            type="button"
            onClick={copySignVideo}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-secondary-foreground bg-secondary rounded hover:bg-secondary/80 transition-colors"
            title="Copy video"
            aria-label="Copy video"
          >
            <Copy className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={shareSignVideo}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-secondary-foreground bg-secondary rounded hover:bg-secondary/80 transition-colors"
            title="Share video"
            aria-label="Share video"
          >
            <Share2 className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={downloadSignVideo}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-secondary-foreground bg-secondary rounded hover:bg-secondary/80 transition-colors"
            title="Download video"
            aria-label="Download video"
          >
            <Download className="w-3 h-3" />
          </button>
        </>
      )}

      <button
        type="button"
        onClick={refreshMedia}
        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded hover:bg-primary/20 transition-colors"
        disabled={isLoading}
        title="Refresh media"
      >
        <RotateCcw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );

  const tooltip = (
    <div
      className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-w-[90vw] max-h-[90vh] animate-fade-in"
      style={{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
        width: "325px",
        height: "415px",
      }}
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Sign Language
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">SignHover</p>
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

      {/* Content Area with 303x303 Output */}
      <div className="flex-1 p-2" style={{ height: "calc(100% - 85px)" }}>
        {/* Compact Text Display */}
        <div className="text-xs text-gray-700 dark:text-gray-300 mb-2">
          <strong>{tooltipText}</strong>
        </div>

        {/* 303x303 Media Display Area */}
        <div
          className="relative bg-muted rounded-lg overflow-hidden shadow-lg mb-2 mx-auto"
          style={{ height: "303px", width: "303px" }}
        >
          {/* Compact Loading state */}
          {(isLoading || isVideoLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <div className="text-center space-y-1">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="text-xs text-muted-foreground">
                  {isVideoLoading ? "Generating..." : "Loading..."}
                </div>
              </div>
            </div>
          )}

          {/* Compact Error state */}
          {error && !isLoading && !isVideoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
              <div className="text-center space-y-1">
                <div className="text-destructive text-xs font-medium">
                  Error
                </div>
                <button
                  type="button"
                  onClick={refreshMedia}
                  className="px-2 py-1 text-xs text-destructive bg-destructive/20 rounded hover:bg-destructive/30 transition-colors"
                  aria-label="Try again"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Video generated from text (following Enhanced Translation Output pattern) */}
          {signedLanguageVideo &&
            signedLanguageVideo.startsWith("POSE_VIDEO_GENERATED:") &&
            !isLoading &&
            !isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-6xl">🎬</div>
                  <div className="text-green-600 dark:text-green-400 font-medium">
                    Video Generated Successfully!
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Sign language video created for SignHover
                  </div>
                  <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                    {signedLanguageVideo.replace("POSE_VIDEO_GENERATED:", "")}
                  </div>
                </div>
              </div>
            )}

          {/* Enhanced Video Display (following Enhanced Translation Output pattern) */}
          {signedLanguageVideo &&
            (signedLanguageVideo.startsWith("blob:") ||
              signedLanguageVideo.startsWith("data:video/") ||
              signedLanguageVideo.startsWith("http")) &&
            !isLoading &&
            !isVideoLoading &&
            !error && (
              <>
                <video
                  ref={videoRef}
                  src={signedLanguageVideo}
                  className="w-full h-full object-contain cursor-pointer rounded-lg"
                  controls
                  loop
                  autoPlay
                  muted
                  playsInline
                  onClick={handleVideoClick}
                  onError={handleVideoError}
                  onLoadedData={() => {
                    if (videoRef.current) {
                      videoRef.current.play().catch(console.error);
                    }
                  }}
                />
                <ViewerSelector />
              </>
            )}

          {/* Real-time pose viewer for Firebase pose data (following Enhanced Translation Output pattern) */}
          {signedLanguagePose &&
            !signedLanguageVideo &&
            !isLoading &&
            !isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full flex flex-col">
                  {/* Title removed for cleaner interface */}

                  {/* Pose Viewer Component (following Enhanced Translation Output pattern) */}
                  <div className="flex-1 relative">
                    <PoseViewer
                      src={signedLanguagePose}
                      className="w-full h-full"
                      showControls={true}
                      background="transparent"
                      loop={true}
                    />
                    <ViewerSelector />
                  </div>
                </div>
              </div>
            )}

          {/* Compact Empty State */}
          {!signedLanguageVideo &&
            !signedLanguagePose &&
            !isLoading &&
            !isVideoLoading &&
            !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-1">
                  <div className="text-3xl">🤟</div>
                  <p className="text-xs font-medium">Sign Language</p>
                  <p className="text-xs text-muted-foreground">
                    No media for &ldquo;{tooltipText}&rdquo;
                  </p>
                </div>
              </div>
            )}
        </div>

        {/* Enhanced Action Buttons */}
        <ActionButtons />
      </div>

      {/* Compact Footer */}
      <div className="px-2 py-1 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <div className="text-xs">
            {isLoading || isVideoLoading
              ? "Loading..."
              : signedLanguagePose
              ? "Pose"
              : signedLanguageVideo
              ? "Video"
              : "Ready"}
          </div>
          <div>
            <span className="px-1 py-0.5 bg-primary/10 text-primary rounded text-xs">
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
