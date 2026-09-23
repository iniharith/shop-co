/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "@/i18n/LanguageProvider";

const DeliveryPage = () => {
  const { locale } = useLanguage();
  const copy = locale === "ms" ? {
    title: "RAKAN PENGHANTARAN KAMI",
    intro: "Kami bekerjasama dengan perkhidmatan kurier dipercayai di Malaysia supaya hasil cetakan anda tiba dengan selamat dan tepat pada masanya.",
    information: "Maklumat Penghantaran",
    details: [
      ["Tempoh Pemprosesan", "Tempoh pemprosesan bergantung pada kaedah cetakan dan produk. Pesanan standard mengambil masa 3-5 hari bekerja sebelum diserahkan kepada kurier."],
      ["Tempoh Penghantaran", "Semenanjung Malaysia: 1-3 hari bekerja. Sabah dan Sarawak: 3-5 hari bekerja."],
      ["Jejak Pesanan", "Selepas pesanan dihantar, nombor penjejakan akan dihantar melalui e-mel dan tersedia dalam dashboard akaun anda."],
      ["Ambil Sendiri", "Pengambilan sendiri tersedia di pejabat utama kami di Selangor pada waktu bekerja selepas anda menerima pengesahan."],
    ],
  } : {
    title: "OUR PARTNERS FOR DELIVERY",
    intro: "We partner with trusted courier services in Malaysia to ensure your prints arrive safely and on time.",
    information: "Delivery Information",
    details: [
      ["Processing Time", "Processing depends on the printing method and product. Standard orders take 3-5 business days before being handed to our delivery partners."],
      ["Shipping Time", "Peninsular Malaysia: 1-3 working days. Sabah and Sarawak: 3-5 working days."],
      ["Track Your Order", "Once your order ships, you will receive a tracking number by email and can also track it through your account dashboard."],
      ["Self-Pickup", "Self-pickup is available at our main office in Selangor during working hours after you receive confirmation."],
    ],
  };
  const partners = [
    { name: "J&T Express", logo: "/images/providers/jnt.png", detail: "Nationwide parcel delivery" },
    { name: "Pos Laju", logo: "/images/providers/pos-laju.png", detail: "Malaysia's national courier" },
    { name: "Ninja Van", logo: "/images/providers/ninja-van.png", detail: "Door-to-door delivery" },
    { name: "Lalamove", logo: "/images/providers/lalamove.png", detail: "On-demand local delivery" }
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border bg-primary px-4 py-16 text-primary-foreground dark:bg-card dark:text-foreground sm:px-6 sm:py-24 lg:px-8">
        <div className="relative mx-auto flex max-w-7xl flex-col items-center text-center">
          <div className="mb-7 flex size-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur sm:size-24">
            <Image src="/images/kampung-cetak-logo.png" alt="Kampung Cetak" width={76} height={76} priority className="size-16 object-contain sm:size-20" />
          </div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-highlight">Kampung Cetak · Malaysia</p>
          <h1 className="store-page-title max-w-4xl text-4xl font-semibold sm:text-6xl lg:text-7xl">
            {copy.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
            {copy.intro}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div><p className="store-eyebrow mb-2">Nationwide network</p><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Trusted delivery partners</h2></div>
          <p className="hidden max-w-sm text-right text-sm leading-relaxed text-muted-foreground sm:block">Multiple courier options help us choose the right service for every order and destination.</p>
        </div>
        <div className="grid grid-cols-2 items-center justify-items-center gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {partners.map((partner) => (
            <div key={partner.name} className="group flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#e9ad13] hover:shadow-md sm:min-h-48 sm:p-7">
              <div className="relative mb-4 h-14 w-full max-w-40"><Image src={partner.logo} alt={`${partner.name} official logo`} fill className="object-contain" sizes="160px" /></div>
              <h3 className="text-base font-semibold text-foreground sm:text-lg">{partner.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{partner.detail}</p>
            </div>
          ))}
        </div>
        <section className="mt-14 overflow-hidden rounded-[1.5rem] border border-border bg-primary p-7 text-primary-foreground dark:bg-card dark:text-foreground sm:mt-20 md:p-12">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-highlight">Before your order arrives</p>
            <h2 className="mb-9 text-3xl font-semibold tracking-tight sm:text-4xl">{copy.information}</h2>
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2">
              {copy.details.map(([title, description], index) => (
                <div key={title} className="bg-primary p-6 dark:bg-card sm:p-8">
                  <span className="mb-5 block font-mono text-xs text-brand-highlight">0{index + 1}</span>
                  <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-white/60 sm:text-base">{description}</p>
                </div>
              ))}
            </div>
        </section>
      </div>
    </main>
  );
};

export default DeliveryPage;
