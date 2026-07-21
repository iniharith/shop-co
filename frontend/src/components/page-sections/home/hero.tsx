/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { Button } from "@heroui/button";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { item_variants } from "@/constants/framer-motion";
import { useRouter } from "nextjs-toploader/app";
import { Truck } from "lucide-react";

const images = [
  "https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80",
  "https://images.pexels.com/photos/1109541/pexels-photo-1109541.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80",
  "https://images.pexels.com/photos/6275/black-and-white-business-desk-computer.jpg?auto=compress&cs=tinysrgb&w=1920&q=80"
];

const Hero = () => {
  const router = useRouter();
  const text = "AFFORDABLE PRINTING SERVICES IN MALAYSIA";
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full min-h-[680px] flex items-center justify-center overflow-hidden bg-black px-3 py-12 md:px-8">
      {/* Background Slider */}
      <AnimatePresence mode="popLayout">
        <motion.img
          key={currentImage}
          src={images[currentImage]}
          alt="Printing Background"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.5, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/45 to-primary/15" />

      {/* Content Container */}
      <div className="glass-panel relative z-10 flex w-full max-w-6xl flex-col items-center justify-center gap-6 rounded-[2rem] px-5 py-10 text-center md:px-20 md:py-14">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={item_variants}
          className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary"
        >
          <Truck size={15} /> Fast & On-Time Delivery
        </motion.div>

        <motion.h1
          className="text-4xl md:text-5xl lg:text-7xl font-extrabold leading-tight text-white drop-shadow-xl"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
        >
          {text.split(" ").map((word, idx) => (
            <motion.span key={idx} className="inline-block mr-2 md:mr-3" variants={item_variants}>
              {word}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={item_variants}
          className="text-gray-200 md:text-lg text-sm max-w-2xl drop-shadow-md"
        >
          High-quality printing for business cards, flyers, stickers, banners and more.
          Fast delivery across Malaysia with best price guarantee.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={item_variants}
          className="flex gap-4 mt-4 flex-wrap justify-center"
        >
          <Button
            onClick={() => router.push("/home/shop")}
            className="bg-primary text-primary-foreground font-bold px-10 py-6 rounded-full cursor-pointer active:scale-95 transition-all duration-300 text-lg shadow-xl shadow-primary/20"
          >
            Order Now
          </Button>
          <Button
            onClick={() => router.push("/home/shop")}
            className="glass-subtle border-white/20 text-white font-bold px-10 py-6 rounded-full cursor-pointer active:scale-95 transition-all duration-300 text-lg hover:border-primary/50 hover:text-primary"
          >
            View Products
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="flex gap-8 md:gap-16 items-center mt-6 justify-center flex-wrap pt-8 border-t border-white/10 w-full max-w-3xl">
          {[
            { count: "50+", label: "Print Products" },
            { count: "10K+", label: "Happy Customers" },
            { count: "48hr", label: "Fast Delivery" },
          ].map((item, index) => (
            <div key={index} className="flex flex-col gap-1 items-center">
              <p className="font-bold text-3xl md:text-4xl text-white">{item.count}</p>
              <p className="text-gray-300 text-sm font-medium tracking-wide uppercase">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Slider Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentImage(idx)}
            className={`transition-all duration-300 rounded-full ${
              currentImage === idx ? "w-8 h-2 bg-primary" : "w-2 h-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Hero;
