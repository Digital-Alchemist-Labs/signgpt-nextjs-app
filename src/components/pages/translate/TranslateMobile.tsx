"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation as useTranslationState } from "@/contexts/TranslationContext";
import VideoCapture from "@/components/translate/VideoCapture";
import TextInput from "@/components/translate/TextInput";
import LanguageSelector from "@/components/translate/LanguageSelector";
import TranslationOutput from "@/components/translate/TranslationOutput";
import SettingsPanel from "@/components/translate/SettingsPanel";

export default function TranslateMobile() {
	const { t } = useTranslation();
	const { settings } = useSettings();
	const { state, setInputMode, setSourceText, setTranslatedText } =
		useTranslationState();
	const [isLoading, setIsLoading] = useState(false);
	const [activeTab, setActiveTab] = useState<"input" | "output">("input");

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
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setTranslatedText(`Translated: ${text}`);
			setActiveTab("output");
		} catch (error) {
			console.error("Translation failed:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex-1 flex flex-col">
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b">
				<h1 className="text-lg font-semibold">{t("translate.title")}</h1>
				<SettingsPanel />
			</div>

			{/* Tab Navigation */}
			<div className="flex border-b">
				<button
					onClick={() => setActiveTab("input")}
					className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
						activeTab === "input"
							? "text-primary border-b-2 border-primary"
							: "text-muted-foreground hover:text-foreground"
					}`}>
					Input
				</button>
				<button
					onClick={() => setActiveTab("output")}
					className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
						activeTab === "output"
							? "text-primary border-b-2 border-primary"
							: "text-muted-foreground hover:text-foreground"
					}`}>
					Output
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 p-4">
				{activeTab === "input" ? (
					<div className="space-y-4">
						{/* Input Mode Selector */}
						<div className="flex space-x-2">
							<button
								onClick={() => handleInputModeChange("webcam")}
								className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
									state.inputMode === "webcam"
										? "bg-primary text-primary-foreground"
										: "bg-secondary text-secondary-foreground"
								}`}>
								Camera
							</button>
							<button
								onClick={() => handleInputModeChange("upload")}
								className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
									state.inputMode === "upload"
										? "bg-primary text-primary-foreground"
										: "bg-secondary text-secondary-foreground"
								}`}>
								Upload
							</button>
							<button
								onClick={() => handleInputModeChange("text")}
								className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
									state.inputMode === "text"
										? "bg-primary text-primary-foreground"
										: "bg-secondary text-secondary-foreground"
								}`}>
								Text
							</button>
						</div>

						{/* Input Area */}
						<div className="flex-1 min-h-[300px]">
							{state.inputMode === "webcam" && <VideoCapture />}
							{state.inputMode === "upload" && (
								<div className="flex-1 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
									<div className="text-center">
										<p className="text-muted-foreground">Upload video file</p>
										<p className="text-sm text-muted-foreground mt-2">
											Tap to select
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
				) : (
					<TranslationOutput
						text={state.translatedText}
						isLoading={isLoading}
					/>
				)}
			</div>
		</div>
	);
}

