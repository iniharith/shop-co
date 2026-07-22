"use client";

import { Languages } from "lucide-react";
import { Button } from "@heroui/button";
import { useLanguage } from "@/i18n/LanguageProvider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();
  const nextLocale = locale === "en" ? "ms" : "en";

  return (
    <Button
      variant="ghost"
      className="h-9 min-w-0 gap-1 rounded-full px-2 text-xs font-bold text-foreground"
      aria-label={
        nextLocale === "ms"
          ? t("language.switchToMalay")
          : t("language.switchToEnglish")
      }
      onPress={() => setLocale(nextLocale)}
    >
      <Languages size={16} aria-hidden="true" />
      {nextLocale === "ms" ? "BM" : "EN"}
    </Button>
  );
}
