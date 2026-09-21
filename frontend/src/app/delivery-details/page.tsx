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
    { name: "J&T Express", src: "https://www.jtexpress.my/assets/img/logo.png" },
    { name: "Pos Laju", src: "https://www.pos.com.my/media/wysiwyg/pos-logo.png" },
    { name: "Ninja Van", src: "https://www.ninjavan.co/wp-content/uploads/sites/4/2021/04/ninjavan-logo-dark.png" },
    { name: "DHL eCommerce", src: "https://www.dhl.com/content/dam/dhl/global/core/images/logos/dhl-logo.svg" },
    { name: "City-Link Express", src: "https://www.citylinkexpress.com/wp-content/uploads/2020/06/citylink-logo-dark.png" },
    { name: "GDEX", src: "https://www.gdexpress.com/malaysia/wp-content/uploads/2019/12/logo-gdex.png" },
    { name: "Lalamove", src: "https://www.lalamove.com/hubfs/Lalamove%20Website%202020/logo/Lalamove_Logo_Color.svg" },
    { name: "GrabExpress", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Grab_Logo.svg/512px-Grab_Logo.svg.png" }
  ];

  return (
    <main className="min-h-screen bg-[#f7f3e9] text-[#101820] dark:bg-[#0b1116] dark:text-white">
      <section className="relative overflow-hidden border-b border-[#d9cfba] bg-[#101820] px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8">
        <div className="pointer-events-none absolute -right-28 -top-32 size-[32rem] rounded-full bg-[#f4b400]/10 blur-3xl" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center text-center">
          <div className="mb-7 flex size-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur sm:size-24">
            <Image src="/images/kampung-cetak-logo.png" alt="Kampung Cetak" width={76} height={76} priority className="size-16 object-contain sm:size-20" />
          </div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4b400]">Kampung Cetak · Malaysia</p>
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
          <div><p className="store-eyebrow mb-2 text-[#80620a] dark:text-[#f4b400]">Nationwide network</p><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Trusted delivery partners</h2></div>
          <p className="hidden max-w-sm text-right text-sm leading-relaxed text-[#626a70] dark:text-white/50 sm:block">Multiple courier options help us choose the right service for every order and destination.</p>
        </div>
        <div className="grid grid-cols-2 items-center justify-items-center gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {partners.map((partner) => (
            <div key={partner.name} className="group flex h-32 w-full items-center justify-center rounded-2xl border border-[#ded5c2] bg-white p-6 shadow-[0_10px_35px_-30px_rgba(16,24,32,0.5)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#f4b400]/60 hover:shadow-[0_22px_48px_-30px_rgba(16,24,32,0.55)] sm:h-40 sm:p-8">
              {/* Note: We use standard img tags here because some external logos might not be configured in next.config.js */}
              {partner.name === "GrabExpress" ? (
                <div className="flex flex-col items-center justify-center">
                  <img
                    src={partner.src}
                    alt={partner.name}
                    className="max-h-16 max-w-full object-contain mb-2"
                  />
                  <span className="text-lg font-semibold text-[#101820]">Express</span>
                </div>
              ) : (
                <img
                  src={partner.src}
                  alt={partner.name}
                  className="max-h-20 max-w-full object-contain"
                  onError={(e) => {
                    // Fallback to text if logo fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              )}
              <span className="hidden text-center text-base font-semibold text-[#101820] sm:text-xl">{partner.name}</span>
            </div>
          ))}
        </div>
        <section className="mt-14 overflow-hidden rounded-[1.5rem] border border-[#d9cfba] bg-[#101820] p-7 text-white shadow-[0_30px_80px_-55px_rgba(16,24,32,0.9)] sm:mt-20 md:p-12">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#f4b400]">Before your order arrives</p>
            <h2 className="mb-9 text-3xl font-semibold tracking-tight sm:text-4xl">{copy.information}</h2>
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2">
              {copy.details.map(([title, description], index) => (
                <div key={title} className="bg-[#101820] p-6 sm:p-8">
                  <span className="mb-5 block font-mono text-xs text-[#f4b400]">0{index + 1}</span>
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
