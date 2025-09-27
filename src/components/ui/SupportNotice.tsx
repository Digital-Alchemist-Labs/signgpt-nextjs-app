"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";

export default function SupportNotice() {
  const { t } = useTranslation();

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 h-12">
      <div className="max-w-7xl mx-auto px-4 h-full">
        <div className="flex items-center justify-center gap-2 text-sm h-full">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="text-blue-800 dark:text-blue-200 font-medium text-center">
            {t(
              "notice.aslOnly",
              "Currently only American Sign Language (ASL) is supported"
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
