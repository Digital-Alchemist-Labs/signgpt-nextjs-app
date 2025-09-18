"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
	const { theme, setTheme, resolvedTheme } = useTheme();

	const themes = [
		{ value: "light", label: "Light", icon: Sun },
		{ value: "dark", label: "Dark", icon: Moon },
		{ value: "system", label: "System", icon: Monitor },
	] as const;

	const currentTheme = themes.find((t) => t.value === theme) || themes[2];
	const Icon = currentTheme.icon;

	const handleThemeChange = () => {
		const currentIndex = themes.findIndex((t) => t.value === theme);
		const nextIndex = (currentIndex + 1) % themes.length;
		setTheme(themes[nextIndex].value);
	};

	return (
		<button
			onClick={handleThemeChange}
			className="p-2 rounded-md hover:bg-accent transition-colors"
			title={`Current theme: ${currentTheme.label}`}>
			<Icon className="h-5 w-5" />
		</button>
	);
}

