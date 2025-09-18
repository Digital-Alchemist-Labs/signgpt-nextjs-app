import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

export const metadata: Metadata = {
	title: "Sign Translate",
	description:
		"Effortless Sign Language Translation with Cutting-Edge Real-Time Models. Translate Sign Language instantly on desktop and mobile.",
	keywords:
		"sign language, sign language translation, sign language interpreter, sign language dictionary, sign language translator, sign language app",
		
	authors: [{ name: "Amit Moryossef" }],
	referrer: "origin",
	robots: "index, follow",
	viewport: "viewport-fit=cover, width=device-width, initial-scale=1",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#000000" },
	],
	manifest: "/manifest.json",
	icons: {
		icon: "/favicon.ico",
		apple: "/apple-touch-icon.png",
	},
	openGraph: {
		title: "Sign Translate",
		description:
			"Effortless Sign Language Translation with Cutting-Edge Real-Time Models",
		type: "website",
		locale: "en_US",
	},
	twitter: {
		card: "summary_large_image",
		title: "Sign Translate",
		description:
			"Effortless Sign Language Translation with Cutting-Edge Real-Time Models",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={inter.variable}>
			<head>
				<meta name="google" content="notranslate" />
				<meta name="format-detection" content="telephone=no" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="application-name" content="Sign Translate" />
				<meta name="apple-mobile-web-app-title" content="Sign Translate" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<link
					rel="search"
					title="Sign Translate"
					type="application/opensearchdescription+xml"
					href="/opensearch.xml"
				/>
				<link
					rel="preload"
					as="font"
					href="/assets/fonts/roboto/Roboto-normal-400.ttf"
					crossOrigin="anonymous"
				/>
				<link
					rel="preload"
					as="font"
					href="/assets/fonts/roboto/Roboto-normal-500.ttf"
					crossOrigin="anonymous"
				/>
				<link rel="preload" as="image" href="/assets/flags/1x1/us.svg" />
			</head>
			<body className={`${inter.variable} antialiased`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
