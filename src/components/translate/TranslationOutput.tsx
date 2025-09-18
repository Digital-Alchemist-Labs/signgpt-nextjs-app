"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Download, Loader2, Check } from "lucide-react";

interface TranslationOutputProps {
	text: string;
	isLoading: boolean;
}

export default function TranslationOutput({
	text,
	isLoading,
}: TranslationOutputProps) {
	const { t } = useTranslation();
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error("Failed to copy text:", error);
		}
	};

	const handleDownload = () => {
		const blob = new Blob([text], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "translation.txt";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">Translation Result</h3>
				{text && (
					<div className="flex space-x-2">
						<button
							onClick={handleCopy}
							className="flex items-center space-x-1 px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
							{copied ? (
								<Check className="h-4 w-4" />
							) : (
								<Copy className="h-4 w-4" />
							)}
							<span>{copied ? "Copied!" : "Copy"}</span>
						</button>
						<button
							onClick={handleDownload}
							className="flex items-center space-x-1 px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
							<Download className="h-4 w-4" />
							<span>Download</span>
						</button>
					</div>
				)}
			</div>

			<div className="min-h-[200px] p-4 border border-input bg-background rounded-md">
				{isLoading ? (
					<div className="flex items-center justify-center h-full">
						<div className="text-center">
							<Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
							<p className="text-muted-foreground">Translating...</p>
						</div>
					</div>
				) : text ? (
					<div className="whitespace-pre-wrap text-foreground">{text}</div>
				) : (
					<div className="flex items-center justify-center h-full text-muted-foreground">
						<p>Translation will appear here</p>
					</div>
				)}
			</div>

			{/* Video Output Placeholder */}
			{text && (
				<div className="space-y-2">
					<h4 className="text-sm font-medium">Sign Language Video</h4>
					<div className="aspect-video bg-muted rounded-md flex items-center justify-center">
						<p className="text-muted-foreground">
							Video output will appear here
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

