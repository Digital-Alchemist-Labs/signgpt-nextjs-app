"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, RotateCcw, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { TranslationService } from "@/services/TranslationService";
import { PoseViewer } from "@/components/pose/PoseViewer";
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
  const { settings } = useSettings();

  // UI Mode state
  const [uiMode, setUiMode] = useState<"original" | "enhanced">("original");

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Translation state for sign language display
  const [currentResponseText, setCurrentResponseText] = useState("");
  const [showSignLanguage, setShowSignLanguage] = useState(false);

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

  // Enhanced mode component
  if (uiMode === "enhanced") {
    return <EnhancedChatPage />;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Mode Toggle Tabs */}
      <div className="flex border-b border-border bg-background">
        <button
          onClick={() => setUiMode("original")}
          className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
            uiMode === "original"
              ? "text-primary border-b-2 border-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          Original
        </button>
        <button
          onClick={() => setUiMode("enhanced")}
          className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
            uiMode === "enhanced"
              ? "text-primary border-b-2 border-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          Enhanced
        </button>
      </div>

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
          {error && (
            <button
              onClick={retryLastMessage}
              className="flex items-center gap-2 px-3 py-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
              title="Retry last message"
              data-sign-text="retry"
              data-sign-category="button"
              data-sign-description="Retry sending the last message"
              aria-label="Retry last message"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          )}

          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            title="Clear chat"
            data-sign-text="clear"
            data-sign-category="button"
            data-sign-description="Clear all chat messages"
            aria-label="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Chat Messages */}
        <div className="flex-1 flex flex-col">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

            {messages.map((message) => (
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
                      : "bg-muted text-foreground mr-4"
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
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-lg p-4 mr-4">
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
          <div className="border-t border-border p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message here..."
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
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send message"
                data-sign-text="send"
                data-sign-category="button"
                data-sign-description="Send chat message"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sign Language Display Panel */}
        {showSignLanguage && currentResponseText && (
          <div className="w-80 border-l border-border bg-background/50 backdrop-blur-sm">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Sign Language
              </h3>
              <p className="text-sm text-muted-foreground">
                Latest response in sign language
              </p>
            </div>

            <div className="p-4">
              {/* Create a mock translation state for the EnhancedTranslationOutput */}
              <SignLanguageDisplay text={currentResponseText} />
            </div>
          </div>
        )}
      </div>
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
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <strong>Response:</strong> "{text}"
      </div>

      {/* Sign Language Display */}
      <div
        className="relative bg-muted rounded-xl overflow-hidden shadow-lg"
        style={{
          width: "100%",
          height: "300px",
          maxWidth: "300px",
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

        {poseUrl && !isLoading && !error && (
          <PoseViewer
            src={poseUrl}
            className="w-full h-full"
            showControls={true}
            background="transparent"
            loop={true}
          />
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
    </div>
  );
}
