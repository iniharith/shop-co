"use client";
import { Languages } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const nextLocale = locale === "en" ? "ms" : "en";
  const label = locale === "en" ? "BM" : "EN";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(nextLocale)}
      className="h-8 gap-1 rounded-full px-2 text-xs font-bold"
      title={locale === "en" ? "Tukar ke Bahasa Melayu" : "Switch to English"}
    >
      <Languages size={14} />
      {label}
    </Button>
  );
}
