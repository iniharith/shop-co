/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useLanguage } from "@/i18n/LanguageProvider";

export default function RefundPolicyPage() {
  const { locale } = useLanguage();
  const isMalay = locale === "ms";

  return (
    <div className="min-h-screen bg-muted/30 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-card text-card-foreground p-8 md:p-12 rounded-3xl shadow-sm border border-border">
        <h1 className="text-4xl font-extrabold text-foreground mb-8 tracking-tight">
          {isMalay ? "Dasar Pemulangan & Bayaran Balik" : "Returns & Refund Policy"}
        </h1>
        <div className="text-muted-foreground max-w-none space-y-6 leading-relaxed">
          <p>
            {isMalay
              ? "Dasar ini menerangkan syarat untuk pemulangan dan bayaran balik bagi produk dan perkhidmatan Kampung Cetak. Sila baca dengan teliti sebelum membuat pesanan."
              : "This policy explains the terms for returns and refunds for Kampung Cetak products and services. Please read it carefully before placing an order."}
          </p>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. {isMalay ? "Produk Buatan Khas" : "Custom-Made Products"}</h2>
            <p>
              {isMalay
                ? "Disebabkan sifat produk kami yang dibuat khas mengikut spesifikasi anda, bayaran balik tidak diberikan selepas pesanan dicetak atau dihasilkan. Ini termasuk pemilihan warna, reka bentuk, saiz dan bahan yang anda sahkan semasa membuat pesanan."
                : "Due to the custom nature of our products, which are made to order according to your specifications, refunds are not available once an order has been printed or produced. This includes the color, design, size, and material choices you confirm when placing an order."}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. {isMalay ? "Kecacatan Pembuatan" : "Manufacturing Defects"}</h2>
            <p>
              {isMalay
                ? "Jika terdapat kecacatan pembuatan, sila maklumkan kepada kami dalam masa 3 hari selepas menerima produk. Tuntutan yang sah akan dicetak semula atau dihasilkan semula tanpa kos tambahan."
                : "If there is a manufacturing defect, please notify us within 3 days of receiving the product. Valid claims will be reprinted or remade at no additional cost."}
            </p>
            <p className="mt-3">
              {isMalay
                ? "Untuk memproses tuntutan anda, sila sediakan nombor pesanan anda dan gambar jelas produk yang rosak."
                : "To process your claim, please provide your order number and clear photos of the defective product."}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. {isMalay ? "Ralat Pengguna" : "User Errors"}</h2>
            <p>
              {isMalay
                ? "Kami tidak bertanggungjawab terhadap kesilapan ejaan, tatabahasa, reka bentuk atau maklumat yang dihantar oleh pelanggan dalam karya mereka. Sila semak semula semua butiran sebelum menghantar pesanan anda untuk dicetak."
                : "We are not responsible for spelling, grammar, design, or information errors in artwork submitted by the customer. Please double-check all details before submitting your order for printing."}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. {isMalay ? "Batalkan Pesanan" : "Order Cancellation"}</h2>
            <p>
              {isMalay
                ? "Pembatalan adalah tertakluk pada peringkat pemprosesan pesanan. Jika pembatalan dibenarkan sebelum proses pengeluaran dimulakan, bayaran balik penuh mungkin diberikan. Selepas pengeluaran bermula, bayaran balik tidak boleh diberikan."
                : "Cancellations are subject to the stage of order processing. If a cancellation is approved before production begins, a full refund may be issued. Once production has started, refunds cannot be issued."}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. {isMalay ? "Hubungi Kami" : "Contact Us"}</h2>
            <p>
              {isMalay
                ? "Untuk sebarang pertanyaan atau tuntutan, sila hubungi kami melalui"
                : "For any questions or claims, please contact us via"}{" "}
              <strong className="text-foreground">admin@kampungcetak.com</strong>{" "}
              {isMalay ? "atau saluran WhatsApp rasmi kami." : "or our official WhatsApp channel."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
