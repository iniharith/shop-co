/**
 * Coded by Harith
 * Kampungcetak ®
 */
import React from "react";
import { Clock3, MapPin, PackageCheck, Route, Store, Truck } from "lucide-react";

const DeliveryPage = () => {
  const partners = [
    "J&T Express", "Pos Laju", "Ninja Van", "DHL eCommerce",
    "City-Link Express", "GDEX", "Lalamove", "GrabExpress",
  ];

  const details = [
    { icon: Clock3, title: "Processing Time", text: "Tempoh pemprosesan bergantung pada produk dan kaedah cetakan. Pesanan standard disediakan dalam 3-5 hari bekerja." },
    { icon: Route, title: "Shipping Time", text: "Semenanjung Malaysia: 1-3 hari bekerja. Sabah dan Sarawak: 3-5 hari bekerja." },
    { icon: PackageCheck, title: "Track Your Order", text: "Nombor tracking akan dihantar melalui e-mel dan turut tersedia dalam dashboard akaun anda." },
    { icon: Store, title: "Self-Pickup", text: "Self-pickup tersedia di pejabat utama Selangor selepas anda menerima pengesahan bahawa pesanan telah siap." },
  ];

  return (
    <div className="min-h-screen py-12 md:py-20">
      <div className="page-shell">
        <div className="glass-panel relative overflow-hidden rounded-[2rem] px-6 py-12 text-center md:px-12 md:py-16">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-primary">
            <Truck size={28} />
          </div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-primary">Nationwide delivery</p>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">Delivery Partners</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Kami bekerjasama dengan rangkaian kurier dipercayai untuk memastikan hasil cetakan anda tiba dengan selamat dan tepat pada masanya.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {partners.map((partner, index) => (
            <div key={partner} className="glass-subtle group flex min-h-32 flex-col items-center justify-center rounded-2xl p-5 text-center transition hover:-translate-y-1 hover:border-primary/35">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 font-black text-primary">
                {String(index + 1).padStart(2, "0")}
              </div>
              <span className="font-bold">{partner}</span>
            </div>
          ))}
        </div>

        <div className="glass-panel mt-8 rounded-[2rem] p-6 md:p-10">
          <div className="mb-8 flex items-center gap-3">
            <MapPin className="text-primary" />
            <h2 className="text-2xl font-bold md:text-3xl">Delivery Information</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {details.map(({ icon: Icon, title, text }) => (
              <div key={title} className="glass-subtle rounded-2xl p-5 md:p-6">
                <Icon className="mb-4 text-primary" size={24} />
                <h3 className="mb-2 font-bold">{title}</h3>
                <p className="text-sm leading-7 text-muted-foreground">{text}</p>
              </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPage;
