"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import Logo from "@/components/ui/Logo";
import LanguageSelector from "@/components/ui/LanguageSelector";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Header() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Update toolbar color for theme
    const updateToolbarColor = () => {
      const toolbar = document.querySelector("[data-toolbar]");
      if (toolbar) {
        const computedStyle = window.getComputedStyle(toolbar);
        const backgroundColor = computedStyle.getPropertyValue("--background");
        if (backgroundColor) {
          const themeColor = resolvedTheme === "dark" ? "#000000" : "#ffffff";
          const themeColorMeta = document.querySelector(
            `meta[name="theme-color"][media="(prefers-color-scheme: ${resolvedTheme})"]`
          );
          if (themeColorMeta) {
            themeColorMeta.setAttribute("content", themeColor);
          }
        }
      }
    };

    updateToolbarColor();
    const interval = setInterval(updateToolbarColor, 100);
    return () => clearInterval(interval);
  }, [resolvedTheme]);

  return (
    <header className="sticky top-12 z-50 w-full border-b glass-effect animate-fade-in bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center space-x-2 hover:scale-105 transition-all duration-200 ease-out"
            data-sign-text="Home"
            data-sign-category="navigation"
            data-sign-description="홈페이지로 이동하는 버튼입니다"
            aria-label="홈으로 이동"
          >
            <Logo />
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <LanguageSelector />
          <ThemeToggle />

          {!isMobile && (
            <button
              onClick={() => router.push("/about")}
              className="px-4 py-2 text-sm font-medium text-foreground hover:text-foreground/80 transition-all duration-200 rounded-lg hover:bg-secondary/50"
              data-sign-text="About this application"
              data-sign-category="navigation"
              data-sign-description="애플리케이션 정보 페이지로 이동하는 버튼입니다"
              aria-label="정보 페이지로 이동"
            >
              {t("landing.about.title")}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
