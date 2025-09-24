"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import MainLayout from "@/components/layout/MainLayout";
import ChatPage from "@/components/pages/ChatPage";

export default function ChatPageRoute() {
  const { i18n } = useTranslation();
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
    document.title = "SignGPT Chat - AI Sign Language Assistant";

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Chat with AI and see responses in sign language. SignGPT provides real-time AI conversation with sign language translation."
      );
    }
  }, [settings.language, i18n, resolvedTheme]);

  return (
    <MainLayout>
      <ChatPage />
    </MainLayout>
  );
}
