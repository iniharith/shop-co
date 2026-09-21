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
    { name: "Maybank", mark: "MAYBANK", color: "#ffcc00", ink: "#111827", detail: "Maybank2u" },
    { name: "CIMB Bank", mark: "CIMB", color: "#d71920", ink: "#ffffff", detail: "CIMB Clicks" },
    { name: "Public Bank", mark: "PBE", color: "#d71920", ink: "#ffffff", detail: "PBe Online Banking" },
    { name: "RHB Bank", mark: "RHB", color: "#005baa", ink: "#ffffff", detail: "RHB Online Banking" },
    { name: "Hong Leong Bank", mark: "HLB", color: "#0067b1", ink: "#ffffff", detail: "HLB Connect" },
    { name: "AmBank", mark: "AMBANK", color: "#e31837", ink: "#ffffff", detail: "AmOnline" },
    { name: "Bank Islam", mark: "BANK ISLAM", color: "#7b1e3a", ink: "#ffffff", detail: "BIMB Web" },
    { name: "Bank Rakyat", mark: "BANK RAKYAT", color: "#0071bc", ink: "#ffffff", detail: "iRakyat" },
    { name: "Affin Bank", mark: "AFFIN", color: "#00529b", ink: "#ffffff", detail: "AffinAlways" },
    { name: "BSN", mark: "BSN", color: "#0072bc", ink: "#ffffff", detail: "myBSN" },
    { name: "Bank Muamalat", mark: "MUAMALAT", color: "#642d91", ink: "#ffffff", detail: "i-Muamalat" },
    { name: "Agrobank", mark: "AGROBANK", color: "#008c45", ink: "#ffffff", detail: "AgroNet" }
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
              <div className="rounded-xl bg-[#ef3123] px-5 py-3 text-lg font-black tracking-tight text-white">MyDebit</div>
            </div>

            <div className="flex min-h-56 flex-col items-center justify-center space-y-4 border-t border-[#e5ddcd] p-8 md:border-l md:border-t-0 dark:border-white/10">
              <span className="font-mono text-xs text-[#9a7300] dark:text-[#f4b400]">02</span>
              <h2 className="mb-4 text-xl font-semibold">FPX Online Banking</h2>
              <div className="rounded-xl bg-[#174b8c] px-6 py-3 text-xl font-black tracking-tight text-white">FPX</div>
            </div>

            <div className="flex min-h-56 flex-col items-center justify-center space-y-4 border-t border-[#e5ddcd] p-8 md:border-l md:border-t-0 dark:border-white/10">
              <span className="font-mono text-xs text-[#9a7300] dark:text-[#f4b400]">03</span>
              <h2 className="mb-4 text-xl font-semibold">DuitNow &amp; {isMalay ? "E-Dompet" : "E-Wallets"}</h2>
              <div className="flex flex-wrap justify-center gap-3"><div className="rounded-xl bg-[#e6007e] px-4 py-3 text-base font-black text-white">DuitNow</div><div className="rounded-xl bg-[#1769aa] px-4 py-3 text-base font-black text-white">TNG eWallet</div></div>
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
              <div className="mb-4 flex h-11 min-w-20 items-center justify-center rounded-xl px-4 text-sm font-black tracking-[-0.03em] shadow-sm" style={{ backgroundColor: bank.color, color: bank.ink }}>{bank.mark}</div>
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
