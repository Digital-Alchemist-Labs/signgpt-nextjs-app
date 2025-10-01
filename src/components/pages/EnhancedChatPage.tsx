"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  RotateCcw,
  Trash2,
  MessageCircle,
  Type,
  Play,
  Square,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
// import { useSettings } from "@/contexts/SettingsContext"; // Unused for now
import { TranslationService } from "@/services/TranslationService";
import { PoseViewer } from "@/components/pose/PoseViewer";
import HandTracker, { HandTrackerRef } from "@/components/pose/HandTracker";
import ConnectionStatus from "@/components/pose/ConnectionStatus";
// import EnhancedTextInput from "@/components/translate/EnhancedTextInput"; // Unused for now
// import EnhancedTranslationOutput from "@/components/translate/EnhancedTranslationOutput"; // Unused for now

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  signLanguageVideo?: string;
}

interface ChatResponse {
  content: string;
  agent_info: {
    agent_role: string;
    agent_goal: string;
    model: string;
  };
}

type InputMode = "text" | "sign";

interface EnhancedChatPageProps {
  onSwitchToOriginal?: () => void;
}

export default function EnhancedChatPage({
  onSwitchToOriginal,
}: EnhancedChatPageProps = {}) {
  const { t } = useTranslation();
  // const { settings } = useSettings(); // Unused for now

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Input mode state
  const [inputMode, setInputMode] = useState<InputMode>("text");

  // WebSocket Sign Recognition State (from ChatPage)
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [webSocketError, setWebSocketError] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [recognitionResult, setRecognitionResult] = useState<{
    recognized_word: string;
    confidence: number;
    timestamp: number;
  } | null>(null);
  const [recognitionHistory, setRecognitionHistory] = useState<
    {
      recognized_word: string;
      confidence: number;
      timestamp: number;
    }[]
  >([]);
  const [isSignRecognitionActive, setIsSignRecognitionActive] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);

  // Camera reset state
  const [showCameraResetMessage, setShowCameraResetMessage] = useState(false);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [lastRecognitionTime, setLastRecognitionTime] = useState<number>(
    Date.now()
  );

  // Translation state for sign language display
  const [currentResponseText, setCurrentResponseText] = useState("");
  const [showSignLanguage, setShowSignLanguage] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const handTrackerRef = useRef<HandTrackerRef>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // API configuration
  // API configuration - use local API routes that proxy to external server
  const API_BASE_URL = "/api"; // Local Next.js API routes

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    console.log("📊 [Enhanced] Messages state changed:", messages);
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Track if input had focus to restore it after video/content changes
  const hadFocusRef = useRef(false);
  const allowBlurRef = useRef(false);

  // Track user-initiated pointer interactions to allow intentional blur
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const input = inputRef.current;
      if (!input) return;
      // Allow blur only if pointer is outside input
      allowBlurRef.current = !input.contains(e.target as Node);
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

  // Use MutationObserver to detect DOM changes that might affect focus
  useEffect(() => {
    if (!hadFocusRef.current) return;

    const observer = new MutationObserver(() => {
      if (hadFocusRef.current) {
        const input = inputRef.current;
        if (input && document.activeElement !== input) {
          console.log("🔄 [Enhanced] DOM mutation detected - restoring focus");
          setTimeout(() => {
            try {
              input.focus();
              console.log("✅ [Enhanced] Focus restored after DOM mutation");
            } catch (error) {
              console.error(
                "❌ [Enhanced] Failed to restore focus after DOM mutation:",
                error
              );
            }
          }, 10);
        }
      }
    });

    // Observe the entire document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => {
      observer.disconnect();
    };
  }, [hadFocusRef.current]);

  // Handle focus tracking
  const handleInputFocus = useCallback(() => {
    hadFocusRef.current = true;
  }, []);

  // Handle blur with focus retention logic
  const handleInputBlur = useCallback(
    (e?: React.FocusEvent<HTMLTextAreaElement>) => {
      console.log("🔍 [Enhanced] Input blur event triggered", {
        relatedTarget: e?.relatedTarget,
        allowBlur: allowBlurRef.current,
      });

      // Prevent unintended blur (e.g., due to background updates)
      const movingTo = e?.relatedTarget as HTMLElement | null;
      const intentional = allowBlurRef.current || !!movingTo;

      if (!intentional) {
        console.log(
          "🚫 [Enhanced] Preventing unintended blur - restoring focus"
        );
        hadFocusRef.current = true;
        const input = inputRef.current;
        if (input) {
          // Use multiple strategies to ensure focus is restored
          requestAnimationFrame(() => {
            try {
              input.focus();
              console.log(
                "✅ [Enhanced] Focus restored in requestAnimationFrame"
              );
            } catch (error) {
              console.error(
                "❌ [Enhanced] Failed to restore focus in requestAnimationFrame:",
                error
              );
            }
          });

          // Also try immediate focus restoration
          setTimeout(() => {
            if (document.activeElement !== input && hadFocusRef.current) {
              try {
                input.focus();
                console.log("✅ [Enhanced] Focus restored in setTimeout");
              } catch (error) {
                console.error(
                  "❌ [Enhanced] Failed to restore focus in setTimeout:",
                  error
                );
              }
            }
          }, 50);
        }
      } else {
        console.log("✅ [Enhanced] Intentional blur allowed");
        hadFocusRef.current = false;
      }
    },
    []
  );

  // If input had focus and external state changes (video/content), keep focus
  useEffect(() => {
    if (hadFocusRef.current) {
      const input = inputRef.current;
      if (input && document.activeElement !== input) {
        console.log(
          "🔄 [Enhanced] Restoring focus to input field due to state change"
        );
        requestAnimationFrame(() => {
          try {
            input.focus();
            console.log("✅ [Enhanced] Focus restored successfully");
          } catch (error) {
            console.error("❌ [Enhanced] Failed to restore focus:", error);
          }
        });
      }
    }
  }, [
    showSignLanguage,
    currentResponseText,
    recognitionResult,
    recognitionHistory,
    isSignRecognitionActive,
    messages, // Add messages to dependencies since new messages trigger video display
  ]);

  // WebSocket connection functions with enhanced error handling (보안 강화된 프록시 방식)
  const connectWebSocket = useCallback(async () => {
    try {
      console.log("Connecting to SignGPT Server WebSocket...");

      // API 프록시를 통해 WebSocket URL 가져오기
      const proxyResponse = await fetch("/api/websocket-proxy");
      if (!proxyResponse.ok) {
        throw new Error("Failed to get WebSocket configuration");
      }
      const { webSocketUrl: primaryWsUrl } = await proxyResponse.json();
      console.log("Attempting connection to:", primaryWsUrl);

      wsRef.current = new WebSocket(primaryWsUrl);

      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (
          wsRef.current &&
          wsRef.current.readyState === WebSocket.CONNECTING
        ) {
          console.warn("WebSocket connection timeout");
          wsRef.current.close();

          // Try fallback to localhost for development
          if (process.env.NODE_ENV === "development") {
            console.log("Trying fallback to localhost...");
            tryLocalConnection();
          }
        }
      }, 10000); // 10 second timeout

      wsRef.current.onopen = () => {
        clearTimeout(connectionTimeout);
        setIsWebSocketConnected(true);
        setWebSocketError(null);
        console.log("✅ WebSocket connected successfully to primary server!");
      };

      wsRef.current.onclose = (event) => {
        clearTimeout(connectionTimeout);
        setIsWebSocketConnected(false);
        console.log("❌ WebSocket disconnected:", event.code, event.reason);

        // Auto-reconnect with backoff
        setTimeout(() => {
          console.log("Attempting WebSocket reconnection...");
          connectWebSocket();
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        clearTimeout(connectionTimeout);
        const target = error.target as WebSocket | null;
        const errorDetails = {
          type: error.type,
          target: target?.url || "Unknown URL",
          readyState: target?.readyState || "Unknown state",
          timestamp: new Date().toISOString(),
        };

        console.error("❌ WebSocket 연결 오류:", errorDetails);
        setIsWebSocketConnected(false);
        setWebSocketError(
          "서버 연결에 실패했습니다. 수어 인식 기능이 제한될 수 있습니다."
        );
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "keypoints_added") {
            setFrameCount(data.total_frames);
            console.log(
              "📊 [Enhanced] Keypoints added, total frames:",
              data.total_frames
            );
          } else if (data.type === "recognition_result") {
            console.log(
              "🎯 ===== [Enhanced] RECOGNITION RESULT RECEIVED ====="
            );
            console.log("🎯 [Enhanced] Recognition result received:", data);
            console.log(
              "🎯 [Enhanced] Session active:",
              isSignRecognitionActive
            );
            console.log("🎯 [Enhanced] Recognized word:", data.recognized_word);
            console.log("🎯 [Enhanced] Confidence:", data.confidence);
            console.log(
              "🎯 [Enhanced] WebSocket connected:",
              isWebSocketConnected
            );

            setRecognitionResult(data);

            // 수어 인식 결과가 있으면 세션 상태와 관계없이 히스토리에 추가
            if (data.recognized_word && data.recognized_word.trim() !== "") {
              console.log(
                "🎯 [Enhanced] Adding recognition result to history (regardless of session state)"
              );

              // Check for successful recognition
              const isSuccessful = data.confidence > 0.4;

              if (isSuccessful) {
                // Reset failure tracking on successful recognition
                setConsecutiveFailures(0);
                setLastRecognitionTime(Date.now());
                setShowCameraResetMessage(false);
              } else {
                // Track consecutive failures only if session is active
                if (isSignRecognitionActive) {
                  setConsecutiveFailures((prev) => {
                    const newFailures = prev + 1;
                    const timeSinceLastSuccess =
                      Date.now() - lastRecognitionTime;

                    // Show camera reset message if:
                    // 1. More than 5 consecutive failures, OR
                    // 2. No successful recognition for more than 30 seconds and at least 3 failures
                    if (
                      newFailures >= 5 ||
                      (timeSinceLastSuccess > 30000 && newFailures >= 3)
                    ) {
                      console.log(
                        "🔄 [Enhanced] Showing camera reset message due to consecutive failures:",
                        {
                          consecutiveFailures: newFailures,
                          timeSinceLastSuccess,
                        }
                      );
                      setShowCameraResetMessage(true);
                    }

                    return newFailures;
                  });
                }
              }

              setRecognitionHistory((prev) => {
                const newItem = {
                  recognized_word: data.recognized_word,
                  confidence: data.confidence,
                  timestamp: data.timestamp,
                };
                const newHistory = [...prev, newItem];
                console.log(
                  "🎯 ===== [Enhanced] ADDING TO RECOGNITION HISTORY ====="
                );
                console.log(
                  "🎯 [Enhanced] Previous history length:",
                  prev.length
                );
                console.log("🎯 [Enhanced] New item being added:", newItem);
                console.log(
                  "🎯 [Enhanced] New history length:",
                  newHistory.length
                );
                console.log("🎯 [Enhanced] Full new history:", newHistory);
                console.log(
                  "🎯 [Enhanced] Session was active:",
                  isSignRecognitionActive
                );
                return newHistory;
              });

              // 실시간 전송은 하지 않고 히스토리에만 저장 (세션 종료 시 일괄 전송)
            }
          } else if (data.type === "cleared") {
            setFrameCount(0);
            setRecognitionResult(null);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      setIsWebSocketConnected(false);
    }
  }, [isSignRecognitionActive]);

  // Fallback connection to localhost for development
  const tryLocalConnection = useCallback(() => {
    if (process.env.NODE_ENV !== "development") return;

    try {
      console.log("Attempting localhost connection...");
      const localWsUrl = "ws://localhost:8000/ws";

      wsRef.current = new WebSocket(localWsUrl);

      wsRef.current.onopen = () => {
        setIsWebSocketConnected(true);
        setWebSocketError(null);
        console.log("✅ WebSocket connected to localhost!");
      };

      wsRef.current.onclose = (event) => {
        setIsWebSocketConnected(false);
        console.log(
          "❌ Localhost WebSocket disconnected:",
          event.code,
          event.reason
        );
      };

      wsRef.current.onerror = (error) => {
        const target = error.target as WebSocket | null;
        const errorDetails = {
          type: error.type,
          target: target?.url || "Unknown URL",
          readyState: target?.readyState || "Unknown state",
          timestamp: new Date().toISOString(),
        };

        console.error("❌ Localhost WebSocket 연결 오류:", errorDetails);
        setIsWebSocketConnected(false);
        setWebSocketError(
          "로컬 서버 연결에도 실패했습니다. 수어 인식 기능을 사용할 수 없습니다."
        );
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Same message handling as primary connection
          if (data.type === "keypoints_added") {
            setFrameCount(data.total_frames);
          } else if (data.type === "recognition_result") {
            setRecognitionResult(data);

            if (isSignRecognitionActive) {
              setRecognitionHistory((prev) => [
                ...prev,
                {
                  recognized_word: data.recognized_word,
                  confidence: data.confidence,
                  timestamp: data.timestamp,
                },
              ]);
            }
          } else if (data.type === "cleared") {
            setFrameCount(0);
            setRecognitionResult(null);
          }
        } catch (error) {
          console.error("Error parsing localhost WebSocket message:", error);
        }
      };
    } catch (error) {
      console.error("Error connecting to localhost WebSocket:", error);
      setIsWebSocketConnected(false);
    }
  }, [isSignRecognitionActive]);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsWebSocketConnected(false);
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  // WebSocket keypoint sending and auto-recognition (from ChatPage)
  const sendKeypoints = useCallback(
    (keypoints: number[][]) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Send keypoints
        wsRef.current.send(
          JSON.stringify({
            action: "add_keypoints",
            keypoints: keypoints,
          })
        );

        // Auto-recognition in auto mode
        if (isAutoMode) {
          setTimeout(() => {
            startRecognition();
          }, 100); // Recognize immediately after sending keypoints
        }
      }
    },
    [isAutoMode]
  );

  // Start recognition
  const startRecognition = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "recognize",
        })
      );
    }
  }, []);

  // Clear data
  const clearData = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "clear",
        })
      );
    }
    setRecognitionResult(null);
    setFrameCount(0);
  }, []);

  // Start session (from ChatPage)
  const startSignRecognition = useCallback(() => {
    console.log("Starting sign language recognition session");
    setIsSignRecognitionActive(true);
    setIsAutoMode(true);
    setRecognitionHistory([]);

    // Reset failure tracking when starting new session
    setConsecutiveFailures(0);
    setLastRecognitionTime(Date.now());
    setShowCameraResetMessage(false);

    if (handTrackerRef.current) {
      handTrackerRef.current.startAutoRecording();
    }

    // Clear existing data
    clearData();
  }, [clearData]);

  // End session (from ChatPage) - Send recognized words to chat
  const stopSignRecognition = useCallback(() => {
    console.log("🛑 ===== [Enhanced] STOP SIGN RECOGNITION CALLED =====");
    console.log(
      "🛑 [Enhanced] Current recognition history:",
      recognitionHistory
    );
    console.log(
      "🛑 [Enhanced] Recognition history length:",
      recognitionHistory.length
    );
    console.log(
      "🛑 [Enhanced] isSignRecognitionActive:",
      isSignRecognitionActive
    );

    setIsSignRecognitionActive(false);
    setIsAutoMode(false);

    if (handTrackerRef.current) {
      handTrackerRef.current.stopAutoRecording();
    }

    // Send recognized words to chat and auto-send
    console.log(
      "🔍 [Enhanced] Recognition history length:",
      recognitionHistory.length
    );
    console.log("🔍 [Enhanced] Recognition history:", recognitionHistory);

    // Filter out only empty results (모든 인식된 수어를 포함하도록 신뢰도 조건 완화)
    const validRecognitions = recognitionHistory.filter(
      (item) => item.recognized_word && item.recognized_word.trim() !== ""
    );
    console.log(
      "🔍 [Enhanced] Valid recognitions (모든 수어 포함):",
      validRecognitions
    );

    if (validRecognitions.length > 0) {
      const recognizedWords = validRecognitions.map(
        (item) => item.recognized_word
      );
      // 중복 제거하지 않고 모든 인식된 수어를 순서대로 포함
      const wordsText = recognizedWords.join(" ").trim();

      console.log(
        "✅ [Enhanced] Sign language recognition completed! Recognized words:",
        wordsText
      );

      if (wordsText) {
        // Show recognition completion notification to user
        const notification = document.createElement("div");
        notification.className =
          "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all";
        notification.innerHTML = `✅ Sign Recognition Complete: "${wordsText}"<br><small>Sending to chat automatically...</small>`;
        document.body.appendChild(notification);

        // Set text in input field and trigger auto-send
        setInputMessage(wordsText);

        // Auto-send message after a short delay
        setTimeout(async () => {
          console.log(
            "📤 [Enhanced] Auto-sending sign recognition result:",
            wordsText
          );

          // Create user message
          const userMessage = {
            id: Date.now().toString(),
            role: "user" as const,
            content: wordsText,
            timestamp: new Date(),
          };

          console.log("📝 [Enhanced] Adding user message:", userMessage);
          setMessages((prev) => {
            const newMessages = [...prev, userMessage];
            console.log("📋 [Enhanced] Updated messages array:", newMessages);
            return newMessages;
          });

          setInputMessage(""); // Clear input field
          setIsLoading(true);
          setError(null);

          try {
            console.log(
              "🌐 [Enhanced] Sending API request to:",
              `${API_BASE_URL}/chat`
            );
            const response = await fetch(`${API_BASE_URL}/chat`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: userMessage.content,
              }),
            });

            console.log("📡 [Enhanced] API Response status:", response.status);

            if (!response.ok) {
              const errorText = await response.text();
              console.error("❌ [Enhanced] API Error response:", errorText);
              throw new Error(
                `HTTP error! status: ${response.status} - ${errorText}`
              );
            }

            const data = await response.json();
            console.log("✅ [Enhanced] API Response data:", data);

            const assistantMessage = {
              id: (Date.now() + 1).toString(),
              role: "assistant" as const,
              content: data.content,
              timestamp: new Date(),
            };

            console.log(
              "🤖 [Enhanced] Adding assistant message:",
              assistantMessage
            );
            setMessages((prev) => {
              const newMessages = [...prev, assistantMessage];
              console.log("📋 [Enhanced] Final messages array:", newMessages);
              return newMessages;
            });

            // Set current response for sign language display
            setCurrentResponseText(data.content);
            setShowSignLanguage(true);

            // Update notification to show completion
            notification.innerHTML = `📤 Sent to chat successfully!`;
            notification.className =
              "fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all";
          } catch (error) {
            console.error("💥 [Enhanced] Failed to send message:", error);
            setError(
              error instanceof Error ? error.message : "Failed to send message"
            );

            // Add error message to chat
            const errorMessage = {
              id: (Date.now() + 1).toString(),
              role: "assistant" as const,
              content:
                "Sorry, I encountered an error while processing your message. Please try again.",
              timestamp: new Date(),
            };
            console.log("⚠️ [Enhanced] Adding error message:", errorMessage);
            setMessages((prev) => [...prev, errorMessage]);

            // Update notification to show error
            notification.innerHTML = `❌ Failed to send to chat`;
            notification.className =
              "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all";
          } finally {
            setIsLoading(false);
          }

          // Remove notification after 3 seconds
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 3000);
        }, 500); // Delay to allow user to see the result
      } else {
        console.log("⚠️ [Enhanced] No valid words to send after filtering");
      }
    } else {
      console.log(
        "❌ [Enhanced] Sign recognition session ended - no valid words recognized."
      );
      console.log(
        "💡 [Enhanced] Tip: Try making clearer sign gestures for better recognition."
      );

      // Show notification for no recognition
      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all";
      notification.innerHTML = `⚠️ No sign language recognized<br><small>Try making clearer gestures</small>`;
      document.body.appendChild(notification);

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    }

    // Clear recognition history AFTER processing (히스토리 처리 후 초기화)
    console.log("🧹 [Enhanced] Clearing recognition history after processing");
    setRecognitionHistory([]);
  }, [
    recognitionHistory,
    setMessages,
    setIsLoading,
    setError,
    setCurrentResponseText,
    setShowSignLanguage,
  ]);

  // Restart camera
  const retryCamera = useCallback(() => {
    if (handTrackerRef.current?.retryCamera) {
      handTrackerRef.current.retryCamera();
    }

    // Reset failure tracking when camera is restarted
    setConsecutiveFailures(0);
    setLastRecognitionTime(Date.now());
    setShowCameraResetMessage(false);

    console.log("🔄 [Enhanced] Camera restarted, reset failure tracking");
  }, []);

  // Handle keypoints from camera (original method)
  const handleKeypointsDetected = useCallback(
    (keypoints: number[][]) => {
      sendKeypoints(keypoints);
    },
    [sendKeypoints]
  );



  // Send message to chat API
  const sendMessage = useCallback(async () => {
    const messageText = inputMessage.trim();
    console.log("🚀 [Enhanced] Attempting to send message:", messageText);

    if (!messageText || isLoading) {
      console.log(
        "❌ [Enhanced] Cannot send message - empty text or loading:",
        { messageText, isLoading }
      );
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    console.log("📝 [Enhanced] Adding user message to chat:", userMessage);
    setMessages((prev) => {
      const newMessages = [...prev, userMessage];
      console.log("📋 [Enhanced] Updated messages:", newMessages);
      return newMessages;
    });
    setInputMessage("");
    setIsLoading(true);
    setError(null);

    try {
      console.log("🌐 [Enhanced] Sending request to:", `${API_BASE_URL}/chat`);
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      });

      console.log("📡 [Enhanced] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [Enhanced] HTTP error response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const data: ChatResponse = await response.json();
      console.log("✅ [Enhanced] Received response:", data);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };

      console.log(
        "🤖 [Enhanced] Adding assistant message to chat:",
        assistantMessage
      );
      setMessages((prev) => {
        const newMessages = [...prev, assistantMessage];
        console.log("📋 [Enhanced] Final messages:", newMessages);
        return newMessages;
      });

      // Set current response for sign language display
      setCurrentResponseText(data.content);
      setShowSignLanguage(true);
    } catch (error) {
      console.error("💥 [Enhanced] Failed to send message:", error);
      setError(
        error instanceof Error ? error.message : "Failed to send message"
      );

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I encountered an error while processing your message. Please try again.",
        timestamp: new Date(),
      };
      console.log("⚠️ [Enhanced] Adding error message to chat:", errorMessage);
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      console.log("🏁 [Enhanced] Message sending process completed");
    }
  }, [inputMessage, isLoading]);

  // Handle Enter key press
  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // Clear chat history
  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentResponseText("");
    setShowSignLanguage(false);
    setError(null);
    inputRef.current?.focus();
  }, []);

  // Retry last message
  const retryLastMessage = useCallback(() => {
    if (messages.length === 0) return;

    // Find the last user message
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((msg) => msg.role === "user");
    if (!lastUserMessage) return;

    // Remove messages after the last user message
    const lastUserIndex = messages.findIndex(
      (msg) => msg.id === lastUserMessage.id
    );
    setMessages(messages.slice(0, lastUserIndex + 1));

    // Resend the message
    setInputMessage(lastUserMessage.content);
    setTimeout(() => sendMessage(), 100);
  }, [messages, sendMessage]);

  return (
    <div className="flex flex-col h-full bg-background/95">
      {/* Camera Reset Message - Fixed Top Banner */}
      {showCameraResetMessage && isSignRecognitionActive && (
        <div className="bg-orange-500 text-white px-4 py-3 shadow-lg relative z-50">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <div>
                <span className="font-semibold">
                  수어 인식이 원활하지 않습니다
                </span>
                <span className="ml-2 text-orange-100">
                  연속 실패 {consecutiveFailures}회 - 카메라를 초기화하면 인식
                  성능이 향상될 수 있습니다.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={retryCamera}
                className="flex items-center gap-1 px-3 py-1 bg-white text-orange-600 hover:bg-orange-50 rounded font-medium text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                카메라 초기화
              </button>
              <button
                onClick={() => setShowCameraResetMessage(false)}
                className="text-white hover:text-orange-200 p-1 transition-colors"
                title="닫기"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {t("chat.Enhanced Chat")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Chat with SignGPT AI Assistant
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Switch to Original Button */}
          {onSwitchToOriginal && (
            <button
              onClick={onSwitchToOriginal}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors"
              title="Switch to Original View"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16l-4-4m0 0l4-4m-4 4h18"
                />
              </svg>
              Original
            </button>
          )}
          <button
            onClick={retryLastMessage}
            disabled={messages.length === 0 || isLoading}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Retry last message"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={clearChat}
            disabled={messages.length === 0}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main content area - Enhanced Layout */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 lg:grid-rows-[1fr_1.5fr] gap-4 md:gap-6 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Top Left - Text/Video Input */}
        <div className="lg:col-start-1 lg:row-start-1 bg-card rounded-xl border border-border p-4 md:p-6 shadow-sm min-h-[320px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">Input</h2>
            <div className="flex items-center gap-2">
              {/* Input Mode Toggle */}
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  onClick={() => setInputMode("text")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${
                    inputMode === "text"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Type className="w-4 h-4" />
                  Text
                </button>
                <button
                  onClick={() => setInputMode("sign")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${
                    inputMode === "sign"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🤟 Sign
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4">
            {inputMode === "text" ? (
              <>
                <div className="w-full h-full flex-1">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="Type your message here..."
                    className="w-full h-full p-4 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    maxLength={500}
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  <span>{inputMessage.length}/500</span>
                </div>
              </>
            ) : (
              <>
                {/* WebSocket Sign Language Input */}
                <div className="w-full h-full flex-1 flex flex-col space-y-4">
                  {/* Connection Status */}
                  <div className="flex justify-center mb-2">
                    <ConnectionStatus isConnected={isWebSocketConnected} />
                  </div>

                  {/* Instruction Message */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="text-blue-500">ℹ️</div>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        수어 인식을 누른 후 카메라 초기화 버튼을 눌러주세요
                      </span>
                    </div>
                  </div>

                  {/* Camera Feed */}
                  <div className="flex-1 bg-muted rounded-lg overflow-hidden relative">
                    <HandTracker
                      ref={handTrackerRef}
                      onKeypointsDetected={handleKeypointsDetected}
                      isRecording={false}
                      showKeypoints={isSignRecognitionActive} // 수어 인식 활성화 상태에 따라 키포인트 표시
                    />
                    {frameCount > 0 && (
                      <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                        Frames: {frameCount}
                      </div>
                    )}
                  </div>

                  {/* Status Display */}
                  {isSignRecognitionActive && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Sign Recognition Session Active
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                        Recognized words: {recognitionHistory.length}
                        {consecutiveFailures > 0 && (
                          <span className="text-orange-500 ml-2">
                            (연속 실패: {consecutiveFailures})
                          </span>
                        )}
                      </p>

                      {/* Preview of recognized words so far */}
                      {recognitionHistory.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-blue-500 dark:text-blue-400 mb-1">
                            Recognized words preview:
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm">
                            {[
                              ...new Set(
                                recognitionHistory.map(
                                  (item) => item.recognized_word
                                )
                              ),
                            ].join(" ")}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Current Recognition Result */}
                  {recognitionResult && (
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-foreground text-lg">
                          {recognitionResult.recognized_word}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {(recognitionResult.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(
                          recognitionResult.timestamp * 1000
                        ).toLocaleTimeString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* WebSocket Sign Recognition Controls */}
                <div className="flex justify-center space-x-2">
                  {!isWebSocketConnected ? (
                    <div
                      className={`border rounded-lg p-3 w-full ${
                        webSocketError
                          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                          : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            webSocketError ? "bg-red-500" : "bg-yellow-500"
                          }`}
                        ></div>
                        <span
                          className={`text-sm font-medium ${
                            webSocketError
                              ? "text-red-700 dark:text-red-300"
                              : "text-yellow-700 dark:text-yellow-300"
                          }`}
                        >
                          {webSocketError
                            ? "Connection Failed"
                            : "Connecting to server..."}
                        </span>
                      </div>
                      <p
                        className={`text-xs ${
                          webSocketError
                            ? "text-red-600 dark:text-red-400"
                            : "text-yellow-600 dark:text-yellow-400"
                        }`}
                      >
                        {webSocketError ||
                          "Attempting to connect to sign language recognition server."}
                      </p>
                    </div>
                  ) : !isSignRecognitionActive ? (
                    <button
                      onClick={startSignRecognition}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-lg transition-all"
                    >
                      <Play className="w-5 h-5" />
                      Start Sign Language
                    </button>
                  ) : (
                    <button
                      onClick={stopSignRecognition}
                      className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-lg transition-all"
                    >
                      <Square className="w-5 h-5" />
                      Stop Sign Language
                    </button>
                  )}

                  {/* Utility Controls */}
                  <button
                    onClick={clearData}
                    disabled={!isWebSocketConnected}
                    className="flex items-center gap-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear
                  </button>
                  <button
                    onClick={retryCamera}
                    className="flex items-center gap-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Camera
                  </button>
                </div>
              </>
            )}

            {/* Send button */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  console.log("🔘 [Enhanced] Send button clicked");
                  console.log(
                    "📝 [Enhanced] Input message:",
                    `"${inputMessage}"`
                  );
                  console.log(
                    "📝 [Enhanced] Input message length:",
                    inputMessage.length
                  );
                  console.log(
                    "📝 [Enhanced] Input message trimmed:",
                    `"${inputMessage.trim()}"`
                  );
                  console.log(
                    "📝 [Enhanced] Input message trimmed length:",
                    inputMessage.trim().length
                  );
                  console.log("🔒 [Enhanced] isLoading:", isLoading);
                  console.log(
                    "🔒 [Enhanced] Button disabled:",
                    !inputMessage.trim() || isLoading
                  );
                  if (inputMessage.trim() && !isLoading) {
                    console.log("✅ [Enhanced] Calling sendMessage");
                    sendMessage();
                  } else {
                    console.log(
                      "❌ [Enhanced] Not calling sendMessage - conditions not met"
                    );
                  }
                }}
                disabled={!inputMessage.trim() || isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isLoading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>

        {/* Top Right - Sign Language Output */}
        <div className="lg:col-start-2 lg:row-start-1 bg-card rounded-xl border border-border p-4 md:p-6 shadow-sm min-h-[320px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">
              Sign Language
            </h2>
            <div className="w-5 h-5 text-muted-foreground">🤟</div>
          </div>

          <div className="flex-1 w-full h-full border border-border rounded-lg bg-secondary/20 flex items-center justify-center">
            {showSignLanguage && currentResponseText ? (
              <SignLanguageDisplay text={currentResponseText} />
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-2">🤟</div>
                <p className="text-muted-foreground text-sm">
                  Sign language will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom - Chat History */}
        <div className="lg:col-span-2 lg:row-start-2 bg-card rounded-xl border border-border p-4 md:p-6 min-h-[300px] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">
              Chat History
            </h2>
            <span className="text-sm text-muted-foreground">
              {messages.length} messages
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[500px] space-y-4 pr-2">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-center">
                <div>
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Start a conversation with SignGPT
                  </p>
                </div>
              </div>
            ) : (
              (() => {
                console.log("🎨 [Enhanced] Rendering messages:", messages);
                return messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                    onMouseEnter={() => setHoveredMessage(message.id)}
                    onMouseLeave={() => setHoveredMessage(null)}
                  >
                    <div
                      className={`max-w-[70%] rounded-xl p-4 relative shadow-sm ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>

                      {/* Hover tooltip */}
                      {hoveredMessage === message.id && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg shadow-lg border border-border z-10 max-w-xs">
                          <div className="font-medium mb-1">
                            {message.role === "user" ? "You" : "SignGPT"}
                          </div>
                          <div className="text-xs opacity-80">
                            {message.timestamp.toLocaleString()}
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ));
              })()
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-destructive/10 border-t border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}

// Component to display sign language for chat responses
function SignLanguageDisplay({ text }: { text: string }) {
  const [poseUrl, setPoseUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!text) return;

    setIsLoading(true);
    setError(null);

    try {
      // Generate pose URL using the translation service
      const translationService = new TranslationService();
      const generatedPoseUrl = translationService.translateSpokenToSigned(
        text,
        "en", // English
        "ase" // American Sign Language
      );

      setPoseUrl(generatedPoseUrl);
      console.log("Generated pose URL for chat response:", generatedPoseUrl);
    } catch (err) {
      console.error("Failed to generate pose URL:", err);
      setError("Failed to generate sign language");
    } finally {
      setIsLoading(false);
    }
  }, [text]);

  return (
    <div className="w-full h-full">
      {isLoading && (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Generating...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center">
            <div className="text-xl mb-1">⚠️</div>
            <p className="text-xs text-destructive">{error}</p>
          </div>
        </div>
      )}

      {poseUrl && !isLoading && !error && (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="w-full h-full max-w-[256px] max-h-[256px]">
            <PoseViewer
              src={poseUrl}
              className="w-full h-full"
              showControls={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
