"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { HelpCircle, ChevronDown, ChevronUp, X } from "lucide-react";

interface InstructionsPanelProps {
  page: "home" | "chat" | "settings";
  className?: string;
}

export default function InstructionsPanel({
  page,
  className = "",
}: InstructionsPanelProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-20 right-4 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors md:top-auto md:bottom-4"
        title={t("instructions.title")}
        data-sign-text="help"
        data-sign-category="button"
        data-sign-description="Show usage instructions"
        aria-label="Show usage instructions"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
    );
  }

  const instructions = t(`instructions.${page}.steps`, {
    returnObjects: true,
  }) as string[];
  const title = t(`instructions.${page}.title`);

  return (
    <div
      className={`fixed top-20 right-4 z-50 max-w-sm md:top-auto md:bottom-4 ${className}`}
    >
      <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-primary/5 border-b border-border">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              {t("instructions.title")}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-secondary rounded transition-colors"
              title={isExpanded ? t("ui.collapse") : t("ui.expand")}
              data-sign-text={isExpanded ? "collapse" : "expand"}
              data-sign-category="button"
              data-sign-description={`${
                isExpanded ? t("ui.collapse") : t("ui.expand")
              } instructions panel`}
              aria-label={`${
                isExpanded ? t("ui.collapse") : t("ui.expand")
              } instructions`}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-secondary rounded transition-colors"
              title={t("ui.close")}
              data-sign-text="close"
              data-sign-category="button"
              data-sign-description="Close instructions panel"
              aria-label={t("ui.close")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-4">
            <h4 className="text-sm font-medium text-foreground mb-3">
              {title}
            </h4>
            <ol className="space-y-2 text-xs text-muted-foreground">
              {instructions.map((step, index) => (
                <li key={index} className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="flex-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Collapsed preview */}
        {!isExpanded && (
          <div className="p-3">
            <p className="text-xs text-muted-foreground">
              {title} - {instructions.length} {t("ui.steps")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
