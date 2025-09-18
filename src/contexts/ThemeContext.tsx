"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setTheme] = useState<Theme>("system");
	const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

	useEffect(() => {
		const stored = localStorage.getItem("theme") as Theme;
		if (stored) {
			setTheme(stored);
		}
	}, []);

	useEffect(() => {
		const root = window.document.documentElement;

		if (theme === "system") {
			const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
				.matches
				? "dark"
				: "light";
			setResolvedTheme(systemTheme);
			root.classList.remove("light", "dark");
			root.classList.add(systemTheme);
		} else {
			setResolvedTheme(theme);
			root.classList.remove("light", "dark");
			root.classList.add(theme);
		}
	}, [theme]);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = () => {
			if (theme === "system") {
				const systemTheme = mediaQuery.matches ? "dark" : "light";
				setResolvedTheme(systemTheme);
				document.documentElement.classList.remove("light", "dark");
				document.documentElement.classList.add(systemTheme);
			}
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, [theme]);

	const handleSetTheme = (newTheme: Theme) => {
		setTheme(newTheme);
		localStorage.setItem("theme", newTheme);
	};

	return (
		<ThemeContext.Provider
			value={{ theme, setTheme: handleSetTheme, resolvedTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}

