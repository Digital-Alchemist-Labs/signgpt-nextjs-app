"use client";

import { useState } from "react";
// import { useTranslation } from "react-i18next"; // Unused for now
import { Send, Loader2 } from "lucide-react";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onTranslate: (text: string) => void;
  isLoading: boolean;
}

export default function TextInput({
  value,
  onChange,
  onTranslate,
  isLoading,
}: TextInputProps) {
  // const { t } = useTranslation(); // Unused for now
  const [localValue, setLocalValue] = useState(value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localValue.trim() && !isLoading) {
      onChange(localValue);
      onTranslate(localValue);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <label
          htmlFor="text-input"
          className="text-lg font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent"
          data-sign-text="enter text"
          data-sign-category="label"
          data-sign-description="Label for text input area"
        >
          Enter text to translate
        </label>
        <div className="relative">
          <textarea
            id="text-input"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message here and watch the magic happen..."
            className="w-full min-h-[160px] px-4 py-4 border-2 border-input bg-background/50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-lg backdrop-blur-sm"
            disabled={isLoading}
            data-sign-text="text input"
            data-sign-category="input"
            data-sign-description="Text input area for entering text to translate to sign language"
            aria-label="Enter text to translate to sign language"
          />
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="flex items-center space-x-2 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-medium">Processing...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground output-container px-3 py-1 rounded-lg">
          💡 Press{" "}
          <kbd className="px-2 py-0.5 bg-muted rounded text-xs">Cmd+Enter</kbd>{" "}
          or{" "}
          <kbd className="px-2 py-0.5 bg-muted rounded text-xs">Ctrl+Enter</kbd>{" "}
          to translate
        </p>

        <button
          type="submit"
          disabled={!localValue.trim() || isLoading}
          className="flex items-center space-x-3 px-6 py-3 btn-gradient rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
          data-sign-text={isLoading ? "translating" : "translate"}
          data-sign-category="button"
          data-sign-description="Submit text for translation to sign language"
          aria-label={
            isLoading
              ? "Translating text..."
              : "Translate text to sign language"
          }
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          <span className="text-lg">
            {isLoading ? "Translating..." : "Translate"}
          </span>
        </button>
      </div>
    </form>
  );
}
