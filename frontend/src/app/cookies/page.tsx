/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useLanguage } from "@/i18n/LanguageProvider";
import Link from "next/link";

export default function CookiesPolicyPage() {
  const { locale } = useLanguage();
  const isMalay = locale === "ms";

  return (
    <div className="min-h-screen bg-muted/30 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-card text-card-foreground p-8 md:p-12 rounded-3xl shadow-sm border border-border">
        <h1 className="text-4xl font-extrabold text-foreground mb-8 tracking-tight">
          {isMalay ? "Dasar Kuki" : "Cookie Policy"}
        </h1>
        <div className="text-muted-foreground max-w-none space-y-6 leading-relaxed">
          <p>
            {isMalay
              ? "Dasar Kuki ini menerangkan cara Kampung Cetak menggunakan kuki dan teknologi serupa apabila anda melawat laman web kami. Dengan menggunakan laman kami, anda bersetuju dengan penggunaan kuki seperti yang diterangkan di bawah. Untuk maklumat lanjut tentang cara kami mengendalikan maklumat peribadi anda, sila rujuk "
              : "This Cookie Policy explains how Kampung Cetak uses cookies and similar technologies when you visit our website. By using our site, you agree to the use of cookies as described below. For more information about how we handle your personal information, please refer to your "}
            <Link href="/privacy" className="text-foreground underline hover:text-primary">
              {isMalay ? "Dasar Privasi" : "Privacy Policy"}
            </Link>
            .
          </p>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. {isMalay ? "Apakah Kuki?" : "What Are Cookies?"}</h2>
            <p>
              {isMalay
                ? "Kuki ialah fail teks kecil yang disimpan pada peranti anda apabila anda melawat laman web. Ia digunakan secara meluas untuk menjadikan laman web berfungsi, atau berfungsi dengan lebih cekap, serta untuk menyediakan maklumat kepada pemilik laman."
                : "Cookies are small text files stored on your device when you visit a website. They are widely used to make websites work, or work more efficiently, and to provide information to the site owners."}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. {isMalay ? "Kuki yang Kami Gunakan" : "Cookies We Use"}</h2>
            <p>
              {isMalay
                ? "Kami menggunakan kuki berikut di laman kami:"
                : "We use the following cookies on our site:"}
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong className="text-foreground">kc_locale</strong> — {isMalay ? "menyimpan pilihan bahasa anda dan kekal aktif selama 1 tahun. Ia disimpan di peranti anda supaya kami tidak perlu menentukan bahasa anda semula pada setiap lawatan." : "stores your language preference and remains active for 1 year. It is stored on your device so we do not need to determine your language again on every visit."}</li>
              <li><strong className="text-foreground">next-auth.session-token</strong> — {isMalay ? "digunakan untuk mengekalkan sesi log masuk anda apabila anda mendaftar atau log masuk ke akaun anda." : "used to keep you signed in when you register or log in to your account."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. {isMalay ? "Mengurus Kuki" : "Managing Cookies"}</h2>
            <p>
              {isMalay
                ? "Anda boleh menetapkan pelayar anda untuk menolak semua atau sebahagian kuki, atau untuk memberi amaran apabila kuki sedang dihantar. Sila ambil perhatian bahawa sesetengah bahagian laman kami mungkin tidak berfungsi dengan betul jika anda melumpuhkan kuki. Untuk mengurus kuki, gunakan tetapan pelayar anda."
                : "You can set your browser to refuse all or some cookies, or to alert you when cookies are being sent. Please note that some parts of our site may not function properly if you disable cookies. To manage cookies, use your browser settings."}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. {isMalay ? "Hubungi Kami" : "Contact Us"}</h2>
            <p>
              {isMalay ? "Untuk pertanyaan tentang dasar ini, hubungi" : "For questions about this policy, contact"} <strong className="text-foreground">admin@kampungcetak.com</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
