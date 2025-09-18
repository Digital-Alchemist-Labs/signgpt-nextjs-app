"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Sparkles, Copy } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

interface EnhancedTextInputProps {
  className?: string;
  placeholder?: string;
  maxLength?: number;
  showSpeechToText?: boolean;
  showTextToSpeech?: boolean;
  showSuggestions?: boolean;
}

export default function EnhancedTextInput({
  className = "",
  placeholder = "Enter text to translate...",
  maxLength = 500,
  showSpeechToText = true,
  showTextToSpeech = true,
  showSuggestions = true,
}: EnhancedTextInputProps) {
  const {
    state,
    setSpokenLanguageText,
    suggestAlternativeText,
    copySpokenLanguageText,
  } = useTranslation();

  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(
    null
  );
  const [speechSynthesis, setSpeechSynthesis] =
    useState<SpeechSynthesis | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const suggestDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [localText, setLocalText] = useState<string>("");
  const selectionRef = useRef<{ start: number; end: number } | null>(null);
  const isComposingRef = useRef<boolean>(false);
  const allowBlurRef = useRef<boolean>(false);
  const hadFocusRef = useRef<boolean>(false);
  const isTypingRef = useRef<boolean>(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const focusGuardActiveRef = useRef<boolean>(false);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Speech Recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognitionConstructor =
        window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognitionConstructor();

      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = state.spokenLanguage || "en-US";

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        if (finalTranscript) {
          const currentText = localText;
          const newText =
            currentText + (currentText ? " " : "") + finalTranscript;
          setLocalText(newText);
          // debounce push to global state
          if (textDebounceRef.current) clearTimeout(textDebounceRef.current);
          textDebounceRef.current = setTimeout(() => {
            setSpokenLanguageText(newText);
          }, 300);
          if (suggestDebounceRef.current)
            clearTimeout(suggestDebounceRef.current);
          suggestDebounceRef.current = setTimeout(() => {
            suggestAlternativeText();
          }, 1000);
        }
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    // Speech Synthesis
    if ("speechSynthesis" in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
    };
  }, [setSpokenLanguageText, state.spokenLanguageText, state.spokenLanguage]);

  // Update recognition language when spoken language changes
  useEffect(() => {
    if (recognition && state.spokenLanguage) {
      recognition.lang =
        state.spokenLanguage === "en" ? "en-US" : state.spokenLanguage;
    }
  }, [recognition, state.spokenLanguage]);

  // Handle text changes with debounced suggestion
  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const target = event.target;
      const newText = target.value;
      // Capture current selection to preserve caret position across controlled updates
      try {
        selectionRef.current = {
          start: target.selectionStart ?? newText.length,
          end: target.selectionEnd ?? newText.length,
        };
      } catch {
        selectionRef.current = null;
      }
      console.log("EnhancedTextInput.handleTextChange called with:", newText);
      setLocalText(newText);

      // Debounce updates to global state (similar to original Angular app)
      if (textDebounceRef.current) clearTimeout(textDebounceRef.current);
      textDebounceRef.current = setTimeout(() => {
        setSpokenLanguageText(newText);
      }, 300);

      // Debounce suggestion requests
      if (showSuggestions) {
        if (suggestDebounceRef.current)
          clearTimeout(suggestDebounceRef.current);
        if (newText.trim()) {
          suggestDebounceRef.current = setTimeout(() => {
            suggestAlternativeText();
          }, 1000);
        }
      }
      // Restore selection in next frame to avoid caret jump (when not composing)
      if (!isComposingRef.current) {
        requestAnimationFrame(() => {
          const ta = textareaRef.current;
          const sel = selectionRef.current;
          if (ta && sel && document.activeElement === ta) {
            try {
              ta.setSelectionRange(sel.start, sel.end);
            } catch {}
          }
        });
      }
    },
    [setSpokenLanguageText, suggestAlternativeText, showSuggestions]
  );

  // Sync local text with global state when it changes externally
  useEffect(() => {
    const global = state.spokenLanguageText ?? "";
    if (
      !isComposingRef.current &&
      !isTypingRef.current &&
      global !== localText
    ) {
      setLocalText(global);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.spokenLanguageText]);

  const handleKeyDown = useCallback(() => {
    isTypingRef.current = true;
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      isTypingRef.current = false;
      typingTimeoutRef.current = null;
    }, 1200);

    // Start focus guard loop while typing (avoid IME interference)
    if (!focusGuardActiveRef.current && !isComposingRef.current) {
      focusGuardActiveRef.current = true;
      const loop = () => {
        if (!isTypingRef.current || isComposingRef.current) {
          focusGuardActiveRef.current = false;
          return;
        }
        const ta = textareaRef.current;
        if (ta && document.activeElement !== ta) {
          try {
            ta.focus();
          } catch {}
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }, []);

  const handleKeyUp = useCallback(() => {
    // Extend typing window slightly on key up
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      isTypingRef.current = false;
      typingTimeoutRef.current = null;
    }, 800);
  }, []);

  // IME composition handlers to avoid interfering with Korean/Japanese input
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);
  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
    // After composition ends, ensure caret is in intended place
    const ta = textareaRef.current;
    if (ta) {
      requestAnimationFrame(() => {
        const len = ta.value.length;
        try {
          ta.setSelectionRange(len, len);
        } catch {}
      });
    }
  }, []);

  const handleFocus = useCallback(() => {
    hadFocusRef.current = true;
  }, []);

  // Track user-initiated pointer interactions to allow intentional blur
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const ta = textareaRef.current;
      if (!ta) return;
      // Allow blur only if pointer is outside textarea
      allowBlurRef.current = !ta.contains(e.target as Node);
    };
    const onPointerUp = () => {
      // Reset after interaction
      allowBlurRef.current = false;
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointerup", onPointerUp, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointerup", onPointerUp, true);
    };
  }, []);

  const handleBlur = useCallback(
    (e?: React.FocusEvent<HTMLTextAreaElement>) => {
      // Prevent unintended blur (e.g., due to background updates)
      const movingTo = e?.relatedTarget as HTMLElement | null;
      const intentional = allowBlurRef.current || !!movingTo;
      if (!intentional) {
        hadFocusRef.current = true;
        const ta = textareaRef.current;
        if (ta) {
          requestAnimationFrame(() => {
            try {
              ta.focus();
            } catch {}
          });
        }
      }
    },
    []
  );

  // If textarea had focus and external state changes (video/pose/translation), keep focus
  useEffect(() => {
    if (hadFocusRef.current && !isComposingRef.current) {
      const ta = textareaRef.current;
      if (ta && document.activeElement !== ta) {
        requestAnimationFrame(() => {
          try {
            ta.focus();
          } catch {}
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.signedLanguagePose,
    state.signedLanguageVideo,
    state.videoUrl,
    state.isTranslating,
  ]);

  // Speech recognition controls
  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      recognition.start();
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  // Text-to-speech
  const speakText = useCallback(() => {
    if (!speechSynthesis || !state.spokenLanguageText.trim()) return;

    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(state.spokenLanguageText);
    utterance.lang =
      state.spokenLanguage === "en" ? "en-US" : state.spokenLanguage || "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    speechSynthesis.speak(utterance);
  }, [
    speechSynthesis,
    state.spokenLanguageText,
    state.spokenLanguage,
    isSpeaking,
  ]);

  // Apply suggested text
  const applySuggestion = useCallback(() => {
    if (state.normalizedSpokenLanguageText) {
      setSpokenLanguageText(state.normalizedSpokenLanguageText);
    }
  }, [state.normalizedSpokenLanguageText, setSpokenLanguageText]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        300
      )}px`;
    }
  }, [state.spokenLanguageText]);

  // Do not auto-move focus; allow the browser/user to control caret position
  // Removed previous auto-focus and re-focus effects to prevent caret jumping

  const characterCount = state.spokenLanguageText.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;

  // Do not force refocus after button interactions; keep caret position intact
  const refocusTextarea = useCallback(() => {}, []);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main input area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={localText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full px-4 py-4 pr-16 text-lg border rounded-lg resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isOverLimit
              ? "border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
          style={{ minHeight: "80px", maxHeight: "300px" }}
        />

        {/* Character count */}
        <div
          className={`absolute bottom-2 right-2 text-xs font-medium ${
            isOverLimit
              ? "text-red-500 dark:text-red-400"
              : isNearLimit
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {characterCount}/{maxLength}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Speech-to-text button */}
          {showSpeechToText && recognition && (
            <button
              type="button"
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else {
                  startListening();
                }
                refocusTextarea();
              }}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isListening
                  ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/30"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              disabled={!recognition}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              {isListening ? "Stop" : "Speak"}
            </button>
          )}

          {/* Text-to-speech button */}
          {showTextToSpeech &&
            speechSynthesis &&
            state.spokenLanguageText.trim() && (
              <button
                type="button"
                onClick={() => {
                  speakText();
                  refocusTextarea();
                }}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isSpeaking
                    ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/30"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <Volume2 className="w-4 h-4" />
                {isSpeaking ? "Stop" : "Listen"}
              </button>
            )}

          {/* Copy button */}
          {state.spokenLanguageText.trim() && (
            <button
              type="button"
              onClick={() => {
                copySpokenLanguageText();
                refocusTextarea();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          )}
        </div>

        {/* Suggestion indicator */}
        {showSuggestions && state.normalizedSpokenLanguageText && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Suggestion available
            </span>
            <Sparkles className="w-4 h-4 text-blue-500" />
          </div>
        )}
      </div>

      {/* Text suggestion */}
      {showSuggestions &&
        state.normalizedSpokenLanguageText &&
        state.normalizedSpokenLanguageText !== state.spokenLanguageText && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Did you mean:
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3 break-words">
                  &ldquo;{state.normalizedSpokenLanguageText}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    applySuggestion();
                    refocusTextarea();
                  }}
                  className="px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                >
                  Use suggestion
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Listening indicator */}
      {isListening && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          Listening...
        </div>
      )}
    </div>
  );
}
