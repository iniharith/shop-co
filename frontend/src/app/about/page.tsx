"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const AboutPage = () => {
  return (
    <main className="flex-grow bg-gray-50">
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
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 tracking-tight">
                About <span className="text-[#E00000]">Kampung Cetak</span>
              </h1>
              <p className="text-gray-600 text-xl italic mb-8 border-l-4 border-[#E00000] pl-4">
                "We take pride in our work and customer satisfaction is what sets KAMPUNG CETAK apart from the competition."
              </p>
              <div className="flex items-center space-x-8">
                <div>
                  <span className="block md:text-4xl text-2xl font-bold text-gray-900">
                    20+
                  </span>
                  <span className="text-gray-500 font-medium">Years Experience</span>
                </div>
                <div>
                  <span className="block md:text-4xl text-2xl font-bold text-gray-900">
                    10k+
                  </span>
                  <span className="text-gray-500 font-medium">Happy Clients</span>
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
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="order-2 md:order-1 bg-[#E00000]/5 flex items-center justify-center p-12 rounded-3xl"
            >
               <Image
                src="/images/kampung-cetak-logo.png"
                alt="Kampung Cetak Printing"
                width={300}
                height={300}
                className="opacity-90 mix-blend-multiply"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="order-1 md:order-2"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Established in 2004, KAMPUNG CETAK is one of the nation's leading printing companies. We are a one-stop center for business promotional item solutions. We provide a wide range of services in the printing industry.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our passionate team, integrated services, and turnkey solutions are what clients require today. We don't talk about quality. We prove it. We stand behind our commitment to results. Whether you are looking to promote a product or advertise a service, we can help you to design and produce an impactful visual presentation that will reach your audience and facilitate your business growth nationwide.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values/Strengths Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Strengths</h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">
              Kampung Cetak offers a one-stop center for printing solutions to our clients in business essentials, events, promotional items, display & advertising, packaging & labeling, and creative visuals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "20 Years Excellence", desc: "With 20 years of excellent experience, we have sufficient capabilities to resolve customer inquiries." },
              { title: "Expert Team", desc: "Dedicated team to cater to your inquiries up to design, production, and delivery." },
              { title: "One-Stop Centre", desc: "A one-stop center for printing solutions to provide impactful promotional items." },
              { title: "Quality Product", desc: "Quality is our top priority. We provide bright inks, precise cuts, and outstanding finishing." },
              { title: "Timely Delivery", desc: "Customer satisfaction is our priority. We make sure your order is completed on time." },
              { title: "Customer Gratification", desc: "We guarantee a quality product that satisfies your investment." }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="bg-[#E00000]/10 text-[#E00000] w-12 h-12 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
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
              <h2 className="text-4xl font-bold mb-8 text-[#E00000]">Our Mission</h2>
              <ul className="space-y-6">
                {[
                  "We are a business promotional item provider through printing methods.",
                  "We provide a wide-range of business promotional items that focus on entrepreneurs and organizations.",
                  "Our primary responsibility is to facilitate business growth through impactful visual presentations.",
                  "We strive to empower the nation with knowledge and skills to achieve success."
                ].map((text, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-[#E00000] font-bold text-xl mr-4">0{i+1}</span>
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
              <h2 className="text-4xl font-bold mb-6 text-[#E00000]">Our Vision</h2>
              <p className="text-2xl text-gray-300 italic font-medium leading-relaxed">
                "To be a preferred integrated printing solution for business promotional items in Malaysia."
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
