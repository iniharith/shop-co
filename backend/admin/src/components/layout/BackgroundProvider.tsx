/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

export default function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [backgroundStr, setBackgroundStr] = useState<string | null>(null);
  const [fontColor, setFontColor] = useState<string | null>(null);
  const [buttonColor, setButtonColor] = useState<string | null>(null);
  const [pointColor, setPointColor] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      setBackgroundStr(localStorage.getItem(`theme-bg-${session.user.id}`));
      setFontColor(localStorage.getItem(`theme-font-${session.user.id}`));
      setButtonColor(localStorage.getItem(`theme-button-${session.user.id}`));
      setPointColor(localStorage.getItem(`theme-point-${session.user.id}`));
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (session?.user?.id) {
        if (e.key === `theme-bg-${session.user.id}`) setBackgroundStr(e.newValue);
        if (e.key === `theme-font-${session.user.id}`) setFontColor(e.newValue);
        if (e.key === `theme-button-${session.user.id}`) setButtonColor(e.newValue);
        if (e.key === `theme-point-${session.user.id}`) setPointColor(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    
    const handleBgChange = (e: CustomEvent) => setBackgroundStr(e.detail);
    const handleFontChange = (e: CustomEvent) => setFontColor(e.detail);
    const handleButtonChange = (e: CustomEvent) => setButtonColor(e.detail);
    const handlePointChange = (e: CustomEvent) => setPointColor(e.detail);
    
    window.addEventListener("theme-bg-changed", handleBgChange as EventListener);
    window.addEventListener("theme-font-changed", handleFontChange as EventListener);
    window.addEventListener("theme-button-changed", handleButtonChange as EventListener);
    window.addEventListener("theme-point-changed", handlePointChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("theme-bg-changed", handleBgChange as EventListener);
      window.removeEventListener("theme-font-changed", handleFontChange as EventListener);
      window.removeEventListener("theme-button-changed", handleButtonChange as EventListener);
      window.removeEventListener("theme-point-changed", handlePointChange as EventListener);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (backgroundStr) {
      document.body.classList.add("has-custom-bg");
    } else {
      document.body.classList.remove("has-custom-bg");
    }
  }, [backgroundStr]);

  const hexToHSL = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
  };

  const isImage = backgroundStr?.startsWith("http") || backgroundStr?.startsWith("data:image");

  return (
    <>
      <style suppressHydrationWarning>
        {`
          :root {
            ${fontColor ? `--foreground: ${hexToHSL(fontColor)};` : ''}
            ${buttonColor ? `--primary: ${hexToHSL(buttonColor)};` : ''}
            ${pointColor ? `--accent: ${hexToHSL(pointColor)}; --ring: ${hexToHSL(pointColor)};` : ''}
          }
          .dark {
            ${fontColor ? `--foreground: ${hexToHSL(fontColor)};` : ''}
            ${buttonColor ? `--primary: ${hexToHSL(buttonColor)};` : ''}
            ${pointColor ? `--accent: ${hexToHSL(pointColor)}; --ring: ${hexToHSL(pointColor)};` : ''}
          }
        `}
      </style>
      {backgroundStr && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: -50,
            pointerEvents: "none",
            backgroundColor: isImage ? "transparent" : backgroundStr,
            backgroundImage: isImage ? `url('${backgroundStr}')` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: isImage ? 0.5 : 1,
          }}
        />
      )}
      {children}
    </>
  );
}
