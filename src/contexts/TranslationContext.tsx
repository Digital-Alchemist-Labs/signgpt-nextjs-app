"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface Pose {
	landmarks: Array<{ x: number; y: number; z: number; visibility: number }>;
	timestamp: number;
}

export interface SignWriting {
	symbols: string[];
	text: string;
}

export interface TranslationState {
	inputMode: "webcam" | "upload" | "text";
	isTranslating: boolean;
	sourceText: string;
	translatedText: string;
	sourceLanguage: string;
	targetLanguage: string;
	isSigning: boolean;
	signingProbability: number;
	pose: Pose | null;
	signWriting: SignWriting | null;
	videoUrl: string;
	signedLanguageVideo: string;
}

interface TranslationContextType {
	state: TranslationState;
	setInputMode: (mode: "webcam" | "upload" | "text") => void;
	setSourceText: (text: string) => void;
	setTranslatedText: (text: string) => void;
	setSourceLanguage: (language: string) => void;
	setTargetLanguage: (language: string) => void;
	setIsTranslating: (isTranslating: boolean) => void;
	setIsSigning: (isSigning: boolean) => void;
	setSigningProbability: (probability: number) => void;
	setPose: (pose: Pose | null) => void;
	setSignWriting: (signWriting: SignWriting | null) => void;
	setVideoUrl: (url: string) => void;
	setSignedLanguageVideo: (url: string) => void;
	resetTranslation: () => void;
}

const defaultState: TranslationState = {
	inputMode: "webcam",
	isTranslating: false,
	sourceText: "",
	translatedText: "",
	sourceLanguage: "en",
	targetLanguage: "ase",
	isSigning: false,
	signingProbability: 0,
	pose: null,
	signWriting: null,
	videoUrl: "",
	signedLanguageVideo: "",
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

	const setInputMode = useCallback((mode: "webcam" | "upload" | "text") => {
		setState((prev) => ({ ...prev, inputMode: mode }));
	}, []);

	const setSourceText = useCallback((text: string) => {
		setState((prev) => ({ ...prev, sourceText: text }));
	}, []);

	const setTranslatedText = useCallback((text: string) => {
		setState((prev) => ({ ...prev, translatedText: text }));
	}, []);

	const setSourceLanguage = useCallback((language: string) => {
		setState((prev) => ({ ...prev, sourceLanguage: language }));
	}, []);

	const setTargetLanguage = useCallback((language: string) => {
		setState((prev) => ({ ...prev, targetLanguage: language }));
	}, []);

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

	const setSignWriting = useCallback((signWriting: SignWriting | null) => {
		setState((prev) => ({ ...prev, signWriting }));
	}, []);

	const setVideoUrl = useCallback((url: string) => {
		setState((prev) => ({ ...prev, videoUrl: url }));
	}, []);

	const setSignedLanguageVideo = useCallback((url: string) => {
		setState((prev) => ({ ...prev, signedLanguageVideo: url }));
	}, []);

	const resetTranslation = useCallback(() => {
		setState(defaultState);
	}, []);

	return (
		<TranslationContext.Provider
			value={{
				state,
				setInputMode,
				setSourceText,
				setTranslatedText,
				setSourceLanguage,
				setTargetLanguage,
				setIsTranslating,
				setIsSigning,
				setSigningProbability,
				setPose,
				setSignWriting,
				setVideoUrl,
				setSignedLanguageVideo,
				resetTranslation,
			}}>
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
