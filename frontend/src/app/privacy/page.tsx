/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useLanguage } from "@/i18n/LanguageProvider";

export default function PrivacyPolicyPage() {
  const { locale } = useLanguage();
  const isMalay = locale === "ms";

  return (
    <div className="min-h-screen bg-muted/30 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-card text-card-foreground p-8 md:p-12 rounded-3xl shadow-sm border border-border">
        <h1 className="text-4xl font-extrabold text-foreground mb-8 tracking-tight">
          {isMalay ? "Dasar Privasi" : "Privacy Policy"}
        </h1>
        <div className="text-muted-foreground max-w-none space-y-6 leading-relaxed">
          <p>
            {isMalay
              ? "Kampung Cetak memandang serius privasi anda. Dasar ini menerangkan cara kami mengumpul, menggunakan, mendedahkan dan melindungi maklumat anda apabila anda melawat laman web atau menggunakan perkhidmatan kami. Jika anda tidak bersetuju dengan dasar ini, sila jangan akses laman ini."
              : "At Kampung Cetak, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services. If you do not agree with this policy, please do not access the site."}
          </p>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. {isMalay ? "Maklumat yang Kami Kumpul" : "Information We Collect"}</h2>
            <p>{isMalay ? "Maklumat yang boleh dikumpul termasuk:" : "Information we may collect includes:"}</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong className="text-foreground">{isMalay ? "Data Peribadi:" : "Personal Data:"}</strong> {isMalay ? "nama, alamat penghantaran, e-mel, nombor telefon dan maklumat demografi yang anda berikan semasa mendaftar atau menyertai aktiviti berkaitan laman ini." : "personally identifiable information such as your name, shipping address, email address, telephone number, and demographic information you provide when registering or participating in site-related activities."}</li>
              <li><strong className="text-foreground">{isMalay ? "Data Derivatif:" : "Derivative Data:"}</strong> {isMalay ? "alamat IP, jenis pelayar, sistem operasi, masa akses serta halaman yang dilihat sebelum dan selepas mengakses laman ini." : "information automatically collected by our servers, including your IP address, browser type, operating system, access times, and pages viewed before and after accessing the site."}</li>
              <li><strong className="text-foreground">{isMalay ? "Data Kewangan:" : "Financial Data:"}</strong> {isMalay ? "maklumat berkaitan kaedah pembayaran yang diperlukan untuk pembelian, pesanan, pemulangan, pertukaran atau transaksi lain." : "information related to your payment method that may be collected when you purchase, order, return, exchange, or request services."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. {isMalay ? "Penggunaan Maklumat" : "Use of Your Information"}</h2>
            <p>{isMalay ? "Maklumat yang tepat membantu kami menyediakan pengalaman yang lancar dan disesuaikan. Kami boleh menggunakannya untuk:" : "Accurate information helps us provide a smooth, efficient, and customized experience. We may use it to:"}</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>{isMalay ? "Mencipta dan mengurus akaun anda." : "Create and manage your account."}</li>
              <li>{isMalay ? "Memproses transaksi serta menghantar produk dan perkhidmatan yang diminta." : "Process transactions and deliver requested products and services."}</li>
              <li>{isMalay ? "Menghantar e-mel berkaitan akaun atau pesanan anda." : "Email you regarding your account or order."}</li>
              <li>{isMalay ? "Mengurus pembelian, pesanan, pembayaran dan transaksi berkaitan." : "Fulfill and manage purchases, orders, payments, and related transactions."}</li>
              <li>{isMalay ? "Menjawab permintaan produk dan khidmat pelanggan." : "Respond to product and customer service requests."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. {isMalay ? "Pendedahan Maklumat" : "Disclosure of Information"}</h2>
            <p>{isMalay ? "Maklumat boleh didedahkan apabila diperlukan oleh undang-undang atau untuk melindungi hak, kepada penyedia perkhidmatan pihak ketiga, bagi komunikasi pemasaran yang dibenarkan, atau semasa pemindahan perniagaan." : "Information may be disclosed when required by law or to protect rights, to third-party service providers, for permitted marketing communications, or in connection with business transfers."}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. {isMalay ? "Keselamatan Maklumat" : "Information Security"}</h2>
            <p>{isMalay ? "Kami menggunakan langkah pentadbiran, teknikal dan fizikal yang munasabah untuk melindungi maklumat peribadi anda. Walaupun langkah sewajarnya telah diambil, tiada sistem keselamatan atau kaedah penghantaran data boleh dijamin sepenuhnya daripada pemintasan atau penyalahgunaan." : "We use administrative, technical, and physical security measures to protect your personal information. Although reasonable steps are taken, no security system or method of data transmission can be guaranteed against every interception or misuse."}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. {isMalay ? "Hubungi Kami" : "Contact Us"}</h2>
            <p>{isMalay ? "Untuk pertanyaan tentang dasar ini, hubungi" : "For questions about this policy, contact"} <strong className="text-foreground">admin@kampungcetak.com</strong>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
