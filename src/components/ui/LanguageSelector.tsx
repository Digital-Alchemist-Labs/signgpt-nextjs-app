"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { ChevronDown } from "lucide-react";

const languages = [
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

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const { updateSetting } = useSettings();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    updateSetting("language", languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors rounded-md hover:bg-accent"
        data-sign-text="Language"
        data-sign-category="dropdown"
        data-sign-description="인터페이스 언어를 선택하는 드롭다운 메뉴입니다"
        aria-label="언어 선택"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span>{currentLanguage.name}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-50">
          <div className="py-1">
            {languages.map((language) => {
              const isDisabled = language.code !== "en";
              return (
                <button
                  key={language.code}
                  onClick={() =>
                    !isDisabled && handleLanguageChange(language.code)
                  }
                  disabled={isDisabled}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center space-x-3 ${
                    language.code === i18n.language ? "bg-accent" : ""
                  } ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-accent"
                  }`}
                  data-sign-text={language.name}
                  data-sign-category="dropdown"
                  data-sign-description={`${language.name} 언어로 변경하는 옵션입니다`}
                  aria-label={`${language.name} 언어 선택`}
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
        </div>
      )}
    </div>
  );
}
