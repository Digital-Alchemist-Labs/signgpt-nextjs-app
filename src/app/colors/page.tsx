"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import MainLayout from "@/components/layout/MainLayout";
import ColorShowcase from "@/components/ui/ColorShowcase";

export default function ColorsPage() {
  const { i18n, t } = useTranslation();
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

    // Update document title
    document.title = "Colors - " + t("translate.title");
  }, [settings.language, i18n, resolvedTheme, t]);

  return (
    <MainLayout>
      <ColorShowcase />
    </MainLayout>
  );
}
