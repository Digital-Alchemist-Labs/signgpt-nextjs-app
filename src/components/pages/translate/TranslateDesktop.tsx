"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation as useTranslationState } from "@/contexts/TranslationContext";
import VideoCapture from "@/components/translate/VideoCapture";
import TextInput from "@/components/translate/TextInput";
import LanguageSelector from "@/components/translate/LanguageSelector";
import TranslationOutput from "@/components/translate/TranslationOutput";
import SettingsPanel from "@/components/translate/SettingsPanel";

export default function TranslateDesktop() {
	const { t } = useTranslation();
	const { settings, updateSetting } = useSettings();
	const { state, setInputMode, setSourceText, setTranslatedText } =
		useTranslationState();
	const [isLoading, setIsLoading] = useState(false);

	const handleInputModeChange = (mode: "webcam" | "upload" | "text") => {
		setInputMode(mode);
	};

	const handleSourceTextChange = (text: string) => {
		setSourceText(text);
	};

	const handleTranslation = async (text: string) => {
		setIsLoading(true);
		try {
			// TODO: Implement actual translation logic
			// This is a placeholder
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setTranslatedText(`Translated: ${text}`);
		} catch (error) {
			console.error("Translation failed:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex-1 flex flex-col lg:flex-row gap-6 p-6">
			{/* Left Panel - Input */}
			<div className="flex-1 flex flex-col space-y-6">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold">{t("translate.title")}</h1>
					<SettingsPanel />
				</div>

				{/* Input Mode Selector */}
				<div className="flex space-x-2">
					<button
						onClick={() => handleInputModeChange("webcam")}
						className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
							state.inputMode === "webcam"
								? "bg-primary text-primary-foreground"
								: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
						}`}>
						Camera
					</button>
					<button
						onClick={() => handleInputModeChange("upload")}
						className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
							state.inputMode === "upload"
								? "bg-primary text-primary-foreground"
								: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
						}`}>
						Upload
					</button>
					<button
						onClick={() => handleInputModeChange("text")}
						className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
							state.inputMode === "text"
								? "bg-primary text-primary-foreground"
								: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
						}`}>
						Text
					</button>
				</div>

				{/* Input Area */}
				<div className="flex-1">
					{state.inputMode === "webcam" && <VideoCapture />}
					{state.inputMode === "upload" && (
						<div className="flex-1 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
							<div className="text-center">
								<p className="text-muted-foreground">Upload video file</p>
								<p className="text-sm text-muted-foreground mt-2">
									Drag and drop or click to select
								</p>
							</div>
						</div>
					)}
					{state.inputMode === "text" && (
						<TextInput
							value={state.sourceText}
							onChange={handleSourceTextChange}
							onTranslate={handleTranslation}
							isLoading={isLoading}
						/>
					)}
				</div>

				{/* Language Selector */}
				<LanguageSelector />
			</div>

			{/* Right Panel - Output */}
			<div className="flex-1 flex flex-col space-y-6">
				<h2 className="text-xl font-semibold">Translation</h2>
				<TranslationOutput text={state.translatedText} isLoading={isLoading} />
			</div>
		</div>
	);
}

