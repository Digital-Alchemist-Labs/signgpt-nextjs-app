"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { TranslationService } from "@/services/TranslationService";
import {
  createLanguageDetectionService,
  LanguageDetectionService,
} from "@/services/LanguageDetectionService";

export interface Pose {
  landmarks: Array<{ x: number; y: number; z: number; visibility: number }>;
  timestamp: number;
}

export interface SignWritingObj {
  fsw: string;
  description?: string;
  illustration?: string;
}

export interface TranslationState {
  // Direction and mode
  spokenToSigned: boolean;
  inputMode: "webcam" | "upload" | "text";

  // Languages
  spokenLanguage: string;
  signedLanguage: string;
  detectedLanguage: string | null;

  // Text content
  spokenLanguageText: string;
  normalizedSpokenLanguageText: string | null;
  spokenLanguageSentences: string[];

  // Sign language content
  signWriting: SignWritingObj[];
  signedLanguagePose: string | null; // URL or Pose object
  signedLanguageVideo: string | null;

  // Status
  isTranslating: boolean;
  isSigning: boolean;
  signingProbability: number;
  pose: Pose | null;

  // Legacy support
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  videoUrl: string;
}

interface TranslationContextType {
  state: TranslationState;
  translationService: TranslationService;
  languageDetectionService: LanguageDetectionService;

  // Core actions
  setInputMode: (mode: "webcam" | "upload" | "text") => void;
  flipTranslationDirection: () => void;

  // Language management
  setSpokenLanguage: (language: string) => void;
  setSignedLanguage: (language: string) => void;
  detectLanguage: (text: string) => Promise<void>;

  // Text management
  setSpokenLanguageText: (text: string) => void;
  suggestAlternativeText: () => Promise<void>;

  // SignWriting management
  setSignWritingText: (text: string[]) => void;
  describeSignWritingSign: (fsw: string) => Promise<void>;

  // Video and pose management
  setSignedLanguageVideo: (url: string | null) => void;
  setSignedLanguagePose: (pose: string | null) => void;
  uploadPoseFile: (url: string) => void;

  // Pose file handling (from original project)
  handlePoseFileUpload: (file: File) => Promise<void>;

  // Actions
  copySignedLanguageVideo: () => Promise<void>;
  copySpokenLanguageText: () => Promise<void>;
  shareSignedLanguageVideo: () => Promise<void>;
  downloadSignedLanguageVideo: () => Promise<void>;

  // Translation
  changeTranslation: () => Promise<void>;

  // Status management
  setIsTranslating: (isTranslating: boolean) => void;
  setIsSigning: (isSigning: boolean) => void;
  setSigningProbability: (probability: number) => void;
  setPose: (pose: Pose | null) => void;

  // Legacy support
  setSourceText: (text: string) => void;
  setTranslatedText: (text: string) => void;
  setSourceLanguage: (language: string) => void;
  setTargetLanguage: (language: string) => void;
  setVideoUrl: (url: string) => void;
  resetTranslation: () => void;
}

const defaultState: TranslationState = {
  // Direction and mode
  spokenToSigned: true,
  inputMode: "text",

  // Languages
  spokenLanguage: "en",
  signedLanguage: "asl", // Using ASL as default for better user recognition
  detectedLanguage: null,

  // Text content
  spokenLanguageText: "",
  normalizedSpokenLanguageText: null,
  spokenLanguageSentences: [],

  // Sign language content
  signWriting: [],
  signedLanguagePose: null,
  signedLanguageVideo: null,

  // Status
  isTranslating: false,
  isSigning: false,
  signingProbability: 0,
  pose: null,

  // Legacy support
  sourceText: "",
  translatedText: "",
  sourceLanguage: "en",
  targetLanguage: "asl",
  videoUrl: "",
};

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

export function TranslationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<TranslationState>(defaultState);
  const [translationService] = useState(() => new TranslationService());
  const [languageDetectionService] = useState(() =>
    createLanguageDetectionService()
  );

  // Initialize language detection service
  useEffect(() => {
    languageDetectionService.init().catch(console.error);
  }, [languageDetectionService]);

  // Core actions
  const setInputMode = useCallback((mode: "webcam" | "upload" | "text") => {
    setState((prev) => {
      if (prev.inputMode === mode) return prev;

      const newState = { ...prev, inputMode: mode };

      // Reset video when changing input mode
      if (mode !== "upload") {
        newState.signedLanguageVideo = null;
      }

      return newState;
    });
  }, []);

  const flipTranslationDirection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      spokenToSigned: !prev.spokenToSigned,
      spokenLanguage:
        prev.spokenLanguage || prev.detectedLanguage || prev.spokenLanguage,
      signedLanguage:
        prev.signedLanguage || prev.detectedLanguage || prev.signedLanguage,
      detectedLanguage: null,
      signedLanguageVideo: null,
      inputMode: prev.spokenToSigned ? "webcam" : "text",
    }));
  }, []);

  const detectLanguage = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setState((prev) => ({ ...prev, detectedLanguage: null }));
        return;
      }

      try {
        const detectedLanguage =
          await languageDetectionService.detectSpokenLanguage(text);
        setState((prev) => ({ ...prev, detectedLanguage }));
      } catch (error) {
        console.error("Language detection failed:", error);
      }
    },
    [languageDetectionService]
  );

  // Translation
  const changeTranslation = useCallback(async () => {
    setState((prev) => {
      const {
        spokenToSigned,
        spokenLanguage,
        signedLanguage,
        detectedLanguage,
        spokenLanguageText,
      } = prev;

      if (!spokenToSigned) return prev;

      const trimmedText = spokenLanguageText.trim();
      if (!trimmedText) {
        return {
          ...prev,
          signedLanguagePose: null,
          signWriting: [],
          signedLanguageVideo: null,
        };
      }

      const actualSpokenLanguage = spokenLanguage || detectedLanguage;
      if (!actualSpokenLanguage) {
        console.warn("No spoken language available for translation");
        return prev;
      }

      // Set translation URL
      const poseUrl = translationService.translateSpokenToSigned(
        trimmedText,
        actualSpokenLanguage,
        signedLanguage
      );

      console.log("Generated pose URL:", poseUrl);
      console.log("Translation params:", {
        trimmedText,
        actualSpokenLanguage,
        signedLanguage,
      });

      return {
        ...prev,
        signedLanguagePose: poseUrl,
        signedLanguageVideo: null,
        translatedText: trimmedText, // Legacy support
        isTranslating: false,
      };
    });

    // TODO: Add SignWriting translation
    // const signWritingResult = await signWritingService.translateSpokenToSignWriting(
    //   trimmedText, spokenLanguageSentences, actualSpokenLanguage, signedLanguage
    // );
    // await setSignWritingText(signWritingResult.text.split(' '));
  }, [translationService]);

  // Language management
  const setSpokenLanguage = useCallback(
    async (language: string) => {
      setState((prev) => ({ ...prev, spokenLanguage: language }));

      // Detect language if not provided
      if (!language && state.spokenLanguageText) {
        await detectLanguage(state.spokenLanguageText);
      }

      // Trigger translation
      await changeTranslation();
    },
    [state.spokenLanguageText, detectLanguage, changeTranslation]
  );

  const setSignedLanguage = useCallback(
    async (language: string) => {
      setState((prev) => ({ ...prev, signedLanguage: language }));
      await changeTranslation();
    },
    [changeTranslation]
  );

  // Text management
  const setSpokenLanguageText = useCallback(
    async (text: string) => {
      console.log("setSpokenLanguageText called with:", text);
      const trimmedText = text.trim();

      // Update text state first
      setState((prev) => ({
        ...prev,
        spokenLanguageText: text,
        normalizedSpokenLanguageText: null,
        sourceText: text, // Legacy support
        isTranslating: trimmedText.length > 0,
      }));

      // Early return if not in spoken-to-signed mode
      const shouldProcess = await new Promise<boolean>((resolve) => {
        setState((prev) => {
          resolve(prev.spokenToSigned);
          return prev;
        });
      });

      if (!shouldProcess) return;

      // Detect language if not set and we have text
      if (trimmedText) {
        const currentSpokenLanguage = await new Promise<string | null>(
          (resolve) => {
            setState((prev) => {
              resolve(prev.spokenLanguage);
              return prev;
            });
          }
        );

        if (!currentSpokenLanguage) {
          await detectLanguage(trimmedText);
        }

        // Get updated state for language processing
        const updatedState = await new Promise<TranslationState>((resolve) => {
          setState((prev) => {
            resolve(prev);
            return prev;
          });
        });

        // Split into sentences
        const assumedLanguage =
          updatedState.spokenLanguage || updatedState.detectedLanguage || "en";
        const sentences = translationService.splitSpokenSentences(
          assumedLanguage,
          trimmedText
        );

        setState((prev) => ({ ...prev, spokenLanguageSentences: sentences }));
      }

      // Trigger translation
      await changeTranslation();
    },
    [translationService, changeTranslation, detectLanguage]
  );

  const suggestAlternativeText = useCallback(async () => {
    const {
      spokenToSigned,
      spokenLanguageText,
      spokenLanguage,
      detectedLanguage,
    } = state;
    const trimmedText = spokenLanguageText.trim();

    if (
      !spokenToSigned ||
      !trimmedText ||
      spokenLanguage !== detectedLanguage
    ) {
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }

    try {
      const normalizedText =
        await translationService.normalizeSpokenLanguageText(
          spokenLanguage,
          trimmedText
        );
      if (normalizedText !== trimmedText) {
        setState((prev) => ({
          ...prev,
          normalizedSpokenLanguageText: normalizedText,
        }));
      }
    } catch (error) {
      console.error("Text normalization failed:", error);
    }
  }, [state, translationService]);

  // SignWriting management
  const setSignWritingText = useCallback(async (text: string[]) => {
    try {
      // Load SignWriting fonts (would need to implement)
      // await SignWritingService.loadFonts();
      // await SignWritingService.cssLoaded();

      const signWriting = text.map((fsw) => ({ fsw }));
      setState((prev) => ({ ...prev, signWriting }));
    } catch (error) {
      console.error("SignWriting text setting failed:", error);
    }
  }, []);

  const describeSignWritingSign = useCallback(
    async (fsw: string) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return;
      }

      try {
        const description = await translationService.describeSignWriting(fsw);
        setState((prev) => ({
          ...prev,
          signWriting: prev.signWriting.map((s) =>
            s.fsw === fsw ? { ...s, description } : s
          ),
        }));
      } catch (error) {
        console.error("SignWriting description failed:", error);
      }
    },
    [translationService]
  );

  // Video and pose management
  const setSignedLanguageVideo = useCallback((url: string | null) => {
    setState((prev) => ({
      ...prev,
      signedLanguageVideo: url,
      videoUrl: url || "", // Legacy support
    }));
  }, []);

  const setSignedLanguagePose = useCallback((pose: string | null) => {
    setState((prev) => ({ ...prev, signedLanguagePose: pose }));
  }, []);

  const uploadPoseFile = useCallback(
    (url: string) => {
      if (state.spokenToSigned) {
        setState((prev) => ({
          ...prev,
          signedLanguagePose: url,
          signedLanguageVideo: null,
        }));
      }
    },
    [state.spokenToSigned]
  );

  // Handle pose file upload (from original project)
  const handlePoseFileUpload = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".pose")) {
        alert("Please select a .pose file");
        return;
      }

      const fileUrl = URL.createObjectURL(file);
      uploadPoseFile(fileUrl);
    },
    [uploadPoseFile]
  );

  // Actions
  const copySignedLanguageVideo = useCallback(async () => {
    if (!state.signedLanguageVideo) return;

    try {
      const response = await fetch(state.signedLanguageVideo);
      const blob = await response.blob();
      const item = new ClipboardItem({ [blob.type]: Promise.resolve(blob) });
      await navigator.clipboard.write([item]);
    } catch (error) {
      console.error("Copy video failed:", error);
      alert(`Copying video on this device is not supported`);
    }
  }, [state.signedLanguageVideo]);

  const copySpokenLanguageText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(state.spokenLanguageText);
    } catch (error) {
      console.error("Copy text failed:", error);
      alert("Copying text failed");
    }
  }, [state.spokenLanguageText]);

  const shareSignedLanguageVideo = useCallback(async () => {
    if (!state.signedLanguageVideo) return;

    try {
      const response = await fetch(state.signedLanguageVideo);
      const blob = await response.blob();
      const ext = blob.type.split("/").pop();
      const file = new File([blob], `video.${ext}`, { type: blob.type });

      if (
        "share" in navigator &&
        "canShare" in navigator &&
        (
          navigator as { canShare: (data: { files: File[] }) => boolean }
        ).canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file] } as ShareData);
      } else {
        const url = window.location.href;
        const title = "Signed Language Video";
        await navigator.share({ text: title, title, url });
      }
    } catch (error) {
      console.error("Share video failed:", error);
      alert("Share functionality is not available");
    }
  }, [state.signedLanguageVideo]);

  const downloadSignedLanguageVideo = useCallback(async () => {
    if (!state.signedLanguageVideo) return;

    try {
      let filename = encodeURIComponent(state.spokenLanguageText).replace(
        /%20/g,
        "-"
      );
      filename = filename.slice(0, 250); // Limit filename length

      const a = document.createElement("a");
      a.href = state.signedLanguageVideo;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download video failed:", error);
      alert("Downloading video on this device is not supported");
    }
  }, [state.signedLanguageVideo, state.spokenLanguageText]);

  // Status management
  const setIsTranslating = useCallback((isTranslating: boolean) => {
    setState((prev) => ({ ...prev, isTranslating }));
  }, []);

  const setIsSigning = useCallback((isSigning: boolean) => {
    setState((prev) => ({ ...prev, isSigning }));
  }, []);

  const setSigningProbability = useCallback((probability: number) => {
    setState((prev) => ({ ...prev, signingProbability: probability }));
  }, []);

  const setPose = useCallback((pose: Pose | null) => {
    setState((prev) => ({ ...prev, pose }));
  }, []);

  // Legacy support
  const setSourceText = useCallback(
    (text: string) => {
      setSpokenLanguageText(text);
    },
    [setSpokenLanguageText]
  );

  const setTranslatedText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, translatedText: text }));
  }, []);

  const setSourceLanguage = useCallback(
    (language: string) => {
      setSpokenLanguage(language);
    },
    [setSpokenLanguage]
  );

  const setTargetLanguage = useCallback(
    (language: string) => {
      setSignedLanguage(language);
    },
    [setSignedLanguage]
  );

  const setVideoUrl = useCallback(
    (url: string) => {
      setSignedLanguageVideo(url);
    },
    [setSignedLanguageVideo]
  );

  const resetTranslation = useCallback(() => {
    setState(defaultState);
  }, []);

  return (
    <TranslationContext.Provider
      value={{
        state,
        translationService,
        languageDetectionService,

        // Core actions
        setInputMode,
        flipTranslationDirection,

        // Language management
        setSpokenLanguage,
        setSignedLanguage,
        detectLanguage,

        // Text management
        setSpokenLanguageText,
        suggestAlternativeText,

        // SignWriting management
        setSignWritingText,
        describeSignWritingSign,

        // Video and pose management
        setSignedLanguageVideo,
        setSignedLanguagePose,
        uploadPoseFile,
        handlePoseFileUpload,

        // Actions
        copySignedLanguageVideo,
        copySpokenLanguageText,
        shareSignedLanguageVideo,
        downloadSignedLanguageVideo,

        // Translation
        changeTranslation,

        // Status management
        setIsTranslating,
        setIsSigning,
        setSigningProbability,
        setPose,

        // Legacy support
        setSourceText,
        setTranslatedText,
        setSourceLanguage,
        setTargetLanguage,
        setVideoUrl,
        resetTranslation,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}
