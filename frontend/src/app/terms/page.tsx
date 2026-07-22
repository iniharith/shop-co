/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useLanguage } from "@/i18n/LanguageProvider";

const englishSections = [
  ["General", [
    'For these terms, "we", "us", "our", and "Kampung Cetak" refer to Kampung Cetak, a company incorporated in Malaysia. "Website" refers to kampungcetak.com.',
    "By accessing or using our Website, you agree to comply with these Terms and Conditions. Please read them carefully.",
    "If you do not agree to these Terms and Conditions, please do not use our Website or services.",
  ]],
  ["Printing Quality", [
    "We strive to provide high-quality printing. Slight color variations may occur between digital artwork and the final printed product due to the nature of printing processes.",
    "We are not responsible for spelling, grammar, or design errors in artwork submitted by the customer.",
  ]],
  ["Orders and Payment", [
    "All orders are subject to acceptance by Kampung Cetak. We reserve the right to refuse any order.",
    "Payment must be made in full before we process and print your order.",
  ]],
  ["Delivery", [
    "Delivery times are estimates and are not guaranteed. Kampung Cetak is not liable for delays caused by couriers or unforeseen circumstances.",
    "Please ensure your delivery address is accurate. Additional charges may apply for re-delivery caused by an incorrect address.",
  ]],
  ["Returns and Refunds", [
    "Due to the custom nature of our products, refunds are not available once an order has been printed.",
    "If there is a manufacturing defect, notify us within 3 days of receiving the product. Valid claims will be reprinted at no additional cost.",
  ]],
  ["Inappropriate Content", ["Kampung Cetak may reject unlawful, harmful, threatening, pornographic, discriminatory, profane, offensive, or otherwise inappropriate content."]],
  ["Communications", ["Official communications with Kampung Cetak are made through email, phone, or our official WhatsApp channel."]],
  ["Changes to These Terms", ["Website content and these Terms and Conditions may be updated at our discretion without prior notice."]],
  ["Governing Law", ["These Terms and Conditions are governed by Malaysian law and are subject to the exclusive jurisdiction of the courts of Malaysia."]],
] as const;

const malaySections = [
  ["Umum", [
    'Dalam terma ini, "kami" dan "Kampung Cetak" merujuk kepada Kampung Cetak, sebuah syarikat yang diperbadankan di Malaysia. "Laman Web" merujuk kepada kampungcetak.com.',
    "Dengan mengakses atau menggunakan Laman Web kami, anda bersetuju untuk mematuhi Terma dan Syarat ini. Sila baca dengan teliti.",
    "Jika anda tidak bersetuju dengan Terma dan Syarat ini, jangan gunakan Laman Web atau perkhidmatan kami.",
  ]],
  ["Kualiti Percetakan", [
    "Kami berusaha memberikan hasil cetakan berkualiti tinggi. Sedikit perbezaan warna mungkin berlaku antara karya digital dengan produk bercetak disebabkan proses percetakan.",
    "Kami tidak bertanggungjawab terhadap kesalahan ejaan, tatabahasa atau reka bentuk dalam karya yang dihantar oleh pelanggan.",
  ]],
  ["Pesanan dan Pembayaran", [
    "Semua pesanan tertakluk pada penerimaan oleh Kampung Cetak. Kami berhak menolak mana-mana pesanan.",
    "Bayaran penuh perlu dibuat sebelum pesanan diproses dan dicetak.",
  ]],
  ["Penghantaran", [
    "Tempoh penghantaran ialah anggaran dan tidak dijamin. Kampung Cetak tidak bertanggungjawab terhadap kelewatan kurier atau keadaan di luar jangkaan.",
    "Pastikan alamat penghantaran tepat. Caj tambahan mungkin dikenakan untuk penghantaran semula akibat alamat yang salah.",
  ]],
  ["Pemulangan dan Bayaran Balik", [
    "Disebabkan produk kami dibuat khas, bayaran balik tidak diberikan selepas pesanan dicetak.",
    "Jika terdapat kecacatan pembuatan, maklumkan kepada kami dalam masa 3 hari selepas menerima produk. Tuntutan yang sah akan dicetak semula tanpa caj tambahan.",
  ]],
  ["Kandungan Tidak Sesuai", ["Kampung Cetak boleh menolak kandungan yang menyalahi undang-undang, berbahaya, mengancam, lucah, diskriminasi, kesat atau tidak sesuai."]],
  ["Komunikasi", ["Komunikasi rasmi dengan Kampung Cetak dibuat melalui e-mel, telefon atau saluran WhatsApp rasmi kami."]],
  ["Perubahan Terma", ["Kandungan Laman Web dan Terma dan Syarat ini boleh dikemas kini mengikut budi bicara kami tanpa notis awal."]],
  ["Undang-undang", ["Terma dan Syarat ini ditadbir oleh undang-undang Malaysia dan tertakluk pada bidang kuasa eksklusif mahkamah Malaysia."]],
] as const;

export default function TermsAndConditions() {
  const { locale } = useLanguage();
  const sections = locale === "ms" ? malaySections : englishSections;

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-6">
      <div className="max-w-4xl mx-auto rounded-3xl border border-border bg-card p-8 md:p-12 text-card-foreground shadow-sm">
        <h1 className="text-4xl font-bold mb-8">
          {locale === "ms" ? "Terma dan Syarat" : "Terms and Conditions"}
        </h1>
        <div className="space-y-8 text-muted-foreground">
          {sections.map(([title, paragraphs]) => (
            <section key={title}>
              <h2 className="text-2xl font-semibold mb-4 text-foreground uppercase">{title}</h2>
              <div className="space-y-2">
                {paragraphs.map((paragraph, index) => (
                  <p key={paragraph}>{String.fromCharCode(97 + index)}. {paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
