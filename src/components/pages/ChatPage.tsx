"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, RotateCcw, Trash2, Play, Square, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { safeFetch } from "@/lib/errorHandler";
import { TranslationService } from "@/services/TranslationService";
import { PoseViewer } from "@/components/pose/PoseViewer";
import HandTracker, { HandTrackerRef } from "@/components/pose/HandTracker";
import EnhancedChatPage from "./EnhancedChatPage";

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

export default function ChatPage() {
  const { t } = useTranslation();

  // UI Mode state
  type UiMode = "original" | "enhanced";
  const [uiMode, setUiMode] = useState<UiMode>("original");

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Translation state for sign language display
  const [currentResponseText, setCurrentResponseText] = useState("");
  const [showSignLanguage, setShowSignLanguage] = useState(false);

  // Sign recognition state (원본 signgpt-front 방식)
  const [isSignRecognitionActive, setIsSignRecognitionActive] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [webSocketError, setWebSocketError] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [recognitionHistory, setRecognitionHistory] = useState<
    {
      recognized_word: string;
      confidence: number;
      timestamp: number;
    }[]
  >([]);
  const [recognitionResult, setRecognitionResult] = useState<{
    recognized_word: string;
    confidence: number;
    timestamp: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);

  // Camera reset state
  const [showCameraResetMessage, setShowCameraResetMessage] = useState(false);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [lastRecognitionTime, setLastRecognitionTime] = useState<number>(
    Date.now()
  );

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const handTrackerRef = useRef<HandTrackerRef>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // API configuration - use local API routes that proxy to external server
  const API_BASE_URL = "/api"; // Local Next.js API routes

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    console.log("📊 Messages state changed:", messages);
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
          console.log("🔄 DOM mutation detected - restoring focus");
          setTimeout(() => {
            try {
              input.focus();
              console.log("✅ Focus restored after DOM mutation");
            } catch (error) {
              console.error(
                "❌ Failed to restore focus after DOM mutation:",
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
  }, []);

  // Handle focus tracking
  const handleInputFocus = useCallback(() => {
    hadFocusRef.current = true;
  }, []);

  // Handle blur with focus retention logic
  const handleInputBlur = useCallback(
    (e?: React.FocusEvent<HTMLTextAreaElement>) => {
      console.log("🔍 Input blur event triggered", {
        relatedTarget: e?.relatedTarget,
        allowBlur: allowBlurRef.current,
      });

      // Prevent unintended blur (e.g., due to background updates)
      const movingTo = e?.relatedTarget as HTMLElement | null;
      const intentional = allowBlurRef.current || !!movingTo;

      if (!intentional) {
        console.log("🚫 Preventing unintended blur - restoring focus");
        hadFocusRef.current = true;
        const input = inputRef.current;
        if (input) {
          // Use multiple strategies to ensure focus is restored
          requestAnimationFrame(() => {
            try {
              input.focus();
              console.log("✅ Focus restored in requestAnimationFrame");
            } catch (error) {
              console.error(
                "❌ Failed to restore focus in requestAnimationFrame:",
                error
              );
            }
          });

          // Also try immediate focus restoration
          setTimeout(() => {
            if (document.activeElement !== input && hadFocusRef.current) {
              try {
                input.focus();
                console.log("✅ Focus restored in setTimeout");
              } catch (error) {
                console.error(
                  "❌ Failed to restore focus in setTimeout:",
                  error
                );
              }
            }
          }, 50);
        }
      } else {
        console.log("✅ Intentional blur allowed");
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
        console.log("🔄 Restoring focus to input field due to state change");
        requestAnimationFrame(() => {
          try {
            input.focus();
            console.log("✅ Focus restored successfully");
          } catch (error) {
            console.error("❌ Failed to restore focus:", error);
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

  // WebSocket 연결 (보안 강화된 프록시 방식)
  const connectWebSocket = useCallback(async () => {
    try {
      console.log("🔄 API 프록시를 통해 WebSocket URL 가져오기 시작...");

      // API 프록시를 통해 WebSocket URL 가져오기
      const apiUrl =
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000/api/websocket-proxy"
          : "/api/websocket-proxy";
      console.log("🌐 API URL:", apiUrl);

      let proxyResponse;
      try {
        proxyResponse = await safeFetch(apiUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          cache: "no-cache",
        });
      } catch (fetchError) {
        console.warn(
          "⚠️ WebSocket 프록시 서버에 연결할 수 없습니다. 채팅 기능은 제한적으로 작동합니다."
        );
        console.warn("fetchError:", fetchError);
        setIsWebSocketConnected(false);
        setWebSocketError(
          "WebSocket 서버를 사용할 수 없습니다. 기본 채팅 모드로 작동합니다."
        );
        return; // 에러를 던지지 않고 조용히 반환
      }

      console.log(
        "📡 프록시 응답 상태:",
        proxyResponse.status,
        proxyResponse.statusText
      );

      if (!proxyResponse.ok) {
        if (proxyResponse.status === 503) {
          console.info(
            "ℹ️ WebSocket 서비스를 사용할 수 없습니다. 기본 모드로 작동합니다."
          );
        } else {
          console.warn(
            "⚠️ WebSocket 설정을 가져올 수 없습니다. 기본 모드로 작동합니다."
          );
        }
        setIsWebSocketConnected(false);
        setWebSocketError(
          "WebSocket 서비스를 사용할 수 없습니다. 기본 채팅 모드로 작동합니다."
        );
        return;
      }

      const responseData = await proxyResponse.json();
      console.log("📦 프록시 응답 데이터:", responseData);

      const { webSocketUrl: wsUrl } = responseData;
      console.log("🔗 SignGPT Server에 WebSocket 연결 시도 중...", wsUrl);

      // SignGPT Server WebSocket 연결
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsWebSocketConnected(true);
        setWebSocketError(null);
        console.log("✅ WebSocket 연결 성공!");
      };

      wsRef.current.onclose = (event) => {
        setIsWebSocketConnected(false);
        
        // Only log if it was a clean close or unexpected disconnect
        if (event.code !== 1000) {
          console.info("ℹ️ WebSocket 연결 종료:", event.code, event.reason || "정상 종료");
        }

        // Don't auto-reconnect - user can manually retry if needed
        // This prevents console spam when server is unavailable
      };

      wsRef.current.onerror = (error) => {
        const target = error.target as WebSocket | null;
        const errorDetails = {
          type: error.type,
          target: target?.url || "Unknown URL",
          readyState: target?.readyState || "Unknown state",
          timestamp: new Date().toISOString(),
        };

        // Use warn instead of error since this is expected when server is unavailable
        console.warn("⚠️ WebSocket 연결 불가 (정상 - 서버 사용 불가):", errorDetails);
        setIsWebSocketConnected(false);
        
        // Only set error message if user tries to use the feature
        if (isSignRecognitionActive) {
          setWebSocketError(
            "수어 인식 서버에 연결할 수 없습니다. 나중에 다시 시도해주세요."
          );
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "keypoints_added") {
            setFrameCount(data.total_frames);
            console.log("📊 Keypoints added, total frames:", data.total_frames);
          } else if (data.type === "recognition_result") {
            console.log("🎯 ===== RECOGNITION RESULT RECEIVED =====");
            console.log("🎯 Recognition result received:", data);
            console.log("🎯 Session active:", isSignRecognitionActive);
            console.log("🎯 Recognized word:", data.recognized_word);
            console.log("🎯 Confidence:", data.confidence);
            console.log("🎯 WebSocket connected:", isWebSocketConnected);

            setRecognitionResult(data);
            setIsProcessing(false);

            // 수어 인식 결과가 있으면 세션 상태와 관계없이 히스토리에 추가
            if (data.recognized_word && data.recognized_word.trim() !== "") {
              console.log(
                "🎯 Adding recognition result to history (regardless of session state)"
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
                        "🔄 Showing camera reset message due to consecutive failures:",
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
                console.log("🎯 ===== ADDING TO RECOGNITION HISTORY =====");
                console.log("🎯 Previous history length:", prev.length);
                console.log("🎯 New item being added:", newItem);
                console.log("🎯 New history length:", newHistory.length);
                console.log("🎯 Full new history:", newHistory);
                console.log("🎯 Session was active:", isSignRecognitionActive);
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
      // Silently handle WebSocket connection failures - this is expected behavior
      console.info(
        "ℹ️ WebSocket 서버를 사용할 수 없습니다. 기본 채팅 모드로 작동합니다.",
        process.env.NODE_ENV === "development" ? error : ""
      );

      setIsWebSocketConnected(false);
      // Don't set error message - let user discover this only if they try to use sign recognition
    }
  }, [isSignRecognitionActive, isWebSocketConnected, lastRecognitionTime]);

  // WebSocket 연결 해제
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // WebSocket 연결 초기화 (한 번만 실행)
  useEffect(() => {
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  // Send message to chat API
  const sendMessage = useCallback(async () => {
    const messageText = inputMessage.trim();
    console.log("🚀 Attempting to send message:", messageText);

    if (!messageText || isLoading) {
      console.log("❌ Cannot send message - empty text or loading:", {
        messageText,
        isLoading,
      });
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    console.log("📝 Adding user message to chat:", userMessage);
    setMessages((prev) => {
      const newMessages = [...prev, userMessage];
      console.log("📋 Updated messages:", newMessages);
      return newMessages;
    });
    setInputMessage("");
    setIsLoading(true);
    setError(null);

    try {
      console.log("🌐 Sending request to:", `${API_BASE_URL}/chat`);
      const response = await safeFetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ HTTP error response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const data: ChatResponse = await response.json();
      console.log("✅ Received response:", data);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };

      console.log("🤖 Adding assistant message to chat:", assistantMessage);
      setMessages((prev) => {
        const newMessages = [...prev, assistantMessage];
        console.log("📋 Final messages:", newMessages);
        return newMessages;
      });

      // Set current response for sign language display
      setCurrentResponseText(data.content);
      setShowSignLanguage(true);
    } catch (error) {
      console.error("💥 Failed to send message:", error);
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
      console.log("⚠️ Adding error message to chat:", errorMessage);
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      console.log("🏁 Message sending process completed");
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

  // 인식 시작
  const startRecognition = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setIsProcessing(true);
      wsRef.current.send(
        JSON.stringify({
          action: "recognize",
        })
      );
    }
  }, []);

  // 키포인트 전송 및 자동 인식 (원본 signgpt-front 방식)
  const sendKeypoints = useCallback(
    (keypoints: number[][]) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // 키포인트 전송
        wsRef.current.send(
          JSON.stringify({
            action: "add_keypoints",
            keypoints: keypoints,
          })
        );

        // 자동 모드일 때 즉시 인식 요청
        if (isAutoMode) {
          setTimeout(() => {
            startRecognition();
          }, 100); // 키포인트 전송 후 바로 인식
        }
      }
    },
    [isAutoMode, startRecognition]
  );

  // 데이터 초기화
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

  // Start session (original signgpt-front method)
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

  // End session (original signgpt-front method) - Send recognized words to chat
  const stopSignRecognition = useCallback(() => {
    console.log("🛑 ===== STOP SIGN RECOGNITION CALLED =====");
    console.log("🛑 Current recognition history:", recognitionHistory);
    console.log("🛑 Recognition history length:", recognitionHistory.length);
    console.log("🛑 isSignRecognitionActive:", isSignRecognitionActive);

    setIsSignRecognitionActive(false);
    setIsAutoMode(false);

    if (handTrackerRef.current) {
      handTrackerRef.current.stopAutoRecording();
    }

    // 인식된 단어들을 채팅 메시지로 추가하고 자동 전송
    console.log("🔍 Recognition history length:", recognitionHistory.length);
    console.log("🔍 Recognition history:", recognitionHistory);

    // Filter out only empty results (모든 인식된 수어를 포함하도록 신뢰도 조건 완화)
    const validRecognitions = recognitionHistory.filter(
      (item) => item.recognized_word && item.recognized_word.trim() !== ""
    );
    console.log("🔍 Valid recognitions (모든 수어 포함):", validRecognitions);

    if (validRecognitions.length > 0) {
      const recognizedWords = validRecognitions.map(
        (item) => item.recognized_word
      );
      // 중복 제거하지 않고 모든 인식된 수어를 순서대로 포함
      const wordsText = recognizedWords.join(" ").trim();

      console.log(
        "✅ Sign language recognition completed! Recognized words:",
        wordsText
      );

      if (wordsText) {
        // Show recognition completion notification to user
        const notification = document.createElement("div");
        notification.className =
          "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all";
        notification.innerHTML = `✅ Sign Recognition Complete: "${wordsText}"<br><small>Sending to chat automatically...</small>`;
        document.body.appendChild(notification);

        // Set text in input field
        setInputMessage(wordsText);

        // Auto-send message after a short delay
        setTimeout(async () => {
          console.log("📤 Auto-sending sign recognition result:", wordsText);

          // Create user message
          const userMessage = {
            id: Date.now().toString(),
            role: "user" as const,
            content: wordsText,
            timestamp: new Date(),
          };

          console.log("📝 Adding user message:", userMessage);
          setMessages((prev) => {
            const newMessages = [...prev, userMessage];
            console.log("📋 Updated messages array:", newMessages);
            return newMessages;
          });

          setInputMessage(""); // Clear input field
          setIsLoading(true);
          setError(null);

          try {
            console.log("🌐 Sending API request to:", `${API_BASE_URL}/chat`);
            const response = await safeFetch(`${API_BASE_URL}/chat`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: userMessage.content,
              }),
            });

            console.log("📡 API Response status:", response.status);

            if (!response.ok) {
              const errorText = await response.text();
              console.error("❌ API Error response:", errorText);
              throw new Error(
                `HTTP error! status: ${response.status} - ${errorText}`
              );
            }

            const data = await response.json();
            console.log("✅ API Response data:", data);

            const assistantMessage = {
              id: (Date.now() + 1).toString(),
              role: "assistant" as const,
              content: data.content,
              timestamp: new Date(),
            };

            console.log("🤖 Adding assistant message:", assistantMessage);
            setMessages((prev) => {
              const newMessages = [...prev, assistantMessage];
              console.log("📋 Final messages array:", newMessages);
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
            console.error("💥 Failed to send message:", error);
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
            console.log("⚠️ Adding error message:", errorMessage);
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
        console.log("⚠️ No valid words to send after filtering");
      }
    } else {
      console.log(
        "❌ Sign recognition session ended - no valid words recognized."
      );
      console.log(
        "💡 Tip: Try making clearer sign gestures for better recognition."
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
    console.log("🧹 Clearing recognition history after processing");
    setRecognitionHistory([]);
  }, [
    recognitionHistory,
    isSignRecognitionActive,
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

    console.log("🔄 Camera restarted, reset failure tracking");
  }, []);

  // Handle keypoints from camera (original method)
  const handleKeypointsDetected = useCallback(
    (keypoints: number[][]) => {
      sendKeypoints(keypoints);
    },
    [sendKeypoints]
  );

  // Enhanced mode component
  if (uiMode === "enhanced") {
    return (
      <EnhancedChatPage onSwitchToOriginal={() => setUiMode("original")} />
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
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
                title={t("chat.close")}
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
            SignGPT Chat
          </h1>
          <p className="text-sm text-muted-foreground">
            Chat with AI and see responses in sign language
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch to Enhanced Button */}
          <button
            onClick={() => setUiMode("enhanced")}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors"
            title={t("chat.switchToEnhanced")}
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
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
            Enhanced
          </button>
          {error && (
            <button
              onClick={retryLastMessage}
              className="flex items-center gap-2 px-3 py-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
              title={t("chat.retry")}
              data-sign-text="retry"
              data-sign-category="button"
              data-sign-description={t("chat.retry")}
              aria-label={t("chat.retry")}
            >
              <RotateCcw className="w-4 h-4" />
              {t("common.retry")}
            </button>
          )}

          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            title={t("chat.clear")}
            data-sign-text="clear"
            data-sign-category="button"
            data-sign-description={t("chat.clear")}
            aria-label={t("chat.clear")}
          >
            <Trash2 className="w-4 h-4" />
            {t("common.delete")}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex px-4 md:px-6 lg:px-8 py-4 md:py-6 gap-4 md:gap-6 max-w-7xl mx-auto">
        {/* Sign Language Output Panel - Left Side */}
        <div className="w-80 lg:w-96 border border-border rounded-xl bg-card shadow-sm">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-foreground">
                Sign Language Output
              </h3>
              <div className="w-5 h-5 text-muted-foreground">🤟</div>
            </div>
            <p className="text-sm text-muted-foreground">
              AI responses translated to sign language
            </p>
          </div>

          <div className="p-4 md:p-6">
            {/* Traditional Sign Language Display */}
            {showSignLanguage && currentResponseText ? (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  응답 수어 변환
                </h4>
                <SignLanguageDisplay text={currentResponseText} />
              </div>
            ) : (
              <div className="text-center py-8 md:py-12">
                <div className="text-4xl mb-3">🤟</div>
                <p className="text-muted-foreground text-sm">
                  Sign language will appear here when you receive responses
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Messages - Center */}
        <div className="flex-[1.5] flex flex-col border border-border rounded-xl bg-card shadow-sm">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Welcome to SignGPT Chat!
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Start a conversation and see AI responses translated into sign
                  language. Type your message below to get started.
                </p>
              </div>
            )}

            {(() => {
              console.log("🎨 Rendering messages:", messages);
              return messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground ml-4"
                        : "output-container text-foreground mr-4"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ));
            })()}

            {isLoading && (
              <div className="flex justify-start">
                <div className="output-container text-foreground rounded-lg p-4 mr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>SignGPT is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="bg-destructive/10 text-destructive rounded-lg p-4 max-w-md">
                  <div className="text-sm font-medium">Error</div>
                  <div className="text-sm mt-1">{error}</div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4 md:p-6">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder={t("chat.placeholder")}
                  className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary max-h-32"
                  rows={1}
                  style={{
                    height: "auto",
                    minHeight: "48px",
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${Math.min(
                      target.scrollHeight,
                      128
                    )}px`;
                  }}
                />
              </div>

              <button
                onClick={() => {
                  console.log("🔘 Send button clicked");
                  console.log("📝 Input message:", `"${inputMessage}"`);
                  console.log("📝 Input message length:", inputMessage.length);
                  console.log(
                    "📝 Input message trimmed:",
                    `"${inputMessage.trim()}"`
                  );
                  console.log(
                    "📝 Input message trimmed length:",
                    inputMessage.trim().length
                  );
                  console.log("🔒 isLoading:", isLoading);
                  console.log(
                    "🔒 Button disabled:",
                    !inputMessage.trim() || isLoading
                  );
                  if (inputMessage.trim() && !isLoading) {
                    console.log("✅ Calling sendMessage");
                    sendMessage();
                  } else {
                    console.log(
                      "❌ Not calling sendMessage - conditions not met"
                    );
                  }
                }}
                disabled={!inputMessage.trim() || isLoading}
                className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={t("chat.send")}
                data-sign-text="send"
                data-sign-category="button"
                data-sign-description={t("chat.send")}
                aria-label={t("chat.send")}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sign Recognition Panel - Right Side */}
        <div className="w-80 lg:w-96 border border-border rounded-xl bg-card shadow-sm">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-foreground">
                Sign Language Input
              </h3>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isWebSocketConnected
                      ? "bg-green-400 animate-pulse"
                      : "bg-red-400"
                  }`}
                ></div>
                <span className="text-xs text-muted-foreground">
                  {isWebSocketConnected
                    ? t("chat.serverConnected")
                    : t("chat.serverDisconnected")}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Use camera to input sign language messages
            </p>
          </div>

          <div className="p-4 md:p-6 space-y-4">
            {/* Instruction Message */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="text-blue-500">ℹ️</div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  수어 인식을 누른 후 카메라 초기화 버튼을 눌러주세요
                </span>
              </div>
            </div>

            {/* Camera Feed */}
            <div className="relative">
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

            {/* Sign Recognition Controls */}
            <div className="space-y-3">
              {!isWebSocketConnected ? (
                <div
                  className={`border rounded-lg p-3 ${
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
                        ? t("chat.connectionFailed")
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-lg transition-all"
                >
                  <Play className="w-5 h-5" />
                  Start Sign Language
                </button>
              ) : (
                <button
                  onClick={stopSignRecognition}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-lg transition-all"
                >
                  <Square className="w-5 h-5" />
                  Stop Sign Language
                </button>
              )}

              {/* Utility Controls */}
              <div className="flex gap-2">
                <button
                  onClick={clearData}
                  disabled={!isWebSocketConnected}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
                <button
                  onClick={retryCamera}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  Camera
                </button>
              </div>
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
                          recognitionHistory.map((item) => item.recognized_word)
                        ),
                      ].join(" ")}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Current Recognition Result */}
            {recognitionResult && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Latest Recognition Result
                </h4>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-foreground text-lg">
                      {recognitionResult.recognized_word}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {(recognitionResult.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(
                      recognitionResult.timestamp * 1000
                    ).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}

            {/* Recognition History */}
            {recognitionHistory.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Recognition History ({recognitionHistory.length} words)
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {recognitionHistory.slice(-5).map((item, index) => (
                    <div
                      key={index}
                      className="bg-secondary/30 rounded p-2 text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">
                          {item.recognized_word}
                        </span>
                        <span className="text-muted-foreground">
                          {(item.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(item.timestamp * 1000).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Session Summary */}
                {!isSignRecognitionActive && recognitionHistory.length > 0 && (
                  <div className="mt-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <h4 className="text-green-300 font-semibold text-sm mb-1">
                      세션 완료
                    </h4>
                    <p className="text-green-200 text-xs">
                      총 {recognitionHistory.length}개의 수어가 인식되었습니다.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {[
                        ...new Set(
                          recognitionHistory.map((item) => item.recognized_word)
                        ),
                      ].map((word, index) => (
                        <span
                          key={index}
                          className="bg-green-600/30 text-green-100 px-1 py-0.5 rounded text-xs"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Processing Status */}
            {isProcessing && (
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span>수어 인식 중...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Component to display sign language for chat responses
function SignLanguageDisplay({ text }: { text: string }) {
  const [poseUrl, setPoseUrl] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poseData, setPoseData] = useState<Record<string, unknown> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const translationServiceRef = useRef(new TranslationService());

  // Load pose data from Sign.MT via proxy
  const loadPoseData = useCallback(
    async (text: string, spokenLanguage: string, signedLanguage: string) => {
      try {
        console.log("[Chat] Loading pose data via proxy:", {
          text,
          spokenLanguage,
          signedLanguage,
        });

        const result = await translationServiceRef.current.fetchPoseDataCached(
          text,
          spokenLanguage,
          signedLanguage
        );

        if (result.error) {
          console.error("[Chat] Failed to load pose data:", result.error);
          return null;
        }

        if (result.pose) {
          console.log("[Chat] Pose data loaded successfully:", result.contentType);

          // If pose is base64 encoded, decode it
          if (typeof result.pose === "string") {
            try {
              const binaryString = atob(result.pose);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], {
                type: result.contentType || "application/x-pose",
              });
              const poseUrl = URL.createObjectURL(blob);
              setPoseData({ url: poseUrl, blob });
              return poseUrl;
            } catch (error) {
              console.error("[Chat] Failed to decode pose data:", error);
            }
          } else {
            // Assume it's already an object
            setPoseData(result.pose as Record<string, unknown>);
            return result.pose;
          }
        }

        if (result.poseUrl) {
          console.log("[Chat] Pose URL returned:", result.poseUrl);
          setPoseData({ url: result.poseUrl });
          return result.poseUrl;
        }

        return null;
      } catch (error) {
        console.error("[Chat] Exception loading pose data:", error);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    if (!text) return;

    const initializePose = async () => {
      setIsLoading(true);
      setError(null);
      setVideoUrl(""); // Clear previous video
      setPoseData(null);

      try {
        // Generate pose URL using the translation service
        const generatedPoseUrl = translationServiceRef.current.translateSpokenToSigned(
          text,
          "en", // English
          "ase" // American Sign Language
        );

        setPoseUrl(generatedPoseUrl);
        console.log("[Chat] Generated pose URL for chat response:", generatedPoseUrl);

        // Try to load actual pose data from Sign.MT via proxy
        const poseResult = await loadPoseData(text, "en", "ase");
        
        if (poseResult) {
          console.log("[Chat] Pose data loaded successfully from Sign.MT");
        } else {
          console.log("[Chat] Using fallback pose URL");
        }
      } catch (err) {
        console.error("[Chat] Failed to generate pose URL:", err);
        setError("Failed to generate sign language");
      } finally {
        setIsLoading(false);
      }
    };

    initializePose();
  }, [text, loadPoseData]);

  // Generate video from pose data
  const generateVideo = useCallback(async () => {
    if (!poseUrl || !text) return;

    setIsGeneratingVideo(true);
    setError(null);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas context not available");
      }

      const stream = canvas.captureStream(30);
      const recordedChunks: Blob[] = [];

      const mimeTypes = [
        "video/webm; codecs=vp9",
        "video/webm; codecs=vp8",
        "video/webm",
      ];

      let mediaRecorder: MediaRecorder | null = null;

      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 2500000,
          });
          break;
        }
      }

      if (!mediaRecorder) {
        throw new Error("MediaRecorder not supported");
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(recordedChunks, {
          type: mediaRecorder!.mimeType,
        });
        const videoUrl = URL.createObjectURL(videoBlob);
        setVideoUrl(videoUrl);
        console.log("Video created:", videoBlob.size, "bytes");
      };

      mediaRecorder.start();

      // Generate animation frames
      let frameCount = 0;
      const isVeryShortText = text.length <= 1;
      const isShortText = text.length <= 3;
      
      let minFrames, textBasedFrames;
      if (isVeryShortText) {
        minFrames = 120;
        textBasedFrames = 120;
      } else if (isShortText) {
        minFrames = 150;
        textBasedFrames = text.length * 40;
      } else {
        minFrames = 180;
        textBasedFrames = text.length * 25;
      }

      const maxFrames = Math.max(minFrames, textBasedFrames);
      const textHash = text.split("").reduce((hash, char) => hash + char.charCodeAt(0), 0);

      const drawFrame = () => {
        // Dark background
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 40) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 40) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(canvas.width, i);
          ctx.stroke();
        }

        const progress = frameCount / maxFrames;
        const time = progress * Math.PI * 2;

        // Animation variation
        let textVariation = 0;
        if (isVeryShortText) {
          const gesturePhase = progress * 3;
          if (gesturePhase < 1) {
            textVariation = Math.sin(gesturePhase * Math.PI) * 0.5;
          } else if (gesturePhase < 2) {
            textVariation = 0.8;
          } else {
            textVariation = Math.sin((gesturePhase - 2) * Math.PI) * 0.5 + 0.3;
          }
        } else if (isShortText) {
          textVariation = Math.sin(progress * Math.PI * 4) * 0.2;
        }

        // Draw skeleton
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 3;

        // Shoulders
        const shoulderY = centerY - 40;
        const shoulderSpread = 70 + Math.sin(time * 0.5) * 8;
        const leftShoulderX = centerX - shoulderSpread / 2;
        const rightShoulderX = centerX + shoulderSpread / 2;

        ctx.beginPath();
        ctx.moveTo(leftShoulderX, shoulderY);
        ctx.lineTo(rightShoulderX, shoulderY);
        ctx.stroke();

        // Arms
        let leftElbowX, leftElbowY, leftHandX, leftHandY;
        let rightElbowX, rightElbowY, rightHandX, rightHandY;

        if (isVeryShortText) {
          const gestureIntensity = textVariation;
          leftElbowX = leftShoulderX - 15;
          leftElbowY = shoulderY + 60;
          leftHandX = leftElbowX - 8 + gestureIntensity * 25;
          leftHandY = leftElbowY + 15 - gestureIntensity * 12;

          rightElbowX = rightShoulderX + 15;
          rightElbowY = shoulderY + 60;
          rightHandX = rightElbowX + 8 + gestureIntensity * 25;
          rightHandY = rightElbowY + 15 - gestureIntensity * 12;
        } else {
          const armAnimation = Math.sin(time + textHash * 0.01) * 0.3;
          leftElbowX = leftShoulderX - 25 + Math.sin(time + textVariation) * 35;
          leftElbowY = shoulderY + 50 + armAnimation * 15;
          leftHandX = leftElbowX - 15 + Math.cos(time + textHash * 0.01 + textVariation) * 40;
          leftHandY = leftElbowY + 35 + Math.sin(time * 1.5 + textVariation) * 25;

          rightElbowX = rightShoulderX + 25 + Math.cos(time + textVariation) * 35;
          rightElbowY = shoulderY + 50 - armAnimation * 15;
          rightHandX = rightElbowX + 15 + Math.sin(time + textHash * 0.01 + textVariation) * 40;
          rightHandY = rightElbowY + 35 + Math.cos(time * 1.5 + textVariation) * 25;
        }

        // Draw arms
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, shoulderY);
        ctx.lineTo(leftElbowX, leftElbowY);
        ctx.lineTo(leftHandX, leftHandY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rightShoulderX, shoulderY);
        ctx.lineTo(rightElbowX, rightElbowY);
        ctx.lineTo(rightHandX, rightHandY);
        ctx.stroke();

        // Hands
        ctx.fillStyle = "#ffaa00";
        ctx.beginPath();
        ctx.arc(leftHandX, leftHandY, 10, 0, 2 * Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(rightHandX, rightHandY, 10, 0, 2 * Math.PI);
        ctx.fill();

        // Fingers
        for (let i = 0; i < 5; i++) {
          let fingerAngle, fingerX, fingerY;

          if (isVeryShortText) {
            const fingerPositions = [-0.8, -0.4, 0, 0.4, 0.8];
            fingerAngle = fingerPositions[i] + textVariation * 0.1;
            fingerX = leftHandX + Math.cos(fingerAngle) * 12;
            fingerY = leftHandY + Math.sin(fingerAngle) * 12;
          } else {
            fingerAngle = (i - 2) * 0.3 + Math.sin(time * 3 + i + textHash) * 0.2;
            fingerX = leftHandX + Math.cos(fingerAngle) * 15;
            fingerY = leftHandY + Math.sin(fingerAngle) * 15;
          }

          ctx.beginPath();
          ctx.arc(fingerX, fingerY, 2.5, 0, 2 * Math.PI);
          ctx.fill();

          ctx.strokeStyle = "#ffaa00";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(leftHandX, leftHandY);
          ctx.lineTo(fingerX, fingerY);
          ctx.stroke();
        }

        for (let i = 0; i < 5; i++) {
          let fingerAngle, fingerX, fingerY;

          if (isVeryShortText) {
            const fingerPositions = [-0.8, -0.4, 0, 0.4, 0.8];
            fingerAngle = fingerPositions[i] + textVariation * 0.1;
            fingerX = rightHandX + Math.cos(fingerAngle) * 12;
            fingerY = rightHandY + Math.sin(fingerAngle) * 12;
          } else {
            fingerAngle = (i - 2) * 0.3 + Math.cos(time * 2.8 + i + textHash) * 0.2;
            fingerX = rightHandX + Math.cos(fingerAngle) * 15;
            fingerY = rightHandY + Math.sin(fingerAngle) * 15;
          }

          ctx.beginPath();
          ctx.arc(fingerX, fingerY, 2.5, 0, 2 * Math.PI);
          ctx.fill();

          ctx.strokeStyle = "#ffaa00";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(rightHandX, rightHandY);
          ctx.lineTo(fingerX, fingerY);
          ctx.stroke();
        }

        // Head
        ctx.strokeStyle = "#88ff00";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 80, 25, 0, 2 * Math.PI);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = "#88ff00";
        ctx.beginPath();
        ctx.arc(centerX - 8, centerY - 88, 2.5, 0, 2 * Math.PI);
        ctx.arc(centerX + 8, centerY - 88, 2.5, 0, 2 * Math.PI);
        ctx.fill();

        // Text info
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`"${text}"`, 10, 25);

        // Progress
        ctx.fillStyle = "#00ffff";
        ctx.font = "11px Arial";
        ctx.textAlign = "right";
        ctx.fillText(`${frameCount + 1}/${maxFrames}`, canvas.width - 10, canvas.height - 10);

        // Progress bar
        const barWidth = canvas.width - 20;
        const barHeight = 3;
        const barY = canvas.height - 25;

        ctx.fillStyle = "#333333";
        ctx.fillRect(10, barY, barWidth, barHeight);

        ctx.fillStyle = "#00ffff";
        ctx.fillRect(10, barY, barWidth * progress, barHeight);

        frameCount++;

        if (frameCount < maxFrames) {
          setTimeout(drawFrame, 1000 / 30);
        } else {
          setTimeout(() => {
            mediaRecorder!.stop();
            stream.getTracks().forEach((track) => track.stop());
            setIsGeneratingVideo(false);
          }, 100);
        }
      };

      drawFrame();
    } catch (err) {
      console.error("Failed to generate video:", err);
      setError("Failed to generate video");
      setIsGeneratingVideo(false);
    }
  }, [poseUrl, text]);

  const handleDownload = useCallback(() => {
    if (!videoUrl) return;
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `sign-language-${text.substring(0, 20)}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [videoUrl, text]);

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <strong>Response:</strong> &quot;{text}&quot;
      </div>

      {/* Sign Language Display */}
      <div
        className="relative output-container rounded-xl overflow-hidden shadow-lg"
        style={{
          width: "100%",
          height: "320px",
          maxWidth: "320px",
          aspectRatio: "1/1",
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="text-center space-y-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="text-sm text-muted-foreground">
                Loading sign language...
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
            <div className="text-center space-y-2">
              <div className="text-destructive text-sm font-medium">
                {error}
              </div>
            </div>
          </div>
        )}

        {videoUrl && !isGeneratingVideo && (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain cursor-pointer rounded-lg"
            controls
            loop
            autoPlay
            muted
            playsInline
            onClick={(e) => {
              const video = e.currentTarget;
              if (video.paused) {
                video.play().catch(console.error);
              }
            }}
          />
        )}

        {poseUrl && !videoUrl && !isLoading && !error && !isGeneratingVideo && (
          <PoseViewer
            src={
              poseData && typeof poseData === "object" && "url" in poseData && typeof poseData.url === "string"
                ? poseData.url
                : poseUrl
            }
            className="w-full h-full"
            showControls={true}
            background="transparent"
            loop={true}
          />
        )}

        {isGeneratingVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90">
            <div className="text-center space-y-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="text-sm text-muted-foreground">
                Generating video...
              </div>
            </div>
          </div>
        )}

        {!poseUrl && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-muted-foreground text-sm">
                No sign language available
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {poseUrl && !isLoading && (
        <div className="flex items-center gap-2">
          {!videoUrl ? (
            <button
              onClick={generateVideo}
              disabled={isGeneratingVideo}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGeneratingVideo ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Generate Video
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
              <button
                onClick={generateVideo}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
