"use client";

import { ReactNode, useEffect, useState } from "react";
// import { useRouter } from "next/navigation"; // Unused for now
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
// import { useTheme } from "@/contexts/ThemeContext"; // Unused for now
import Header from "./Header";
import TabBar from "./TabBar";
import SignHover from "@/components/ui/SignHover";
import InstructionsPanel from "@/components/ui/InstructionsPanel";
import SupportNotice from "@/components/ui/SupportNotice";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  // const router = useRouter(); // Unused for now
  const { t } = useTranslation();
  const { settings } = useSettings();
  // const { resolvedTheme } = useTheme(); // Unused for now
  const [currentPage, setCurrentPage] = useState<"home" | "chat" | "settings">(
    "home"
  );

  useEffect(() => {
    const handleRouteChange = () => {
      const pathname = window.location.pathname;

      // Determine current page for instructions panel
      if (pathname === "/") {
        setCurrentPage("home");
      } else if (pathname === "/chat") {
        setCurrentPage("chat");
      } else if (pathname === "/settings") {
        setCurrentPage("settings");
      }
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 text-foreground pb-16">
      <SupportNotice />
      <Header />
      <main className="flex-1 animate-fade-in">{children}</main>
      <TabBar />
      <InstructionsPanel page={currentPage} />
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
