"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Home, MessageCircle, Settings } from "lucide-react";

export default function TabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const tabs = [
    {
      id: "home",
      label: t("common.home"),
      icon: Home,
      path: "/",
    },
    {
      id: "chat",
      label: t("common.chat"),
      icon: MessageCircle,
      path: "/chat",
    },
    {
      id: "settings",
      label: t("common.settings"),
      icon: Settings,
      path: "/settings",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.path;

          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.path)}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-sign-text={tab.label}
              data-sign-category="navigation"
              data-sign-description={`${tab.label} 페이지로 이동하는 탭 버튼입니다`}
              aria-label={`${tab.label} 페이지로 이동`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
