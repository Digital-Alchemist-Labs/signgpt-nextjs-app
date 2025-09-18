"use client";

import { useTheme } from "@/contexts/ThemeContext";

export default function Logo() {
	const { resolvedTheme } = useTheme();

	return (
		<div className="flex items-center space-x-2">
			<div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
				<span className="text-primary-foreground font-bold text-lg">S</span>
			</div>
			<span className="text-xl font-bold">Sign Translate</span>
		</div>
	);
}

