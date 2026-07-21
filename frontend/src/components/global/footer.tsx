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
      className="glass-subtle flex items-center justify-center w-9 h-9 rounded-full hover:border-primary/40 hover:text-primary transition-colors"
    >
      {children}
    </a>
  );
};

export function Footer() {
  return (
    <footer className="glass-panel-strong w-full rounded-t-[2rem] border-x-0 border-b-0 py-12 md:px-12 px-5">
      <div className="page-shell grid mt-5 grid-cols-1 md:grid-cols-12 gap-8">
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
             <h2 className="text-2xl font-bold tracking-tight text-primary">
              Kampung Cetak
            </h2>
          </Link>

          <p className="text-sm text-muted-foreground">
            Percetakan berkualiti tinggi untuk kad nama, flyers, banner,
            sticker & lebih lagi. Penghantaran pantas seluruh Malaysia.
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
                Company
              </h3>
              <ul className="space-y-2">
                <li><FooterLink href="/about">About</FooterLink></li>
                <li><FooterLink href="/features">Features</FooterLink></li>
                <li><FooterLink href="/works">Works</FooterLink></li>
                <li><FooterLink href="/career">Career</FooterLink></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Help
              </h3>
              <ul className="space-y-2">
                <li><FooterLink href="/support">Customer Support</FooterLink></li>
                <li><FooterLink href="/delivery-details">Delivery Details</FooterLink></li>
                <li><FooterLink href="/terms">Terms & Conditions</FooterLink></li>
                <li><FooterLink href="/privacy">Privacy Policy</FooterLink></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                FAQ
              </h3>
              <ul className="space-y-2">
                <li><FooterLink href="/home/profile">Account</FooterLink></li>
                <li><FooterLink href="/home/profile/orders">Manage Deliveries</FooterLink></li>
                <li><FooterLink href="/home/profile/dashboard">Orders</FooterLink></li>
                <li><FooterLink href="/payment">Payments</FooterLink></li>
              </ul>
            </div>


          </div>
        </div>
      </div>

      <div className="page-shell flex flex-col md:flex-row justify-between items-center mt-12 pt-8 border-t border-white/10">
        <p className="text-xs text-muted-foreground mb-4 md:mb-0">
          Kampung Cetak © 2026, All Rights Reserved
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {["VISA", "MASTERCARD", "FPX", "E-WALLET"].map((method) => (
            <span key={method} className="glass-subtle rounded-lg px-3 py-2 text-[10px] font-black tracking-wider text-muted-foreground">
              {method}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
