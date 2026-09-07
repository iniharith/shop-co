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
    <div className="w-full transform translate-y-10 grid place-items-center">
      <div className="w-[90%] md:w-[70%] rounded-lg bg-black px-4 py-7 grid md:grid-cols-2 ">
        <div className="flex flex-col justify-center gap-2 md:px-10 px-4">
          <h1 className="text-white text-3xl ">
            {t("cta.title")}
          </h1>
        </div>
        <div className="flex md:mt-0 md:px-0 px-4 mt-10 flex-col items-center justify-center gap-2">
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
    </div>
  );
};

export default Cta;
