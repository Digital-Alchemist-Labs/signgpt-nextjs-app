"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme(); // resolvedTheme unused for now

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  const currentTheme = themes.find((t) => t.value === theme) || themes[2];
  const Icon = currentTheme.icon;

  const handleThemeChange = () => {
    const currentIndex = themes.findIndex((t) => t.value === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].value);
  };

  return (
    <button
      onClick={handleThemeChange}
      className="p-2 rounded-md hover:bg-secondary transition-colors"
      title={`Current theme: ${currentTheme.label}`}
      data-sign-text="Theme"
      data-sign-category="button"
      data-sign-description="화면 테마를 변경하는 버튼입니다 (밝게/어둡게/시스템)"
      aria-label={`테마 변경: ${currentTheme.label}`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
