"use client";
import { Button } from "@heroui/button";
import React from "react";
import { motion } from "framer-motion";
import { item_variants } from "@/constants/framer-motion";
import { useRouter } from "nextjs-toploader/app";

const Hero = () => {
  const router = useRouter();
  const text = "AFFORDABLE PRINTING SERVICES IN MALAYSIA";
  return (
    <div className="relative grid md:grid-cols-2 w-full bg-[#F2F0F1] min-h-[500px]">
      <div className="flex md:py-0 py-10 flex-col gap-4 items-start px-5 md:px-20 justify-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={item_variants}
          className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-semibold"
        >
          🚀 Fast & On-Time Delivery
        </motion.div>
        <motion.h1
          className="text-4xl md:text-4xl lg:text-6xl font-bold leading-tight"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          {text.split(" ").map((word, idx) => (
            <motion.span
              key={idx}
              className="inline-block mr-2"
              variants={item_variants}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>
        <motion.p
          initial="hidden"
          animate="visible"
          variants={item_variants}
          className="text-gray-500 md:text-base text-sm w-[90%]"
        >
          High-quality printing for business cards, flyers, stickers, banners and more.
          Fast delivery across Malaysia with best price guarantee.
        </motion.p>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={item_variants}
          className="flex gap-3 flex-wrap"
        >
          <Button
            onClick={() => router.push("/home/shop")}
            className="bg-black text-white px-7 rounded-full cursor-pointer active:scale-95 transition-all duration-300"
          >
            Order Now
          </Button>
          <Button
            onClick={() => router.push("/home/shop")}
            className="bg-white border border-black text-black px-7 rounded-full cursor-pointer active:scale-95 transition-all duration-300"
          >
            View Products
          </Button>
        </motion.div>
        <div className="flex gap-8 items-start mt-6 justify-center flex-wrap">
          {[
            { count: "50+", label: "Print Products" },
            { count: "10K+", label: "Happy Customers" },
            { count: "48hr", label: "Fast Delivery" },
          ].map((item, index) => (
            <div key={index} className="flex flex-col gap-1">
              <p className="font-bold text-2xl md:text-4xl">{item.count}</p>
              <p className="text-gray-500 text-sm">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex relative items-center justify-end md:px-10 px-0">
        <div className="w-full h-full overflow-hidden min-h-[300px]">
          <img
            src="/images/hero.jpeg"
            alt="printing services"
            className="w-full object-cover h-full"
          />
          <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-4 flex flex-col gap-1">
            <p className="font-bold text-sm">⭐ Best Price Guarantee</p>
            <p className="text-gray-500 text-xs">Lowest price in Malaysia</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;