"use client";

import { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { PoseProvider } from "@/contexts/PoseContext";
import { SignRecognitionProvider } from "@/contexts/SignRecognitionContext";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <SettingsProvider>
          <PoseProvider>
            <SignRecognitionProvider>
              <TranslationProvider>{children}</TranslationProvider>
            </SignRecognitionProvider>
          </PoseProvider>
        </SettingsProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
