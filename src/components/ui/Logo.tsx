"use client";

import { useTheme } from "@/contexts/ThemeContext";
import Image from "next/image";

export default function Logo() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
        <Image
          src="/assets/SignGPT_improve.png"
          alt="SignGPT"
          width={24}
          height={24}
          className="rounded-sm"
        />
      </div>
      <span className="text-xl font-bold">SignGPT</span>
    </div>
  );
}
