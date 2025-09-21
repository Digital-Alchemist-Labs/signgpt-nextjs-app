"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, RotateCcw, Trash2, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { TranslationService } from "@/services/TranslationService";
import { PoseViewer } from "@/components/pose/PoseViewer";
import EnhancedTextInput from "@/components/translate/EnhancedTextInput";
import EnhancedTranslationOutput from "@/components/translate/EnhancedTranslationOutput";

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

export default function EnhancedChatPage() {
  const { t } = useTranslation();
  const { settings } = useSettings();

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Translation state for sign language display
  const [currentResponseText, setCurrentResponseText] = useState("");
  const [showSignLanguage, setShowSignLanguage] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // API configuration
  const API_BASE_URL = "http://localhost:8000"; // SignGPT Crew Server

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Send message to chat API
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Set current response for sign language display
      setCurrentResponseText(data.content);
      setShowSignLanguage(true);
    } catch (error) {
      console.error("Failed to send message:", error);
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
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {t("Enhanced Chat")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Chat with SignGPT AI Assistant
          </p>
        </div>
        <div className="flex items-center gap-2">
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
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 lg:grid-rows-2 gap-4 md:gap-6 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Top Left - Text/Video Input */}
        <div className="lg:col-start-1 lg:row-start-1 bg-card rounded-xl border border-border p-4 md:p-6 shadow-sm min-h-[320px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">Input</h2>
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div className="w-full h-full flex-1">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message here..."
                className="w-full h-full p-4 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                maxLength={500}
              />
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>{inputMessage.length}/500</span>
            </div>

            {/* Send button */}
            <div className="flex justify-center">
              <button
                onClick={sendMessage}
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

          <div className="flex-1 overflow-y-auto max-h-[350px] space-y-4 pr-2">
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
              messages.map((message) => (
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
              ))
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
