"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import Header from "./Header";
import TabBar from "./TabBar";

interface MainLayoutProps {
	children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
	const router = useRouter();
	const { t } = useTranslation();
	const { settings } = useSettings();
	const { resolvedTheme } = useTheme();
	const [isMainPage, setIsMainPage] = useState(true);

	useEffect(() => {
		const handleRouteChange = () => {
			setIsMainPage(window.location.pathname === "/");
		};

		handleRouteChange();
		window.addEventListener("popstate", handleRouteChange);
		return () => window.removeEventListener("popstate", handleRouteChange);
	}, []);

	useEffect(() => {
		// Update document title
		document.title = t("translate.title");

		// Update meta description
		const metaDescription = document.querySelector('meta[name="description"]');
		if (metaDescription) {
			metaDescription.setAttribute("content", t("translate.description"));
		}
	}, [t]);

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Header />
			<main className="flex-1">{children}</main>
			{isMainPage && <TabBar />}
		</div>
	);
}

