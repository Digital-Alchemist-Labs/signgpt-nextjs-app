"use client";

import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Settings,
  Video,
  Eye,
  Palette,
  Globe,
  Monitor,
  Sun,
  Moon,
  User,
  Accessibility,
  Languages,
} from "lucide-react";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();
  const { theme, setTheme } = useTheme();

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "it", name: "Italiano", flag: "🇮🇹" },
    { code: "pt", name: "Português", flag: "🇵🇹" },
    { code: "ru", name: "Русский", flag: "🇷🇺" },
    { code: "zh", name: "中文", flag: "🇨🇳" },
    { code: "ja", name: "日本語", flag: "🇯🇵" },
    { code: "ko", name: "한국어", flag: "🇰🇷" },
    { code: "ar", name: "العربية", flag: "🇸🇦" },
    { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  ];

  const signLanguages = [
    { code: "ase", name: "American Sign Language (ASL)" },
    { code: "bsl", name: "British Sign Language (BSL)" },
    { code: "csl", name: "Chinese Sign Language (CSL)" },
    { code: "dsl", name: "Danish Sign Language (DSL)" },
    { code: "fsl", name: "French Sign Language (FSL)" },
    { code: "gsl", name: "German Sign Language (DGS)" },
    { code: "isl", name: "Italian Sign Language (LIS)" },
    { code: "jsl", name: "Japanese Sign Language (JSL)" },
    { code: "ksl", name: "Korean Sign Language (KSL)" },
    { code: "rsl", name: "Russian Sign Language (RSL)" },
  ];

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  const SettingSection = ({
    title,
    icon: Icon,
    children,
  }: {
    title: string;
    icon: any;
    children: React.ReactNode;
  }) => (
    <div className="bg-card rounded-lg p-6 shadow-sm border">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const ToggleSetting = ({
    label,
    description,
    checked,
    onChange,
  }: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${
            checked ? "bg-blue-600" : ""
          }`}
        ></div>
      </label>
    </div>
  );

  const SelectSetting = ({
    label,
    description,
    value,
    options,
    onChange,
  }: {
    label: string;
    description?: string;
    value: string;
    options: { value: string; label: string; flag?: string }[];
    onChange: (value: string) => void;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.flag ? `${option.flag} ${option.label}` : option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 pb-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
          </div>
          <p className="text-muted-foreground">{t("settings.description")}</p>
        </div>

        <div className="grid gap-6 max-w-4xl">
          {/* Theme Settings */}
          <SettingSection title={t("settings.appearance.title")} icon={Palette}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("settings.appearance.theme")}
              </label>
              <p className="text-xs text-muted-foreground">
                {t("settings.appearance.themeDescription")}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {themes.map((themeOption) => {
                  const Icon = themeOption.icon;
                  const isSelected = theme === themeOption.value;
                  return (
                    <button
                      key={themeOption.value}
                      onClick={() => setTheme(themeOption.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 mx-auto mb-1 ${
                          isSelected ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          isSelected
                            ? "text-primary font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {t(`settings.appearance.${themeOption.value}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </SettingSection>

          {/* Language Settings */}
          <SettingSection title={t("settings.languages.title")} icon={Globe}>
            <SelectSetting
              label={t("settings.languages.interface")}
              description={t("settings.languages.interfaceDescription")}
              value={settings.language}
              options={languages.map((lang) => ({
                value: lang.code,
                label: lang.name,
                flag: lang.flag,
              }))}
              onChange={(value) => updateSetting("language", value)}
            />

            <SelectSetting
              label={t("settings.languages.signLanguage")}
              description={t("settings.languages.signLanguageDescription")}
              value={settings.signedLanguage}
              options={signLanguages.map((lang) => ({
                value: lang.code,
                label: lang.name,
              }))}
              onChange={(value) => updateSetting("signedLanguage", value)}
            />

            <SelectSetting
              label={t("settings.languages.spokenLanguage")}
              description={t("settings.languages.spokenLanguageDescription")}
              value={settings.spokenLanguage}
              options={languages.map((lang) => ({
                value: lang.code,
                label: lang.name,
                flag: lang.flag,
              }))}
              onChange={(value) => updateSetting("spokenLanguage", value)}
            />
          </SettingSection>

          {/* Video & Camera Settings */}
          <SettingSection title={t("settings.video.title")} icon={Video}>
            <ToggleSetting
              label={t("settings.video.enableVideo")}
              description={t("settings.video.enableVideoDescription")}
              checked={settings.receiveVideo}
              onChange={(checked) => updateSetting("receiveVideo", checked)}
            />

            <ToggleSetting
              label={t("settings.video.detectSign")}
              description={t("settings.video.detectSignDescription")}
              checked={settings.detectSign}
              onChange={(checked) => updateSetting("detectSign", checked)}
            />
          </SettingSection>

          {/* Visualization Settings */}
          <SettingSection title={t("settings.visualization.title")} icon={Eye}>
            <ToggleSetting
              label={t("settings.visualization.drawPose")}
              description={t("settings.visualization.drawPoseDescription")}
              checked={settings.drawPose}
              onChange={(checked) => updateSetting("drawPose", checked)}
            />

            <ToggleSetting
              label={t("settings.visualization.drawSignWriting")}
              description={t(
                "settings.visualization.drawSignWritingDescription"
              )}
              checked={settings.drawSignWriting}
              onChange={(checked) => updateSetting("drawSignWriting", checked)}
            />

            <SelectSetting
              label={t("settings.visualization.poseViewer")}
              description={t("settings.visualization.poseViewerDescription")}
              value={settings.poseViewer}
              options={[
                {
                  value: "pose",
                  label: t("settings.visualization.poseLandmarks"),
                },
                {
                  value: "avatar",
                  label: t("settings.visualization.avatar3d"),
                },
              ]}
              onChange={(value) =>
                updateSetting("poseViewer", value as "pose" | "avatar")
              }
            />
          </SettingSection>

          {/* Accessibility Settings */}
          <SettingSection
            title={t("settings.accessibility.title")}
            icon={Accessibility}
          >
            <div className="text-sm text-muted-foreground">
              <p>{t("settings.accessibility.description")}</p>
            </div>
          </SettingSection>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>{t("settings.footer.title")}</p>
          <p className="mt-1">{t("settings.footer.autoSave")}</p>
        </div>
      </div>
    </div>
  );
}
