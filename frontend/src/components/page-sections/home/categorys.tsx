/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { useRouter } from "nextjs-toploader/app";
import React from "react";
import Image from "next/image";
import { printingCategories } from "@/constants";

const bannerImages: Record<string, string> = {
  "DIGITAL PRINTING": "/images/banner-digital-printing.jpg",
  "DISPLAY ITEM": "/images/banner-display-item.jpg",
  "DIGITAL OFFSET": "/images/banner-digital-offset.jpg",
  "PREMIUM GIFT": "/images/banner-premium-gift.jpg",
  "APPAREL": "/images/banner-apparel.jpg",
  "FRAME": "/images/banner-frame.jpg",
  "WEDDING PRODUCT": "/images/banner-wedding-product.jpg",
  "FOOD PACKAGING": "/images/banner-food-packaging.jpg",
};

const Categorys = () => {
  const router = useRouter();

  return (
    <div className="w-full py-16 grid place-items-center bg-gray-50 dark:bg-background border-y border-gray-200 dark:border-border">
      <div className="md:w-[80%] w-[90%]">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold dark:text-foreground">Explore Our Products</h1>
          <p className="text-gray-500 dark:text-muted-foreground mt-2">Discover a wide range of premium printing services delivered across Malaysia</p>
        </div>
        <div className="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-2 gap-4">
          {printingCategories.map((category, index) => {
            const img = bannerImages[category.label];
            return (
              <div
                key={index}
                className="relative group cursor-pointer hover:scale-[1.02] transition-all duration-300 rounded-xl overflow-hidden aspect-[16/9] hover:shadow-xl"
                onClick={() => router.push(category.href)}
              >
                {img && (
                  <Image
                    src={img}
                    alt={category.label}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, 25vw"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-1">
                  <h2 className="font-bold text-sm text-white drop-shadow-md">{category.label}</h2>
                  <p className="text-white/70 text-xs leading-relaxed">
                    {category.subItems?.slice(0, 3).map((s, i) => (
                      <span key={i}>
                        <span
                          onClick={(e) => { e.stopPropagation(); router.push(s.href); }}
                          className="hover:text-white hover:underline transition-colors cursor-pointer"
                        >
                          {s.label}
                        </span>
                        {i < 2 && category.subItems && category.subItems.length > 1 ? ", " : ""}
                      </span>
                    ))}
                    {category.subItems && category.subItems.length > 3 ? ", and more." : "."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Categorys;
