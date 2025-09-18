"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface Settings {
	receiveVideo: boolean;
	detectSign: boolean;
	drawSignWriting: boolean;
	drawPose: boolean;
	poseViewer: "pose" | "avatar";
	language: string;
	signedLanguage: string;
	spokenLanguage: string;
}

interface SettingsContextType {
	settings: Settings;
	updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
	updateSettings: (updates: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
	receiveVideo: true,
	detectSign: false,
	drawSignWriting: false,
	drawPose: true,
	poseViewer: "pose",
	language: "en",
	signedLanguage: "ase",
	spokenLanguage: "en",
};

const SettingsContext = createContext<SettingsContextType | undefined>(
	undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
	const [settings, setSettings] = useState<Settings>(defaultSettings);

	useEffect(() => {
		const stored = localStorage.getItem("settings");
		if (stored) {
			try {
				const parsedSettings = JSON.parse(stored);
				setSettings({ ...defaultSettings, ...parsedSettings });
			} catch (error) {
				console.error("Failed to parse stored settings:", error);
			}
		}
	}, []);

	useEffect(() => {
		localStorage.setItem("settings", JSON.stringify(settings));
	}, [settings]);

	const updateSetting = <K extends keyof Settings>(
		key: K,
		value: Settings[K]
	) => {
		setSettings((prev) => ({ ...prev, [key]: value }));
	};

	const updateSettings = (updates: Partial<Settings>) => {
		setSettings((prev) => ({ ...prev, ...updates }));
	};

	return (
		<SettingsContext.Provider
			value={{ settings, updateSetting, updateSettings }}>
			{children}
		</SettingsContext.Provider>
	);
}

export function useSettings() {
	const context = useContext(SettingsContext);
	if (context === undefined) {
		throw new Error("useSettings must be used within a SettingsProvider");
	}
	return context;
}

