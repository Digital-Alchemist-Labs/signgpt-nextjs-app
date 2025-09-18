"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, Loader2 } from "lucide-react";

interface TextInputProps {
	value: string;
	onChange: (value: string) => void;
	onTranslate: (text: string) => void;
	isLoading: boolean;
}

export default function TextInput({
	value,
	onChange,
	onTranslate,
	isLoading,
}: TextInputProps) {
	const { t } = useTranslation();
	const [localValue, setLocalValue] = useState(value);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (localValue.trim() && !isLoading) {
			onChange(localValue);
			onTranslate(localValue);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			handleSubmit(e);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<label htmlFor="text-input" className="text-sm font-medium">
					Enter text to translate
				</label>
				<textarea
					id="text-input"
					value={localValue}
					onChange={(e) => setLocalValue(e.target.value)}
					onKeyDown={handleKeyPress}
					placeholder="Type your message here..."
					className="w-full min-h-[120px] px-3 py-2 border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
					disabled={isLoading}
				/>
			</div>

			<div className="flex justify-between items-center">
				<p className="text-xs text-muted-foreground">
					Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to translate
				</p>

				<button
					type="submit"
					disabled={!localValue.trim() || isLoading}
					className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
					{isLoading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Send className="h-4 w-4" />
					)}
					<span>{isLoading ? "Translating..." : "Translate"}</span>
				</button>
			</div>
		</form>
	);
}

