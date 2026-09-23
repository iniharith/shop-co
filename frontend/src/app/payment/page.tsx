"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function PaymentsPage() {
  const { locale } = useLanguage();
  const isMalay = locale === "ms";

  return (
    <main className="min-h-[60vh] bg-background px-5 py-16 text-foreground sm:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {isMalay ? "Pembayaran" : "Payment"}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          {isMalay ? "Bayar semasa terima" : "Cash on Delivery"}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {isMalay
            ? "Buat masa ini, pesanan melalui laman web menggunakan kaedah bayar semasa terima. Jumlah pesanan dan kos penghantaran akan dipaparkan sebelum anda membuat pesanan."
            : "Website orders currently use Cash on Delivery. Your order total and delivery charge are shown before you place your order."}
        </p>
        <div className="mt-10 rounded-xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold">
            {isMalay ? "Perlukan bantuan?" : "Need help?"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {isMalay
              ? "Jika anda mempunyai soalan tentang pembayaran atau pesanan tersuai, hubungi pasukan kami sebelum membuat pesanan."
              : "If you have a payment question or a custom order, contact our team before placing an order."}
          </p>
          <Link
            href="/support"
            className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {isMalay ? "Hubungi sokongan" : "Contact support"}
          </Link>
        </div>
      </div>
    </main>
  );
}
