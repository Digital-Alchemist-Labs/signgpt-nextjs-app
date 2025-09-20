"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTranslation as useTranslationState } from "@/contexts/TranslationContext";
import { Copy, Download, Loader2, Check } from "lucide-react";
import PoseViewer from "@/components/pose/PoseViewer";

interface TranslationOutputProps {
  text: string;
  isLoading: boolean;
}

export default function TranslationOutput({
  text,
  isLoading,
}: TranslationOutputProps) {
  const { t } = useTranslation();
  const { state } = useTranslationState();
  const [copied, setCopied] = useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log("TranslationOutput - Current state:", {
      text,
      isLoading,
      signedLanguagePose: state.signedLanguagePose,
      spokenLanguageText: state.spokenLanguageText,
    });
  }, [text, isLoading, state.signedLanguagePose, state.spokenLanguageText]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "translation.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Translation Result
        </h3>
        {text && (
          <div className="flex space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          </div>
        )}
      </div>

      {/* Sign Language Video Output - Main Display */}
      <div className="space-y-3">
        {/* <h4 className="text-lg font-medium">Sign Language Video</h4> */}
        <div
          className="w-full max-w-full bg-muted rounded-lg overflow-hidden border border-input relative"
          style={{
            width: "512px",
            height: "512px",
            maxWidth: "100%",
            aspectRatio: "1/1",
          }}
        >
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Generating sign language video...
                </p>
              </div>
            </div>
          ) : state.signedLanguagePose ? (
            <div className="w-full h-full relative">
              <PoseViewer
                src={state.signedLanguagePose}
                className="w-full h-full"
                showControls={true}
                loop={true}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground">
                Sign language video will appear here after translation
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Text Translation - Secondary Display */}
      {text && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Original Text
          </h4>
          <div className="p-3 bg-secondary/30 rounded-md border">
            <div className="text-sm text-foreground whitespace-pre-wrap">
              {text}
            </div>
          </div>
        </div>
      )}

      {/* Placeholder when no content */}
      {!text && !state.signedLanguagePose && !isLoading && (
        <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
          <p className="text-muted-foreground">
            Enter text and click translate to see the sign language video
          </p>
        </div>
      )}
    </div>
  );
}
