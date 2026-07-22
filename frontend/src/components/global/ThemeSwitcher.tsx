/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import { Button } from "@heroui/button";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button isIconOnly variant="ghost" className="rounded-full w-9 h-9 opacity-0">
        <FiSun size={18} />
      </Button>
    );
  }

  return (
    <Button
      isIconOnly
      variant="ghost"
      className="rounded-full w-9 h-9"
      aria-label={resolvedTheme === "dark" ? "Use light theme" : "Use dark theme"}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? (
        <FiSun size={18} className="text-yellow-400" />
      ) : (
        <FiMoon size={18} className="text-foreground" />
      )}
    </Button>
  );
}
