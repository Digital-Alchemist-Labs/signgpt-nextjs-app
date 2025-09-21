"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { TranslationService } from "@/services/TranslationService";

interface SignHoverSimpleProps {
  config?: {
    enabled?: boolean;
    showDelay?: number;
    hideDelay?: number;
  };
}

export default function SignHover({ config = {} }: SignHoverSimpleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipText, setTooltipText] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signVideoUrl, setSignVideoUrl] = useState<string | null>(null);

  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoCache = useRef<Map<string, string>>(new Map());
  const cacheExpiry = useRef<Map<string, number>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const mergedConfig = {
    enabled: true,
    showDelay: 300,
    hideDelay: 100,
    ...config,
  };

  const calculateTooltipPosition = useCallback((rect: DOMRect) => {
    const tooltipWidth = 512;
    const tooltipHeight = 512;
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

  const getCachedVideo = useCallback((text: string): string | null => {
    const normalizedText = text.toLowerCase().trim();
    const expiry = cacheExpiry.current.get(normalizedText);

    if (expiry && Date.now() < expiry) {
      return videoCache.current.get(normalizedText) || null;
    }

    // Clean expired cache
    if (expiry) {
      videoCache.current.delete(normalizedText);
      cacheExpiry.current.delete(normalizedText);
    }

    return null;
  }, []);

  const setCachedVideo = useCallback(
    (text: string, videoUrl: string) => {
      const normalizedText = text.toLowerCase().trim();
      videoCache.current.set(normalizedText, videoUrl);
      cacheExpiry.current.set(normalizedText, Date.now() + CACHE_DURATION);
    },
    [CACHE_DURATION]
  );

  const generateSignVideo = useCallback(
    async (text: string): Promise<string | null> => {
      try {
        setIsLoading(true);
        setError(null);

        // Check cache first
        const cachedVideo = getCachedVideo(text);
        if (cachedVideo) {
          setIsLoading(false);
          return cachedVideo;
        }

        // Use default languages (English -> ASL)
        const spokenLanguage = "en";
        const signedLanguage = "ase"; // American Sign Language

        const translationService = new TranslationService();
        const videoUrl = translationService.translateSpokenToSigned(
          text,
          spokenLanguage,
          signedLanguage
        );

        // Cache the result
        if (videoUrl) {
          setCachedVideo(text, videoUrl);
        }

        return videoUrl;
      } catch (error) {
        console.error("Failed to generate sign video:", error);
        setError("Failed to load sign video");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getCachedVideo, setCachedVideo]
  );

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

      // Try to generate sign video
      const videoUrl = await generateSignVideo(text);
      setSignVideoUrl(videoUrl);
    },
    [calculateTooltipPosition, generateSignVideo]
  );

  const hideTooltip = useCallback(() => {
    setIsVisible(false);
    setTooltipText("");
    setIsLoading(false);
    setError(null);
    setSignVideoUrl(null);
  }, []);

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

    const selectors = ["button", "a", "[data-sign-text]"];

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
  }, [mergedConfig.enabled, handleMouseEnter, handleMouseLeave]);

  if (typeof window === "undefined") return null;

  if (!isVisible) return null;

  const tooltip = (
    <div
      className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 w-[512px] h-[512px] max-w-[90vw] max-h-[90vh] animate-fade-in"
      style={{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Sign Language Translation
          </h3>
          <span className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
            preview
          </span>
        </div>

        {/* Text */}
        <div className="text-base text-gray-700 dark:text-gray-300 mb-4">
          <strong>Text:</strong> {tooltipText}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-lg">Loading sign video...</p>
            <p className="text-sm mt-2">
              Please wait while we generate the sign language video
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-red-500 dark:text-red-400">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-lg">Error loading sign video</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        )}

        {/* Sign Video */}
        {!isLoading && !error && signVideoUrl && (
          <div className="flex-1 flex flex-col">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Sign Language Video:
            </p>
            <div className="flex-1 flex items-center justify-center">
              <video
                src={signVideoUrl}
                className="w-full h-full max-w-[480px] max-h-[400px] object-contain rounded border"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          </div>
        )}

        {/* No Video State */}
        {!isLoading && !error && !signVideoUrl && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <div className="text-6xl mb-4">🤟</div>
            <p className="text-lg">Sign Language Video</p>
            <p className="text-sm mt-2">No video available for this text</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-sm text-gray-600 dark:text-gray-400 border-t pt-3 mt-3">
          {isLoading
            ? "Loading..."
            : signVideoUrl
            ? getCachedVideo(tooltipText)
              ? "Cached Video"
              : "Fresh Video"
            : "Ready"}{" "}
          • Cache: {videoCache.current.size} items
        </div>
      </div>
    </div>
  );

  return createPortal(tooltip, document.body);
}
