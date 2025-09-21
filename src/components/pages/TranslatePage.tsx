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
import SignHoverTest from "@/components/ui/SignHoverTest";
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
  const [uiMode, setUiMode] = useState<"original" | "enhanced">("enhanced");

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
          <label className="block text-sm font-medium text-foreground mb-2">
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
          className="flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors mt-7"
          title="Flip translation direction"
          data-sign-text="전환"
          data-sign-category="button"
          data-sign-description="번역 방향을 바꾸는 버튼입니다"
          aria-label="번역 방향 전환"
        >
          <ArrowLeftRight className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <label className="block text-sm font-medium text-foreground mb-2">
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
        {/* Input side */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">
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
            <DropPoseFile className="h-full" />
          )}
        </div>

        {/* Output side */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">
            {state.spokenToSigned
              ? "Sign Language Translation"
              : "Text Translation"}
          </h2>

          {state.spokenToSigned ? (
            <EnhancedTranslationOutput />
          ) : (
            <div className="p-8 border border-border rounded-lg">
              <p className="text-muted-foreground text-center">
                Translation will appear here...
              </p>
            </div>
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
            className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            data-sign-text="switch"
            data-sign-category="button"
            data-sign-description="switch button"
            aria-label="switch language button"
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
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Sign to text translation
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                Coming soon...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* Mode Toggle Tabs */}
      <div className="flex border-b border-border bg-background">
        <button
          onClick={() => setUiMode("original")}
          className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
            uiMode === "original"
              ? "text-primary border-b-2 border-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
          data-sign-text="original"
          data-sign-category="button"
          data-sign-description="Switch to original translation mode"
          aria-label="Switch to original mode"
        >
          Original
        </button>
        <button
          onClick={() => setUiMode("enhanced")}
          className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
            uiMode === "enhanced"
              ? "text-primary border-b-2 border-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
          data-sign-text="enhanced"
          data-sign-category="button"
          data-sign-description="Switch to enhanced translation mode with video"
          aria-label="Switch to enhanced mode"
        >
          Enhanced
        </button>
      </div>

      {/* Main content */}
      {uiMode === "enhanced" ? (
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

      {/* SignHover Test Component - Remove this in production */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-8">
          <SignHoverTest />
        </div>
      )}
    </div>
  );
}
