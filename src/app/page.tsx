"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation as useTranslationState } from "@/contexts/TranslationContext";
import { useTheme } from "@/contexts/ThemeContext";
import MainLayout from "@/components/layout/MainLayout";
import TranslatePage from "@/components/pages/TranslatePage";

export default function HomePage() {
  const { i18n } = useTranslation();
  const { settings } = useSettings();
  const { resetTranslation } = useTranslationState();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Set language from settings - ensure language change is applied
    const changeLanguage = async () => {
      if (settings.language !== i18n.language) {
        console.log(
          `Changing language from ${i18n.language} to ${settings.language}`
        );
        await i18n.changeLanguage(settings.language);
      }
    };

    changeLanguage();

    // Set document language and direction
    document.documentElement.lang = settings.language;
    const rtlLanguages = ["he", "ar", "fa", "ku", "ps", "sd", "ug", "ur", "yi"];
    document.documentElement.dir = rtlLanguages.includes(settings.language)
      ? "rtl"
      : "ltr";

    // Update theme color meta tag
    const themeColor = resolvedTheme === "dark" ? "#000000" : "#ffffff";
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", themeColor);
    }

    // Reset translation state on page load
    resetTranslation();
  }, [settings.language, i18n, resolvedTheme, resetTranslation]);

  return (
    <MainLayout>
      <TranslatePage />
    </MainLayout>
  );
}
