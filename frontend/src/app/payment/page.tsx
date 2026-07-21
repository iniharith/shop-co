/**
 * Coded by Harith
 * Kampungcetak ®
 */
import React from "react";
import { Banknote, Building2, Check, CreditCard, LockKeyhole, Smartphone } from "lucide-react";

const PaymentsPage = () => {
  const banks = ["Maybank2u", "CIMB Clicks", "Public Bank", "RHB Now", "Hong Leong Connect", "AmOnline", "Bank Islam", "Bank Rakyat", "Affin Bank", "BSN", "UOB", "Standard Chartered"];
  const methods = [
    { icon: CreditCard, title: "Credit / Debit Card", items: ["Visa", "Mastercard"] },
    { icon: Building2, title: "Online Banking", items: ["FPX", "Major Malaysian banks"] },
    { icon: Smartphone, title: "E-Wallet", items: ["Touch 'n Go", "GrabPay"] },
  ];

  return (
    <div className="min-h-screen py-12 md:py-20">
      <div className="page-shell">
        <div className="glass-panel relative overflow-hidden rounded-[2rem] px-6 py-12 text-center md:px-12 md:py-16">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-primary">
            <LockKeyhole size={28} />
          </div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-primary">Secure checkout</p>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">Payment Methods</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Pilih kaedah pembayaran yang tersedia semasa checkout. Setiap transaksi dilindungi dan disahkan dengan selamat.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {methods.map(({ icon: Icon, title, items }) => (
            <div key={title} className="glass-panel rounded-3xl p-6 md:p-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Icon size={24} />
              </div>
              <h2 className="mb-4 text-xl font-bold">{title}</h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <p key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check size={15} className="text-primary" /> {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="glass-panel mt-8 rounded-[2rem] p-6 md:p-10">
          <div className="mb-8 flex items-center gap-3">
            <Banknote className="text-primary" />
            <h2 className="text-2xl font-bold md:text-3xl">Supported Banks via FPX</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {banks.map((bank) => (
              <div key={bank} className="glass-subtle flex min-h-24 items-center justify-center rounded-2xl p-4 text-center text-sm font-bold transition hover:border-primary/35">
                {bank}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
