import type { Metadata, Viewport } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const roboto = Roboto({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  title: "SignGPT",
  description:
    "AI-Powered Sign Language Translation with Cutting-Edge Real-Time Models. Translate Sign Language instantly with advanced AI technology on desktop and mobile.",
  keywords:
    "SignGPT, AI sign language, sign language translation, sign language interpreter, sign language dictionary, sign language translator, sign language app, AI translation",
  authors: [{ name: "Amit Moryossef" }],
  referrer: "origin",
  robots: "index, follow",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "SignGPT",
    description:
      "AI-Powered Sign Language Translation with Cutting-Edge Real-Time Models",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SignGPT",
    description:
      "AI-Powered Sign Language Translation with Cutting-Edge Real-Time Models",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${roboto.variable}`}>
      <head>
        <meta name="google" content="notranslate" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="SignGPT" />
        <meta name="apple-mobile-web-app-title" content="SignGPT" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link
          rel="search"
          title="SignGPT"
          type="application/opensearchdescription+xml"
          href="/opensearch.xml"
        />
      </head>
      <body className={`${inter.variable} ${roboto.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
