"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useTranslation } from "@/contexts/TranslationContext";

// Declare pose-viewer custom element types
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "pose-viewer": {
        src?: string;
        duration?: number;
        currentTime?: number;
        style?: React.CSSProperties;
        ref?: React.RefObject<HTMLPoseViewerElement>;
      };
    }
  }

  interface HTMLPoseViewerElement extends HTMLElement {
    src: string;
    duration: number;
    currentTime: number;
    play(): Promise<void>;
    pause(): Promise<void>;
    getPose(): Promise<unknown>;
    shadowRoot: ShadowRoot;
  }
}

export interface PoseViewerProps {
  src?: string; // Pose file URL
  className?: string;
  showControls?: boolean;
  background?: string;
  loop?: boolean; // Enable/disable looping
}

/**
 * PoseViewer - Uses the pose-viewer custom element from the original project
 * This component renders .pose files using the same viewer as the original translate app
 */
export const PoseViewer: React.FC<PoseViewerProps> = ({
  src,
  className = "",
  showControls = false,
  background = "transparent",
  loop = true,
}) => {
  const poseViewerRef = useRef<HTMLPoseViewerElement>(null);
  const [isCustomElementLoaded, setIsCustomElementLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setSignedLanguageVideo } = useTranslation();

  // Load the pose-viewer custom element
  const loadPoseViewerElement = useCallback(async () => {
    if (customElements.get("pose-viewer")) {
      setIsCustomElementLoaded(true);
      return;
    }

    try {
      // Dynamic import of pose-viewer
      const { defineCustomElements } = await import("pose-viewer/loader");
      await defineCustomElements();
      setIsCustomElementLoaded(true);
      console.log("Pose viewer custom element loaded");
    } catch (error) {
      console.error("Failed to load pose-viewer custom element:", error);
      setError("Failed to load pose viewer");
    }
  }, []);

  // Initialize pose viewer
  useEffect(() => {
    loadPoseViewerElement();
  }, [loadPoseViewerElement]);

  // Set up event listeners when element is loaded
  useEffect(() => {
    if (!isCustomElementLoaded || !poseViewerRef.current || !src) return;

    const poseViewer = poseViewerRef.current;

    const handleFirstRender = async () => {
      console.log("Pose viewer first render");
      poseViewer.currentTime = 0; // Force time back to 0
      // Auto-start the animation
      try {
        await poseViewer.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Failed to auto-start pose animation:", error);
      }
    };

    const handleRender = () => {
      // Handle render events for video generation if needed
    };

    const handleEnded = async () => {
      console.log("Pose animation ended");
      if (loop) {
        console.log("Restarting from beginning for seamless loop");
        // Add a small delay to ensure clean restart
        setTimeout(async () => {
          try {
            poseViewer.currentTime = 0;
            await poseViewer.play();
            setIsPlaying(true);
          } catch (error) {
            console.error("Failed to restart pose animation:", error);
            setIsPlaying(false);
          }
        }, 100); // 100ms delay for smooth transition
      } else {
        setIsPlaying(false);
      }
    };

    // Add event listeners
    poseViewer.addEventListener("firstRender$", handleFirstRender);
    poseViewer.addEventListener("render$", handleRender);
    poseViewer.addEventListener("ended$", handleEnded);

    return () => {
      poseViewer.removeEventListener("firstRender$", handleFirstRender);
      poseViewer.removeEventListener("render$", handleRender);
      poseViewer.removeEventListener("ended$", handleEnded);
    };
  }, [isCustomElementLoaded, src, loop]);

  // Handle play/pause
  const handlePlayPause = useCallback(async () => {
    if (!poseViewerRef.current) return;

    try {
      if (isPlaying) {
        await poseViewerRef.current.pause();
        setIsPlaying(false);
      } else {
        await poseViewerRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Failed to play/pause pose:", error);
    }
  }, [isPlaying]);

  // Handle visibility change (pause when not visible)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!poseViewerRef.current) return;

      try {
        if (document.visibilityState === "visible") {
          if (isPlaying) {
            await poseViewerRef.current.play();
          }
        } else {
          await poseViewerRef.current.pause();
        }
      } catch (error) {
        console.error("Failed to handle visibility change:", error);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPlaying]);

  if (error) {
    return (
      <div className={`pose-viewer-error ${className}`}>
        <div className="flex items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 text-sm font-medium mb-2">
              {error}
            </div>
            <button
              onClick={loadPoseViewerElement}
              className="px-3 py-1 text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-800 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isCustomElementLoaded) {
    return (
      <div className={`pose-viewer-loading ${className}`}>
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Loading pose viewer...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`pose-viewer-container ${className}`}>
      <div className="relative">
        {/* @ts-expect-error Custom element not recognized by TypeScript */}
        <pose-viewer
          ref={poseViewerRef}
          src={src}
          style={{
            width: "100%",
            height: "100%",
            background: background,
          }}
        />

        {showControls && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2">
              <button
                onClick={handlePlayPause}
                className="flex items-center justify-center w-8 h-8 text-white hover:text-blue-400 transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              <div className="text-xs text-white/80">Pose Animation</div>
            </div>
          </div>
        )}
      </div>

      {!src && (
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-center space-y-2">
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              No pose file provided
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Provide a .pose file URL to display sign language animation
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoseViewer;
