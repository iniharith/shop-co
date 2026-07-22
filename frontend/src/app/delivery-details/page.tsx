/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import React from "react";
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
    <div className="min-h-screen bg-muted/30 text-foreground py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-foreground tracking-tight mb-8">
            {copy.title}
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
            {copy.intro}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 items-center justify-items-center">
          {partners.map((partner) => (
            <div key={partner.name} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center w-full h-40 hover:shadow-md transition-all">
              {/* Note: We use standard img tags here because some external logos might not be configured in next.config.js */}
              {partner.name === "GrabExpress" ? (
                <div className="flex flex-col items-center justify-center">
                  <img
                    src={partner.src}
                    alt={partner.name}
                    className="max-h-16 max-w-full object-contain mb-2"
                  />
                  <span className="font-bold text-gray-800 text-lg">Express</span>
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
              <span className="hidden font-bold text-gray-800 text-xl text-center">{partner.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-20 bg-card text-card-foreground p-8 md:p-12 rounded-3xl shadow-sm border border-border">
            <h2 className="text-3xl font-bold text-foreground mb-6">{copy.information}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-lg text-muted-foreground">
              {copy.details.map(([title, description]) => (
                <div key={title}>
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p>{description}</p>
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPage;
