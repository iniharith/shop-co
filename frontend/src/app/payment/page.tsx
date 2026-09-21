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
    { name: "Maybank2u", src: "https://www.maybank2u.com.my/maybank2u/malaysia/en/personal/images/m2u-logo.png" },
    { name: "CIMB Clicks", src: "https://www.cimbclicks.com.my/content/dam/cimbclicks/cimb-clicks-logo.svg" },
    { name: "Public Bank", src: "https://www.pbebank.com/images/layout/logo.png" },
    { name: "RHB Now", src: "https://logodix.com/logo/2034020.png" },
    { name: "Hong Leong Connect", src: "https://s3-ap-southeast-1.amazonaws.com/s3.kinihalal.com/hlb_logo_400x400.png" },
    { name: "AmOnline", src: "https://www.ambank.com.my/Style%20Library/AmBank%202018/images/ambank-logo.png" },
    { name: "Bank Islam", src: "https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Bank_Islam_Malaysia_logo.svg/1200px-Bank_Islam_Malaysia_logo.svg.png" },
    { name: "Bank Rakyat", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Logo_Bank_Rakyat.svg/1200px-Logo_Bank_Rakyat.svg.png" },
    { name: "Affin Bank", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Affin_Bank_logo.svg/1200px-Affin_Bank_logo.svg.png" },
    { name: "BSN", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Bank_Simpanan_Nasional_Logo.svg/1200px-Bank_Simpanan_Nasional_Logo.svg.png" },
    { name: "UOB", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/United_Overseas_Bank_logo.svg/1200px-United_Overseas_Bank_logo.svg.png" },
    { name: "Standard Chartered", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Standard_Chartered_Logo_2021.svg/1200px-Standard_Chartered_Logo_2021.svg.png" }
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
              <h2 className="mb-4 text-xl font-semibold">{isMalay ? "Kad Kredit / Debit" : "Credit / Debit Cards"}</h2>
              <div className="flex gap-6">
                <img src="https://cdn-icons-png.flaticon.com/128/349/349221.png" alt="Visa" className="h-16 w-auto object-contain" />
                <img src="https://cdn-icons-png.flaticon.com/128/196/196578.png" alt="Mastercard" className="h-16 w-auto object-contain" />
              </div>
            </div>

            <div className="flex min-h-56 flex-col items-center justify-center space-y-4 border-t border-[#e5ddcd] p-8 md:border-l md:border-t-0 dark:border-white/10">
              <span className="font-mono text-xs text-[#9a7300] dark:text-[#f4b400]">02</span>
              <h2 className="mb-4 text-xl font-semibold">{isMalay ? "Perbankan Dalam Talian" : "Online Banking"}</h2>
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/FPX_logo.svg/1200px-FPX_logo.svg.png" alt="FPX" className="h-16 w-auto object-contain" />
            </div>

            <div className="flex min-h-56 flex-col items-center justify-center space-y-4 border-t border-[#e5ddcd] p-8 md:border-l md:border-t-0 dark:border-white/10">
              <span className="font-mono text-xs text-[#9a7300] dark:text-[#f4b400]">03</span>
              <h2 className="mb-4 text-xl font-semibold">{isMalay ? "E-Dompet" : "E-Wallets"}</h2>
              <div className="flex gap-4">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Touch_%27n_Go_eWallet_logo.svg/1200px-Touch_%27n_Go_eWallet_logo.svg.png" alt="TNG" className="h-12 w-auto object-contain" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Grab_Logo.svg/1200px-Grab_Logo.svg.png" alt="GrabPay" className="h-12 w-auto object-contain" />
              </div>
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
            <div key={bank.name} className="flex h-32 w-full flex-col items-center justify-center rounded-2xl border border-[#ded5c2] bg-white p-6 shadow-[0_10px_35px_-30px_rgba(16,24,32,0.5)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#f4b400]/60 hover:shadow-[0_22px_48px_-30px_rgba(16,24,32,0.55)] sm:h-36">
              <img
                src={bank.src}
                alt={bank.name}
                className="max-h-12 max-w-full object-contain mb-4"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <span className="hidden font-semibold text-gray-800 text-center">{bank.name}</span>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
};

export default PaymentsPage;
