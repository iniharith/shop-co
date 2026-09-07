/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram } from "lucide-react";
import { SiTiktok, SiShopee } from "react-icons/si";
import { useLanguage } from "@/i18n/LanguageProvider";

const FooterLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <Link
      href={href}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  );
};

const SocialIcon = ({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center w-8 h-8 rounded-full bg-background hover:bg-accent transition-colors"
    >
      {children}
    </a>
  );
};

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="w-full rounded-t-lg py-12 md:px-[3rem] px-[.5rem] bg-muted text-foreground border-t border-border">
      <div className="grid mt-5 grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-3 space-y-4">

          {/* ── FOOTER LOGO ── */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/kampung-cetak-logo.png"
              alt="Kampung Cetak"
              width={72}
              height={72}
              className="object-contain rounded-2xl"
            />
            <h2 className="text-2xl font-bold tracking-tighter">
              Kampung Cetak
            </h2>
          </Link>

          <p className="text-sm text-muted-foreground">
            {t("footer.description")}
          </p>
          <div className="flex space-x-2">
            <SocialIcon href="https://www.instagram.com/kampungcetak.my/">
              <Instagram className="h-4 w-4" />
            </SocialIcon>
            <SocialIcon href="https://www.tiktok.com/@kampungcetaksolutions">
              <SiTiktok className="h-4 w-4" />
            </SocialIcon>
            <SocialIcon href="https://shopee.com.my/printvillage">
              <SiShopee className="h-4 w-4" />
            </SocialIcon>
          </div>
        </div>

        <div className="md:col-span-9">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                {t("footer.company")}
              </h3>
              <ul className="space-y-2">
                <li><FooterLink href="/about">{t("footer.about")}</FooterLink></li>
                <li><FooterLink href="/features">{t("footer.features")}</FooterLink></li>
                <li><FooterLink href="/works">{t("footer.works")}</FooterLink></li>
                <li><FooterLink href="/career">{t("footer.career")}</FooterLink></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                {t("footer.help")}
              </h3>
              <ul className="space-y-2">
                <li><FooterLink href="/support">{t("footer.support")}</FooterLink></li>
                <li><FooterLink href="/delivery-details">{t("footer.delivery")}</FooterLink></li>
                <li><FooterLink href="/terms">{t("footer.terms")}</FooterLink></li>
                <li><FooterLink href="/privacy">{t("footer.privacy")}</FooterLink></li>
                <li><FooterLink href="/cookies">{t("footer.cookies")}</FooterLink></li>
                <li><FooterLink href="/refund-policy">{t("footer.refund")}</FooterLink></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                {t("footer.faq")}
              </h3>
              <ul className="space-y-2">
                <li><FooterLink href="/home/profile">{t("footer.account")}</FooterLink></li>
                <li><FooterLink href="/home/profile/orders">{t("footer.deliveries")}</FooterLink></li>
                <li><FooterLink href="/home/profile/dashboard">{t("footer.orders")}</FooterLink></li>
                <li><FooterLink href="/payment">{t("footer.payments")}</FooterLink></li>
              </ul>
            </div>


          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mt-12 pt-8 border-t">
        <p className="text-xs text-muted-foreground mb-4 md:mb-0">
          Kampung Cetak © 2026, {t("footer.rights")}
        </p>
        <div className="flex items-center space-x-4">
          <img
            src="https://cdn-icons-png.flaticon.com/128/349/349221.png"
            alt="Visa"
            className="h-8 w-auto"
          />
          <img
            src="https://cdn-icons-png.flaticon.com/128/196/196578.png"
            alt="Mastercard"
            className="h-8 w-auto"
          />
          <img
            src="https://cdn-icons-png.flaticon.com/128/174/174861.png"
            alt="PayPal"
            className="h-8 w-auto"
          />
          <img
            src="https://cdn-icons-png.flaticon.com/128/888/888871.png"
            alt="Apple Pay"
            className="h-8 w-auto"
          />
          <img
            src="https://cdn-icons-png.flaticon.com/128/6124/6124998.png"
            alt="Google Pay"
            className="h-8 w-auto"
          />
        </div>
      </div>
    </footer>
  );
}
