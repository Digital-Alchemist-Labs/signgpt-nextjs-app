"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation as useTranslationState } from "@/contexts/TranslationContext";
import { ChevronDown } from "lucide-react";

const spokenLanguages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
];

const signedLanguages = [
  { code: "ase", name: "American Sign Language", flag: "🇺🇸" },
  { code: "gsg", name: "German Sign Language", flag: "🇩🇪" },
  { code: "fsl", name: "French Sign Language", flag: "🇫🇷" },
  { code: "bfi", name: "British Sign Language", flag: "🇬🇧" },
  { code: "ils", name: "Israeli Sign Language", flag: "🇮🇱" },
  { code: "sgg", name: "Swiss German Sign Language", flag: "🇨🇭" },
  { code: "ssr", name: "Swiss French Sign Language", flag: "🇨🇭" },
  { code: "slf", name: "Swiss Italian Sign Language", flag: "🇨🇭" },
];

export default function LanguageSelector() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();
  const { state, setSourceLanguage, setTargetLanguage } = useTranslationState();
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [isTargetOpen, setIsTargetOpen] = useState(false);

  const currentSourceLanguage =
    spokenLanguages.find((lang) => lang.code === state.sourceLanguage) ||
    spokenLanguages[0];
  const currentTargetLanguage =
    signedLanguages.find((lang) => lang.code === state.targetLanguage) ||
    signedLanguages[0];

  const handleSourceLanguageChange = (languageCode: string) => {
    setSourceLanguage(languageCode);
    setIsSourceOpen(false);
  };

  const handleTargetLanguageChange = (languageCode: string) => {
    setTargetLanguage(languageCode);
    setIsTargetOpen(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        Language Selection
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Language */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            From (Spoken Language)
          </label>
          <div className="relative">
            <button
              onClick={() => setIsSourceOpen(!isSourceOpen)}
              className="w-full flex items-center justify-between px-3 py-2 border border-input bg-background rounded-md hover:bg-accent transition-colors"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{currentSourceLanguage.flag}</span>
                <span>{currentSourceLanguage.name}</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </button>

            {isSourceOpen && (
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {spokenLanguages.map((language) => {
                  const isDisabled = language.code !== "en";
                  return (
                    <button
                      key={language.code}
                      onClick={() =>
                        !isDisabled && handleSourceLanguageChange(language.code)
                      }
                      disabled={isDisabled}
                      className={`w-full text-left px-3 py-2 transition-colors flex items-center space-x-2 ${
                        language.code === state.sourceLanguage
                          ? "bg-accent"
                          : ""
                      } ${
                        isDisabled
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-accent"
                      }`}
                    >
                      <span className="text-lg">{language.flag}</span>
                      <span>{language.name}</span>
                      {isDisabled && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          (Disabled)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Target Language */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            To (Sign Language)
          </label>
          <div className="relative">
            <button
              onClick={() => setIsTargetOpen(!isTargetOpen)}
              className="w-full flex items-center justify-between px-3 py-2 border border-input bg-background rounded-md hover:bg-accent transition-colors"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{currentTargetLanguage.flag}</span>
                <span>{currentTargetLanguage.name}</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </button>

            {isTargetOpen && (
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {signedLanguages.map((language) => {
                  const isDisabled = language.code !== "ase";
                  return (
                    <button
                      key={language.code}
                      onClick={() =>
                        !isDisabled && handleTargetLanguageChange(language.code)
                      }
                      disabled={isDisabled}
                      className={`w-full text-left px-3 py-2 transition-colors flex items-center space-x-2 ${
                        language.code === state.targetLanguage
                          ? "bg-accent"
                          : ""
                      } ${
                        isDisabled
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-accent"
                      }`}
                    >
                      <span className="text-lg">{language.flag}</span>
                      <span>{language.name}</span>
                      {isDisabled && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          (Disabled)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
