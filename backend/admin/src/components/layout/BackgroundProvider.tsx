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
      // If it looks like a URL (starts with http or data:image), apply as background-image
      if (backgroundStr.startsWith("http") || backgroundStr.startsWith("data:image")) {
        document.body.style.backgroundImage = `url('${backgroundStr}')`;
        document.body.style.backgroundColor = "";
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundAttachment = "fixed";
      } else {
        // Otherwise treat as color
        document.body.style.backgroundColor = backgroundStr;
        document.body.style.backgroundImage = "none";
      }
    } else {
       document.body.style.backgroundColor = "";
       document.body.style.backgroundImage = "none";
    }
  }, [backgroundStr]);

  return <>{children}</>;
}
