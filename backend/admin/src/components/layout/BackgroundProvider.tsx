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

  useEffect(() => {
    if (session?.user?.id) {
      const stored = localStorage.getItem(`theme-bg-${session.user.id}`);
      if (stored) {
        setBackgroundStr(stored);
      } else {
        setBackgroundStr(null);
      }
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (session?.user?.id && e.key === `theme-bg-${session.user.id}`) {
        setBackgroundStr(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    
    const handleCustomChange = (e: CustomEvent) => {
        setBackgroundStr(e.detail);
    }
    window.addEventListener("theme-bg-changed", handleCustomChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("theme-bg-changed", handleCustomChange as EventListener);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (backgroundStr) {
      document.body.classList.add("has-custom-bg");
    } else {
      document.body.classList.remove("has-custom-bg");
    }
  }, [backgroundStr]);

  const isImage = backgroundStr?.startsWith("http") || backgroundStr?.startsWith("data:image");

  return (
    <>
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
            opacity: isImage ? 0.5 : 1, // 50% opacity for images, full for colors
          }}
        />
      )}
      {children}
    </>
  );
}
