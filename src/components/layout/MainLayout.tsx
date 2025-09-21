"use client";

import { ReactNode, useEffect, useState } from "react";
// import { useRouter } from "next/navigation"; // Unused for now
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
// import { useTheme } from "@/contexts/ThemeContext"; // Unused for now
import Header from "./Header";
import TabBar from "./TabBar";
import SignHover from "@/components/ui/SignHover";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  // const router = useRouter(); // Unused for now
  const { t } = useTranslation();
  const { settings } = useSettings();
  // const { resolvedTheme } = useTheme(); // Unused for now
  const [isMainPage, setIsMainPage] = useState(true);

  useEffect(() => {
    const handleRouteChange = () => {
      setIsMainPage(window.location.pathname === "/");
    };

    handleRouteChange();
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  useEffect(() => {
    // Update document title
    document.title = t("translate.title");

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", t("translate.description"));
    }
  }, [t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 text-foreground">
      <Header />
      <main className="flex-1 animate-fade-in">{children}</main>
      {isMainPage && <TabBar />}
      <SignHover
        config={{
          enabled: settings.signHoverEnabled,
          showDelay: settings.signHoverDelay,
          hideDelay: 100,
        }}
      />
    </div>
  );
}
