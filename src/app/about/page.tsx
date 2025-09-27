"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import MainLayout from "@/components/layout/MainLayout";
import AboutPage from "@/components/pages/AboutPage";

export default function About() {
  const { i18n, t } = useTranslation();
  const { settings } = useSettings();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Set language from settings
    if (settings.language !== i18n.language) {
      i18n.changeLanguage(settings.language);
    }

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
    document.title = t("about.title") + " - " + t("translate.title");

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", t("about.description"));
    }
  }, [settings.language, i18n, resolvedTheme, t]);

  return (
    <MainLayout>
      <AboutPage />
    </MainLayout>
  );
}
