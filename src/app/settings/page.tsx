"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import MainLayout from "@/components/layout/MainLayout";
import SettingsPage from "@/components/pages/SettingsPage";

export default function Settings() {
  const { i18n } = useTranslation();
  const { settings } = useSettings();
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
  }, [settings.language, i18n, resolvedTheme]);

  return (
    <MainLayout>
      <SettingsPage />
    </MainLayout>
  );
}
