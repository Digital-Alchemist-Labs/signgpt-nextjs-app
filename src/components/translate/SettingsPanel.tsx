"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { Settings, X } from "lucide-react";

export default function SettingsPanel() {
	const { t } = useTranslation();
	const { settings, updateSetting } = useSettings();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				className="p-2 rounded-md hover:bg-accent transition-colors"
				title="Settings">
				<Settings className="h-5 w-5" />
			</button>

			{isOpen && (
				<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
					<div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
						<div className="flex items-center justify-between p-4 border-b">
							<h2 className="text-lg font-semibold">Settings</h2>
							<button
								onClick={() => setIsOpen(false)}
								className="p-1 rounded-md hover:bg-accent transition-colors">
								<X className="h-5 w-5" />
							</button>
						</div>

						<div className="p-4 space-y-6">
							{/* Video Settings */}
							<div className="space-y-4">
								<h3 className="text-sm font-medium">Video Settings</h3>

								<div className="space-y-3">
									<label className="flex items-center justify-between">
										<span className="text-sm">Receive Video</span>
										<input
											type="checkbox"
											checked={settings.receiveVideo}
											onChange={(e) =>
												updateSetting("receiveVideo", e.target.checked)
											}
											className="rounded border-input"
										/>
									</label>

									<label className="flex items-center justify-between">
										<span className="text-sm">Detect Sign Language</span>
										<input
											type="checkbox"
											checked={settings.detectSign}
											onChange={(e) =>
												updateSetting("detectSign", e.target.checked)
											}
											className="rounded border-input"
										/>
									</label>

									<label className="flex items-center justify-between">
										<span className="text-sm">Draw Sign Writing</span>
										<input
											type="checkbox"
											checked={settings.drawSignWriting}
											onChange={(e) =>
												updateSetting("drawSignWriting", e.target.checked)
											}
											className="rounded border-input"
										/>
									</label>

									<label className="flex items-center justify-between">
										<span className="text-sm">Draw Pose</span>
										<input
											type="checkbox"
											checked={settings.drawPose}
											onChange={(e) =>
												updateSetting("drawPose", e.target.checked)
											}
											className="rounded border-input"
										/>
									</label>
								</div>
							</div>

							{/* Pose Viewer Settings */}
							<div className="space-y-4">
								<h3 className="text-sm font-medium">Pose Viewer</h3>

								<div className="space-y-2">
									<label className="text-sm">Viewer Type</label>
									<select
										value={settings.poseViewer}
										onChange={(e) =>
											updateSetting(
												"poseViewer",
												e.target.value as "pose" | "avatar"
											)
										}
										className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
										<option value="pose">Pose</option>
										<option value="avatar">Avatar</option>
									</select>
								</div>
							</div>

							{/* Language Settings */}
							<div className="space-y-4">
								<h3 className="text-sm font-medium">Language Settings</h3>

								<div className="space-y-2">
									<label className="text-sm">Interface Language</label>
									<select
										value={settings.language}
										onChange={(e) => updateSetting("language", e.target.value)}
										className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
										<option value="en">English</option>
										<option value="de">Deutsch</option>
										<option value="fr">Français</option>
										<option value="es">Español</option>
										<option value="it">Italiano</option>
										<option value="pt">Português</option>
										<option value="ru">Русский</option>
										<option value="zh">中文</option>
										<option value="ja">日本語</option>
										<option value="ko">한국어</option>
										<option value="ar">العربية</option>
										<option value="hi">हिन्दी</option>
									</select>
								</div>
							</div>
						</div>

						<div className="p-4 border-t">
							<button
								onClick={() => setIsOpen(false)}
								className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

