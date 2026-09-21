/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "@/i18n/LanguageProvider";

const PaymentsPage = () => {
  const { locale } = useLanguage();
  const isMalay = locale === "ms";
  const banks = [
    { name: "Maybank", logo: "/images/providers/maybank.png", detail: "Maybank2u" },
    { name: "CIMB Bank", logo: "/images/providers/cimb.png", detail: "CIMB Clicks" },
    { name: "Hong Leong Bank", logo: "/images/providers/hong-leong.png", detail: "HLB Connect" },
    { name: "AmBank", logo: "/images/providers/ambank.png", detail: "AmOnline" }
  ];

  return (
    <main className="min-h-screen bg-[#f7f3e9] text-[#101820] dark:bg-[#0b1116] dark:text-white">
      <section className="relative overflow-hidden border-b border-[#d9cfba] bg-[#101820] px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8">
        <div className="pointer-events-none absolute -left-28 -top-32 size-[32rem] rounded-full bg-[#f4b400]/10 blur-3xl" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center text-center">
          <div className="mb-7 flex size-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur sm:size-24">
            <Image src="/images/kampung-cetak-logo.png" alt="Kampung Cetak" width={76} height={76} priority className="size-16 object-contain sm:size-20" />
          </div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4b400]">Secure checkout</p>
          <h1 className="store-page-title text-4xl font-semibold sm:text-6xl lg:text-7xl">
            {isMalay ? "KAEDAH PEMBAYARAN" : "WE ACCEPT"}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
            {isMalay ? "Kaedah pembayaran yang selamat, pantas dan boleh dipercayai untuk kemudahan anda." : "Secure, fast, and reliable payment methods for your convenience."}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        {/* Global Cards & FPX */}
        <section className="mb-14 overflow-hidden rounded-[1.5rem] border border-[#d9cfba] bg-white shadow-[0_24px_70px_-55px_rgba(16,24,32,0.75)] dark:border-white/10 dark:bg-[#101820]">
          <div className="grid grid-cols-1 md:grid-cols-3">

            <div className="flex min-h-56 flex-col items-center justify-center space-y-4 p-8">
              <span className="font-mono text-xs text-[#9a7300] dark:text-[#f4b400]">01</span>
              <h2 className="mb-4 text-xl font-semibold">MyDebit</h2>
              <div className="relative h-14 w-44"><Image src="/images/providers/mydebit.png" alt="MyDebit official logo" fill className="object-contain" sizes="176px" /></div>
            </div>

            <div className="flex min-h-56 flex-col items-center justify-center space-y-4 border-t border-[#e5ddcd] p-8 md:border-l md:border-t-0 dark:border-white/10">
              <span className="font-mono text-xs text-[#9a7300] dark:text-[#f4b400]">02</span>
              <h2 className="mb-4 text-xl font-semibold">FPX Online Banking</h2>
              <div className="rounded-xl border border-[#174b8c]/20 bg-white px-7 py-3 text-xl font-black tracking-tight text-[#174b8c] shadow-sm">FPX</div>
            </div>

            <div className="flex min-h-56 flex-col items-center justify-center space-y-4 border-t border-[#e5ddcd] p-8 md:border-l md:border-t-0 dark:border-white/10">
              <span className="font-mono text-xs text-[#9a7300] dark:text-[#f4b400]">03</span>
              <h2 className="mb-4 text-xl font-semibold">DuitNow &amp; {isMalay ? "E-Dompet" : "E-Wallets"}</h2>
              <div className="flex items-center justify-center gap-5"><div className="relative h-14 w-24"><Image src="/images/providers/duitnow.webp" alt="DuitNow official logo" fill className="object-contain" sizes="96px" /></div><div className="relative h-14 w-14"><Image src="/images/providers/tng-ewallet.svg" alt="Touch 'n Go eWallet official logo" fill className="object-contain" sizes="56px" /></div></div>
            </div>

          </div>
        </section>

        {/* Supported Banks grid */}
        <div className="mb-10 mt-16">
          <p className="store-eyebrow mb-2 text-[#80620a] dark:text-[#f4b400]">FPX network</p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{isMalay ? "Bank yang Disokong melalui FPX" : "Supported Banks via FPX"}</h2>
        </div>

        <div className="grid grid-cols-2 items-center justify-items-center gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {banks.map((bank) => (
            <div key={bank.name} className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-[#ded5c2] bg-white p-5 text-center shadow-[0_10px_35px_-30px_rgba(16,24,32,0.5)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#f4b400]/60 hover:shadow-[0_22px_48px_-30px_rgba(16,24,32,0.55)] sm:min-h-44">
              <div className="relative mb-4 h-14 w-full max-w-40"><Image src={bank.logo} alt={`${bank.name} official logo`} fill className="object-contain" sizes="160px" /></div>
              <h3 className="font-semibold text-[#101820]">{bank.name}</h3>
              <p className="mt-1 text-xs text-[#687078]">{bank.detail}</p>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
};

export default PaymentsPage;
