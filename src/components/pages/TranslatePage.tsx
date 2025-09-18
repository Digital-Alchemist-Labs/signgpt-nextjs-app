"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation as useTranslationState } from "@/contexts/TranslationContext";
import { useTheme } from "@/contexts/ThemeContext";
import TranslateDesktop from "./translate/TranslateDesktop";
import TranslateMobile from "./translate/TranslateMobile";

export default function TranslatePage() {
	const { t } = useTranslation();
	const { settings } = useSettings();
	const { state, setIsTranslating } = useTranslationState();
	const { resolvedTheme } = useTheme();
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	useEffect(() => {
		// Update document title and meta description
		document.title = t("translate.title");

		const metaDescription = document.querySelector('meta[name="description"]');
		if (metaDescription) {
			metaDescription.setAttribute("content", t("translate.description"));
		}

		// Set default settings
		if (!settings.receiveVideo) {
			// Initialize default settings if needed
		}
	}, [t, settings]);

	useEffect(() => {
		// Handle video autoplay
		const handleUserInteraction = () => {
			const videos = document.querySelectorAll("video[autoplay]");
			videos.forEach(async (video) => {
				const videoElement = video as HTMLVideoElement;
				if (videoElement.paused) {
					try {
						await videoElement.play();
					} catch (error) {
						console.error("Failed to autoplay video:", error);
					}
				}
			});
		};

		// Add event listeners for user interaction
		document.addEventListener("click", handleUserInteraction);
		document.addEventListener("touchstart", handleUserInteraction);

		return () => {
			document.removeEventListener("click", handleUserInteraction);
			document.removeEventListener("touchstart", handleUserInteraction);
		};
	}, []);

	return (
		<div className="flex-1 flex flex-col">
			{isMobile ? <TranslateMobile /> : <TranslateDesktop />}
		</div>
	);
}
