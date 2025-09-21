"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation as useTranslationState } from "@/contexts/TranslationContext";
import VideoCapture from "@/components/translate/VideoCapture";
import TextInput from "@/components/translate/TextInput";
import LanguageSelector from "@/components/translate/LanguageSelector";
import TranslationOutput from "@/components/translate/TranslationOutput";
import SettingsPanel from "@/components/translate/SettingsPanel";

export default function TranslateDesktop() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();
  const {
    state,
    setInputMode,
    setSourceText,
    setTranslatedText,
    setSpokenLanguageText,
    changeTranslation,
  } = useTranslationState();
  const [isLoading, setIsLoading] = useState(false);

  const handleInputModeChange = (mode: "webcam" | "upload" | "text") => {
    setInputMode(mode);
  };

  const handleSourceTextChange = (text: string) => {
    setSourceText(text);
    setSpokenLanguageText(text);
  };

  const handleTranslation = async (text: string) => {
    console.log("TranslateDesktop - Starting translation with text:", text);
    setIsLoading(true);
    try {
      // Use the enhanced translation logic
      console.log("TranslateDesktop - Setting spoken language text:", text);
      setSpokenLanguageText(text);

      console.log("TranslateDesktop - Calling changeTranslation...");
      await changeTranslation();

      console.log("TranslateDesktop - Translation completed successfully");
      setTranslatedText(text); // Legacy support
    } catch (error) {
      console.error("Translation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-8 p-6 max-w-7xl mx-auto">
      {/* Left Panel - Input */}
      <div className="flex-1 flex flex-col space-y-6 animate-slide-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {t("translate.title")}
          </h1>
          <SettingsPanel />
        </div>

        {/* Input Mode Selector */}
        <div className="flex space-x-2 p-1 bg-secondary/50 rounded-xl">
          <button
            onClick={() => handleInputModeChange("webcam")}
            className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              state.inputMode === "webcam"
                ? "btn-gradient shadow-lg transform scale-105"
                : "text-secondary-foreground hover:bg-secondary/80 hover:scale-102"
            }`}
            data-sign-text="camera"
            data-sign-category="button"
            data-sign-description="Switch to camera input mode"
            aria-label="Camera mode"
          >
            📹 Camera
          </button>
          <button
            onClick={() => handleInputModeChange("upload")}
            className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              state.inputMode === "upload"
                ? "btn-gradient shadow-lg transform scale-105"
                : "text-secondary-foreground hover:bg-secondary/80 hover:scale-102"
            }`}
            data-sign-text="upload"
            data-sign-category="button"
            data-sign-description="Switch to upload input mode"
            aria-label="Upload mode"
          >
            📁 Upload
          </button>
          <button
            onClick={() => handleInputModeChange("text")}
            className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              state.inputMode === "text"
                ? "btn-gradient shadow-lg transform scale-105"
                : "text-secondary-foreground hover:bg-secondary/80 hover:scale-102"
            }`}
            data-sign-text="text"
            data-sign-category="button"
            data-sign-description="Switch to text input mode"
            aria-label="Text mode"
          >
            ✍️ Text
          </button>
        </div>

        {/* Input Area */}
        <div className="flex-1 modern-card p-6">
          {state.inputMode === "webcam" && <VideoCapture />}
          {state.inputMode === "upload" && (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 hover:border-primary/50 transition-colors">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-2xl">📹</span>
                </div>
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  Upload video file
                </p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or click to select a sign language video
                </p>
              </div>
            </div>
          )}
          {state.inputMode === "text" && (
            <TextInput
              value={state.sourceText}
              onChange={handleSourceTextChange}
              onTranslate={handleTranslation}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Language Selector */}
        <div className="modern-card p-4">
          <LanguageSelector />
        </div>
      </div>

      {/* Right Panel - Output */}
      <div
        className="flex-1 flex flex-col space-y-6 animate-slide-in min-h-0"
        style={{ animationDelay: "0.2s" }}
      >
        <h2 className="text-2xl font-semibold text-center">
          <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
            Translation Result
          </span>
        </h2>
        <div
          className="modern-card p-6 flex-1 overflow-y-auto"
          style={{ minHeight: "450px" }}
        >
          <TranslationOutput
            text={state.translatedText}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
