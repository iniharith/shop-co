/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "@heroui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageProvider";

const Cta = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  const handleSubmit = () => {
    if (!consent) {
      toast.error(t("cta.consentRequired"));
      return;
    }
    setEmail("");
    setConsent(false);
    toast.success(t("cta.success"), {
      description: t("cta.successDescription"),
    });
  };
  return (
    <section className="grid w-full place-items-center bg-background px-4 py-16 sm:px-8 sm:py-20">
      <div className="grid w-full max-w-[1480px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#101820] px-6 py-9 shadow-[0_28px_80px_-52px_rgba(0,0,0,0.9)] md:grid-cols-2 md:px-12 md:py-12">
        <div className="flex max-w-lg flex-col justify-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Kampung Cetak updates</p>
          <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
            {t("cta.title")}
          </h2>
        </div>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 md:mt-0">
          <Input
            value={email}
            onChange={handleChange}
            type="text"
            placeholder={t("cta.placeholder")}
            className="w-full bg-white text-black placeholder:text-gray-500 md:text-base text-sm p-2 rounded-md"
          />
          <label className="flex items-start gap-2 text-xs text-white/80 w-full cursor-pointer select-none">
            <Checkbox
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked === true)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5"
            />
            <span className="leading-snug">
              {t("cta.consent")}
              <Link href="/privacy" className="text-white underline hover:text-white/90">
                {t("cta.consentPrivacy")}
              </Link>
            </span>
          </label>
          <Button
            onPress={handleSubmit}
            size="sm"
            className="w-full text-black/70 text-sm capitalize py-5 cursor-pointer hover:bg-gray-100 active:scale-95 transition-all duration-300 font-medium  rounded-lg bg-white "
          >
            <p>{t("cta.subscribe")}</p>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Cta;
