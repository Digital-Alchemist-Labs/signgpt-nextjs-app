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
  // const debounceTimerRef = useRef<NodeJS.Timeout | null>(null); // Unused for now
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
          setLocalText((prevText) => {
            const newText = prevText + (prevText ? " " : "") + finalTranscript;
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
            return newText;
          });
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
      // Cleanup will be handled by separate useEffect
    };
  }, [setSpokenLanguageText, state.spokenLanguage, suggestAlternativeText]);

  // Cleanup effect for speech recognition and synthesis
  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
    };
  }, [recognition, speechSynthesis]);

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
  }, [state.spokenLanguageText, localText]);

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
    console.log("🎯 [EnhancedTextInput] Focus gained");
    hadFocusRef.current = true;

    // Add a focus protection mechanism
    const ta = textareaRef.current;
    if (ta) {
      // Override the blur method temporarily
      const originalBlur = ta.blur;
      ta.blur = function () {
        console.log("🚫 [EnhancedTextInput] Blur attempt BLOCKED!");
        // Don't actually blur - just log it
        return;
      };

      // Restore original blur after some time (for intentional blurs)
      setTimeout(() => {
        if (ta) {
          ta.blur = originalBlur;
        }
      }, 100);
    }
  }, []);

  // Track user-initiated pointer interactions to allow intentional blur
  useEffect(() => {
    const preventFocusSteal = (e: FocusEvent) => {
      if (hadFocusRef.current) {
        const ta = textareaRef.current;
        const target = e.target as HTMLElement;

        if (ta && target !== ta && !ta.contains(target)) {
          console.log(
            "🚨 [EnhancedTextInput] PREVENTING focus steal by:",
            target.tagName,
            target.className
          );
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          // Force focus back to textarea
          setTimeout(() => {
            if (ta && hadFocusRef.current) {
              ta.focus();
              console.log(
                "🔒 [EnhancedTextInput] Focus FORCED back to textarea"
              );
            }
          }, 0);

          return false;
        }
      }
    };

    // Capture all focus events globally
    document.addEventListener("focusin", preventFocusSteal, true);
    document.addEventListener("focus", preventFocusSteal, true);

    return () => {
      document.removeEventListener("focusin", preventFocusSteal, true);
      document.removeEventListener("focus", preventFocusSteal, true);
    };
  }, []);

  const handleBlur = useCallback(
    (e?: React.FocusEvent<HTMLTextAreaElement>) => {
      console.log("🔍 [EnhancedTextInput] Blur event triggered", {
        relatedTarget: e?.relatedTarget,
        allowBlur: allowBlurRef.current,
        hadFocus: hadFocusRef.current,
      });

      // Prevent unintended blur (e.g., due to background updates)
      const movingTo = e?.relatedTarget as HTMLElement | null;
      const intentional = allowBlurRef.current || !!movingTo;

      if (!intentional && hadFocusRef.current) {
        console.log(
          "🔄 [EnhancedTextInput] Restoring focus after unintended blur"
        );

        // Simple, reliable focus restoration
        requestAnimationFrame(() => {
          const ta = textareaRef.current;
          if (ta && document.activeElement !== ta && hadFocusRef.current) {
            ta.focus();
            console.log("✅ [EnhancedTextInput] Focus restored");
          }
        });
      } else {
        console.log("✅ [EnhancedTextInput] Intentional blur - allowing");
        hadFocusRef.current = false;
      }
    },
    []
  );

  // If textarea had focus and external state changes (video/pose/translation), keep focus
  useEffect(() => {
    if (hadFocusRef.current && !isComposingRef.current) {
      const ta = textareaRef.current;
      if (ta && document.activeElement !== ta) {
        console.log(
          "🔄 [EnhancedTextInput] Restoring focus due to state change"
        );

        // Use multiple aggressive strategies to restore focus
        const restoreFocus = () => {
          try {
            if (ta && document.activeElement !== ta && hadFocusRef.current) {
              ta.focus();
              console.log("✅ [EnhancedTextInput] Focus restored successfully");
              return true;
            }
          } catch (error) {
            console.error(
              "❌ [EnhancedTextInput] Failed to restore focus:",
              error
            );
          }
          return false;
        };

        // Try immediate restoration
        if (!restoreFocus()) {
          // Try with requestAnimationFrame
          requestAnimationFrame(() => {
            if (!restoreFocus()) {
              // Try with multiple timeouts for different scenarios
              [1, 5, 10, 20, 50, 100].forEach((delay) => {
                setTimeout(() => {
                  if (document.activeElement !== ta && hadFocusRef.current) {
                    restoreFocus();
                  }
                }, delay);
              });
            }
          });
        }
      }
    }
  }, [
    state.signedLanguagePose,
    state.signedLanguageVideo,
    state.videoUrl,
    state.isTranslating,
    // Remove spokenLanguageText to prevent re-renders during typing
  ]);

  // Use MutationObserver to detect DOM changes that might affect focus
  useEffect(() => {
    if (!hadFocusRef.current) return;

    const observer = new MutationObserver(() => {
      if (hadFocusRef.current && !isComposingRef.current) {
        const ta = textareaRef.current;
        const currentFocus = document.activeElement;

        // Log current focus state for debugging
        console.log("🔍 [EnhancedTextInput] DOM mutation detected", {
          currentActiveElement: currentFocus?.tagName,
          currentActiveElementClass: currentFocus?.className,
          textareaStillFocused: currentFocus === ta,
          hadFocus: hadFocusRef.current,
        });

        if (ta && currentFocus !== ta) {
          console.log(
            "🔄 [EnhancedTextInput] DOM mutation detected - restoring focus"
          );

          // AGGRESSIVE focus restoration - try immediately
          try {
            ta.focus();
            console.log("✅ [EnhancedTextInput] IMMEDIATE focus restored");
          } catch (error) {
            console.error(
              "❌ [EnhancedTextInput] IMMEDIATE focus failed:",
              error
            );
          }

          // Multiple backup strategies with different timings
          requestAnimationFrame(() => {
            if (document.activeElement !== ta && hadFocusRef.current) {
              try {
                ta.focus();
                console.log(
                  "✅ [EnhancedTextInput] requestAnimationFrame focus restored"
                );
              } catch (error) {
                console.error(
                  "❌ [EnhancedTextInput] requestAnimationFrame focus failed:",
                  error
                );
              }
            }
          });

          setTimeout(() => {
            if (document.activeElement !== ta && hadFocusRef.current) {
              try {
                ta.focus();
                console.log(
                  "✅ [EnhancedTextInput] setTimeout(1ms) focus restored"
                );
              } catch (error) {
                console.error(
                  "❌ [EnhancedTextInput] setTimeout(1ms) focus failed:",
                  error
                );
              }
            }
          }, 1);

          setTimeout(() => {
            if (document.activeElement !== ta && hadFocusRef.current) {
              try {
                ta.focus();
                console.log(
                  "✅ [EnhancedTextInput] setTimeout(5ms) focus restored"
                );
              } catch (error) {
                console.error(
                  "❌ [EnhancedTextInput] setTimeout(5ms) focus failed:",
                  error
                );
              }
            }
          }, 5);

          setTimeout(() => {
            if (document.activeElement !== ta && hadFocusRef.current) {
              try {
                ta.focus();
                console.log(
                  "✅ [EnhancedTextInput] setTimeout(10ms) focus restored"
                );
              } catch (error) {
                console.error(
                  "❌ [EnhancedTextInput] setTimeout(10ms) focus failed:",
                  error
                );
              }
            }
          }, 10);

          setTimeout(() => {
            if (document.activeElement !== ta && hadFocusRef.current) {
              try {
                ta.focus();
                console.log(
                  "✅ [EnhancedTextInput] setTimeout(20ms) focus restored"
                );
              } catch (error) {
                console.error(
                  "❌ [EnhancedTextInput] setTimeout(20ms) focus failed:",
                  error
                );
              }
            }
          }, 20);

          setTimeout(() => {
            if (document.activeElement !== ta && hadFocusRef.current) {
              try {
                ta.focus();
                console.log(
                  "✅ [EnhancedTextInput] setTimeout(50ms) focus restored"
                );
              } catch (error) {
                console.error(
                  "❌ [EnhancedTextInput] setTimeout(50ms) focus failed:",
                  error
                );
              }
            }
          }, 50);
        }
      }
    });

    // Observe the document for changes that might affect focus
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // ULTIMATE NUCLEAR OPTION: Constant focus monitoring
  useEffect(() => {
    let focusGuard: NodeJS.Timeout;

    if (hadFocusRef.current) {
      console.log("🚨 [EnhancedTextInput] ACTIVATING ULTIMATE FOCUS GUARD!");

      focusGuard = setInterval(() => {
        const ta = textareaRef.current;
        if (ta && document.activeElement !== ta && hadFocusRef.current) {
          console.log("💀 [EnhancedTextInput] ULTIMATE GUARD: FORCING FOCUS!");

          // Try EVERYTHING at once
          ta.focus();
          ta.click();
          ta.select();

          // Also try setting selection
          try {
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            ta.setSelectionRange(start, end);
          } catch {}

          // Force active element
          if (document.activeElement !== ta) {
            (document.activeElement as HTMLElement)?.blur?.();
            ta.focus();
          }
        }
      }, 16); // 60fps monitoring
    }

    return () => {
      if (focusGuard) {
        clearInterval(focusGuard);
      }
    };
  });

  // Also add a visibility change listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && hadFocusRef.current) {
        const ta = textareaRef.current;
        if (ta) {
          console.log("👁️ [EnhancedTextInput] Page visible - ensuring focus");
          setTimeout(() => {
            if (ta && hadFocusRef.current) {
              ta.focus();
            }
          }, 100);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, []);

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
          key="enhanced-text-input-stable" // Stable key to prevent React from recreating the element
          ref={textareaRef}
          value={localText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onFocusCapture={() => {
            console.log("🎯 [EnhancedTextInput] Focus capture event");
            hadFocusRef.current = true;
          }}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full px-4 py-4 pr-16 text-lg border rounded-lg resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
            isOverLimit
              ? "border-destructive bg-destructive/10"
              : "border-input bg-background"
          } text-foreground placeholder-muted-foreground`}
          style={{
            minHeight: "80px",
            maxHeight: "300px",
            // Force focus styles to always be visible
            outline: hadFocusRef.current
              ? "2px solid hsl(var(--primary))"
              : "none",
            borderColor: hadFocusRef.current
              ? "hsl(var(--primary))"
              : undefined,
          }}
          // Additional attributes to prevent focus loss
          autoComplete="off"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          tabIndex={hadFocusRef.current ? 0 : -1}
          aria-expanded="true"
          role="textbox"
          contentEditable="true"
          suppressContentEditableWarning={true}
          data-sign-text="text input"
          data-sign-category="input"
          data-sign-description="Text input area for entering text to translate to sign language"
          aria-label="Enter text to translate to sign language"
        />

        {/* Character count */}
        <div
          className={`absolute bottom-2 right-2 text-xs font-medium ${
            isOverLimit
              ? "text-destructive"
              : isNearLimit
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-muted-foreground"
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
                  ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              disabled={!recognition}
              data-sign-text={isListening ? "stop" : "speak"}
              data-sign-category="button"
              data-sign-description={
                isListening ? "Stop voice recording" : "Start voice recording"
              }
              aria-label={isListening ? "Stop listening" : "Start listening"}
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
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
                data-sign-text="play"
                data-sign-category="button"
                data-sign-description="Play text as speech"
                aria-label="Read text aloud"
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
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-secondary-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              data-sign-text="copy"
              data-sign-category="button"
              data-sign-description="Copy text to clipboard"
              aria-label="Copy text"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          )}
        </div>

        {/* Suggestion indicator */}
        {showSuggestions && state.normalizedSpokenLanguageText && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Suggestion available</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>

      {/* Text suggestion */}
      {showSuggestions &&
        state.normalizedSpokenLanguageText &&
        state.normalizedSpokenLanguageText !== state.spokenLanguageText && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary mb-1">
                  Did you mean:
                </p>
                <p className="text-sm text-primary/80 mb-3 break-words">
                  &ldquo;{state.normalizedSpokenLanguageText}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    applySuggestion();
                    refocusTextarea();
                  }}
                  className="px-3 py-1 text-sm font-medium text-primary bg-primary/20 rounded hover:bg-primary/30 transition-colors"
                >
                  Use suggestion
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Listening indicator */}
      {isListening && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
          Listening...
        </div>
      )}
    </div>
  );
}
