/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";

const AboutPage = () => {
  const { locale } = useLanguage();
  const copy = locale === "ms" ? {
    title: "Tentang",
    quote: "Kami berbangga dengan hasil kerja kami dan kepuasan pelanggan membezakan KAMPUNG CETAK daripada pesaing.",
    years: "Tahun Pengalaman",
    clients: "Pelanggan Gembira",
    storyTitle: "Kisah Kami",
    story: [
      "Ditubuhkan pada tahun 2004, KAMPUNG CETAK ialah salah sebuah syarikat percetakan terkemuka negara. Kami merupakan pusat sehenti bagi penyelesaian barangan promosi perniagaan dan menyediakan pelbagai perkhidmatan dalam industri percetakan.",
      "Pasukan kami yang berdedikasi, perkhidmatan bersepadu dan penyelesaian menyeluruh memenuhi keperluan pelanggan masa kini. Kami bukan sekadar bercakap tentang kualiti, kami membuktikannya melalui hasil. Sama ada anda mahu mempromosikan produk atau perkhidmatan, kami membantu menghasilkan persembahan visual yang berkesan untuk mengembangkan perniagaan anda.",
    ],
    strengthsTitle: "Kekuatan Kami",
    strengthsIntro: "Kampung Cetak menawarkan pusat sehenti untuk keperluan perniagaan, acara, barangan promosi, paparan dan pengiklanan, pembungkusan, pelabelan serta visual kreatif.",
    strengths: [
      { title: "20 Tahun Kecemerlangan", desc: "Pengalaman luas membolehkan kami menyelesaikan keperluan percetakan pelanggan dengan yakin." },
      { title: "Pasukan Pakar", desc: "Pasukan khusus membantu anda daripada reka bentuk dan produksi hingga penghantaran." },
      { title: "Pusat Sehenti", desc: "Semua penyelesaian percetakan dan barangan promosi tersedia di satu tempat." },
      { title: "Produk Berkualiti", desc: "Dakwat terang, potongan tepat dan kemasan yang baik menjadi keutamaan kami." },
      { title: "Penghantaran Tepat Masa", desc: "Kami merancang pengeluaran supaya pesanan anda disiapkan mengikut jadual." },
      { title: "Kepuasan Pelanggan", desc: "Kami menghasilkan produk berkualiti yang setimpal dengan pelaburan anda." },
    ],
    missionTitle: "Misi Kami",
    mission: [
      "Menjadi penyedia barangan promosi perniagaan melalui kaedah percetakan.",
      "Menyediakan pelbagai barangan promosi untuk usahawan dan organisasi.",
      "Membantu pertumbuhan perniagaan melalui persembahan visual yang berkesan.",
      "Memperkasa masyarakat dengan pengetahuan dan kemahiran untuk berjaya.",
    ],
    visionTitle: "Visi Kami",
    vision: "Menjadi pilihan utama bagi penyelesaian percetakan bersepadu untuk barangan promosi perniagaan di Malaysia.",
  } : {
    title: "About",
    quote: "We take pride in our work and customer satisfaction is what sets KAMPUNG CETAK apart from the competition.",
    years: "Years Experience",
    clients: "Happy Clients",
    storyTitle: "Our Story",
    story: [
      "Established in 2004, KAMPUNG CETAK is one of the nation's leading printing companies. We are a one-stop center for business promotional item solutions. We provide a wide range of services in the printing industry.",
      "Our passionate team, integrated services, and turnkey solutions are what clients require today. We don't talk about quality. We prove it. Whether you are looking to promote a product or advertise a service, we can help produce an impactful visual presentation that facilitates nationwide business growth.",
    ],
    strengthsTitle: "Our Strengths",
    strengthsIntro: "Kampung Cetak offers a one-stop center for business essentials, events, promotional items, display and advertising, packaging and labeling, and creative visuals.",
    strengths: [
      { title: "20 Years Excellence", desc: "With 20 years of experience, we have the capabilities to resolve customer printing needs." },
      { title: "Expert Team", desc: "A dedicated team supports you from design and production through delivery." },
      { title: "One-Stop Centre", desc: "Printing solutions and promotional products are available in one place." },
      { title: "Quality Product", desc: "Bright inks, precise cuts, and outstanding finishing are our priority." },
      { title: "Timely Delivery", desc: "We plan production carefully to complete your order on schedule." },
      { title: "Customer Satisfaction", desc: "We deliver a quality product that provides value for your investment." },
    ],
    missionTitle: "Our Mission",
    mission: [
      "We are a business promotional item provider through printing methods.",
      "We provide a wide range of promotional items for entrepreneurs and organizations.",
      "We facilitate business growth through impactful visual presentations.",
      "We empower the nation with knowledge and skills to achieve success.",
    ],
    visionTitle: "Our Vision",
    vision: "To be a preferred integrated printing solution for business promotional items in Malaysia.",
  };

  return (
    <main className="flex-grow bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex mb-6">
                <Image
                  src="/images/kampung-cetak-logo.png"
                  alt="Kampung Cetak Logo"
                  width={80}
                  height={80}
                  className="rounded-xl shadow-sm object-contain"
                />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground tracking-tight">
                {copy.title} <span className="text-primary">Kampung Cetak</span>
              </h1>
              <p className="text-muted-foreground text-xl italic mb-8 border-l-4 border-primary pl-4">
                &quot;{copy.quote}&quot;
              </p>
              <div className="flex items-center space-x-8">
                <div>
                  <span className="block md:text-4xl text-2xl font-bold text-foreground">
                    20+
                  </span>
                  <span className="text-muted-foreground font-medium">{copy.years}</span>
                </div>
                <div>
                  <span className="block md:text-4xl text-2xl font-bold text-foreground">
                    10k+
                  </span>
                  <span className="text-muted-foreground font-medium">{copy.clients}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
                alt="Our team at work"
                className="rounded-2xl shadow-2xl object-cover w-full h-[500px]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="order-2 md:order-1 bg-primary/5 flex items-center justify-center p-12 rounded-3xl"
            >
               <Image
                src="/images/kampung-cetak-logo.png"
                alt="Kampung Cetak Printing"
                width={300}
                height={300}
                className="opacity-90 dark:mix-blend-normal mix-blend-multiply"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="order-1 md:order-2"
            >
              <h2 className="text-4xl font-bold text-foreground mb-6">{copy.storyTitle}</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {copy.story[0]}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {copy.story[1]}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values/Strengths Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{copy.strengthsTitle}</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
              {copy.strengthsIntro}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {copy.strengths.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-card text-card-foreground p-8 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow"
              >
                <div className="bg-primary/10 text-primary w-12 h-12 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-8 text-[#D4AF37]">{copy.missionTitle}</h2>
              <ul className="space-y-6">
                {copy.mission.map((text, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-[#D4AF37] font-bold text-xl mr-4">0{i+1}</span>
                    <p className="text-gray-300 text-lg">{text}</p>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col justify-center items-center text-center bg-gray-800 rounded-3xl p-12 border border-gray-700"
            >
              <h2 className="text-4xl font-bold mb-6 text-[#D4AF37]">{copy.visionTitle}</h2>
              <p className="text-2xl text-gray-300 italic font-medium leading-relaxed">
                &quot;{copy.vision}&quot;
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
