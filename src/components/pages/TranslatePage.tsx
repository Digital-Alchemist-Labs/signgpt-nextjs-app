"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation as useTranslationState } from "@/contexts/TranslationContext";
import TranslateDesktop from "./translate/TranslateDesktop";
import TranslateMobile from "./translate/TranslateMobile";
import EnhancedLanguageSelector from "@/components/ui/EnhancedLanguageSelector";
import EnhancedTextInput from "@/components/translate/EnhancedTextInput";
import EnhancedTranslationOutput from "@/components/translate/EnhancedTranslationOutput";
import DropPoseFile from "@/components/pose/DropPoseFile";
import SignToText from "@/components/pose/SignToText";
import { ArrowLeftRight } from "lucide-react";

export default function TranslatePage() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const {
    state,
    setSpokenLanguage,
    setSignedLanguage,
    flipTranslationDirection,
  } = useTranslationState();
  const [isMobile, setIsMobile] = useState(false);
  const [showEnhancedUI, setShowEnhancedUI] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Update document title and meta description
    document.title = t("translate.title");

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", t("translate.description"));
    }

    // Set default settings
    if (!settings.receiveVideo) {
      // Initialize default settings if needed
    }
  }, [t, settings]);

  useEffect(() => {
    // Handle video autoplay
    const handleUserInteraction = () => {
      const videos = document.querySelectorAll("video[autoplay]");
      videos.forEach(async (video) => {
        const videoElement = video as HTMLVideoElement;
        if (videoElement.paused) {
          try {
            await videoElement.play();
          } catch (error) {
            console.error("Failed to autoplay video:", error);
          }
        }
      });
    };

    // Add event listeners for user interaction
    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };
  }, []);

  // Enhanced UI for desktop
  const EnhancedDesktopUI = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Language selection header */}
      <div className="flex items-center gap-6 mb-8">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {state.spokenToSigned ? "From (Spoken)" : "From (Signed)"}
          </label>
          <EnhancedLanguageSelector
            value={
              state.spokenToSigned ? state.spokenLanguage : state.signedLanguage
            }
            onChange={
              state.spokenToSigned ? setSpokenLanguage : setSignedLanguage
            }
            type={state.spokenToSigned ? "spoken" : "signed"}
            detectedLanguage={state.detectedLanguage}
            placeholder="Select source language"
            showFlags={true}
            showNativeNames={true}
          />
        </div>

        <button
          type="button"
          onClick={flipTranslationDirection}
          className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors mt-7"
          title="Flip translation direction"
        >
          <ArrowLeftRight className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {state.spokenToSigned ? "To (Signed)" : "To (Spoken)"}
          </label>
          <EnhancedLanguageSelector
            value={
              state.spokenToSigned ? state.signedLanguage : state.spokenLanguage
            }
            onChange={
              state.spokenToSigned ? setSignedLanguage : setSpokenLanguage
            }
            type={state.spokenToSigned ? "signed" : "spoken"}
            placeholder="Select target language"
            showFlags={true}
            showNativeNames={true}
          />
        </div>
      </div>

      {/* Translation interface */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Input side (left) */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {state.spokenToSigned ? "Enter Text" : "Sign Language Input"}
          </h2>

          {state.spokenToSigned ? (
            <EnhancedTextInput
              placeholder="Enter text to translate to sign language..."
              maxLength={500}
              showSpeechToText={true}
              showTextToSpeech={true}
              showSuggestions={true}
            />
          ) : (
            <SignToText />
          )}
        </div>

        {/* Output side */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {state.spokenToSigned
              ? "Sign Language Translation"
              : "Text Translation"}
          </h2>

          {state.spokenToSigned ? (
            <EnhancedTranslationOutput />
          ) : (
            <SignToText />
          )}
        </div>
      </div>

      {/* Status and info */}
      {state.isTranslating && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-800 dark:text-blue-200">
              Translating...
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // Enhanced UI for mobile
  const EnhancedMobileUI = () => (
    <div className="flex flex-col h-full">
      {/* Language selection */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <EnhancedLanguageSelector
              value={
                state.spokenToSigned
                  ? state.spokenLanguage
                  : state.signedLanguage
              }
              onChange={
                state.spokenToSigned ? setSpokenLanguage : setSignedLanguage
              }
              type={state.spokenToSigned ? "spoken" : "signed"}
              detectedLanguage={state.detectedLanguage}
              placeholder="Source"
              showFlags={true}
              showNativeNames={false}
            />
          </div>

          <button
            type="button"
            onClick={flipTranslationDirection}
            className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          <div className="flex-1">
            <EnhancedLanguageSelector
              value={
                state.spokenToSigned
                  ? state.signedLanguage
                  : state.spokenLanguage
              }
              onChange={
                state.spokenToSigned ? setSignedLanguage : setSpokenLanguage
              }
              type={state.spokenToSigned ? "signed" : "spoken"}
              placeholder="Target"
              showFlags={true}
              showNativeNames={false}
            />
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col">
        {state.spokenToSigned ? (
          <>
            {/* Text input */}
            <div className="p-4">
              <EnhancedTextInput
                placeholder="Enter text..."
                maxLength={500}
                showSpeechToText={true}
                showTextToSpeech={false}
                showSuggestions={true}
              />
            </div>

            {/* Translation output */}
            <div className="flex-1 p-4">
              <EnhancedTranslationOutput />
            </div>
          </>
        ) : (
          <div className="flex-1 p-4">
            <SignToText />
          </div>
        )}
      </div>
    </div>
  );

  // Toggle between enhanced and original UI
  const toggleUI = () => setShowEnhancedUI(!showEnhancedUI);

  return (
    <div className="flex-1 flex flex-col">
      {/* UI Toggle (development only) */}
      <div className="p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={toggleUI}
          className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
        >
          {showEnhancedUI ? "Switch to Original" : "Switch to Enhanced"}
        </button>
      </div>

      {/* Main content */}
      {showEnhancedUI ? (
        isMobile ? (
          <EnhancedMobileUI />
        ) : (
          <EnhancedDesktopUI />
        )
      ) : isMobile ? (
        <TranslateMobile />
      ) : (
        <TranslateDesktop />
      )}
    </div>
  );
}
