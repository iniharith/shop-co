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
    <section className="grid w-full place-items-center border-y border-border bg-muted/35 py-16 sm:py-24">
      <div className="w-[calc(100%-2rem)] max-w-[1480px] sm:w-[calc(100%-4rem)]">
        <div className="mb-10 max-w-2xl sm:mb-14">
          <p className="store-eyebrow mb-3">What we make</p>
          <h2 className="store-page-title text-3xl font-semibold sm:text-5xl">Explore our print services</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">From everyday business essentials to custom pieces made for a single moment.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {printingCategories.map((category, index) => {
            const img = bannerImages[category.label];
            return (
              <div
                key={index}
                className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-[1.15rem] border border-white/10 bg-neutral-900 shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl"
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
                  <h3 className="text-base font-semibold text-white drop-shadow-md">{category.label}</h3>
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
    </section>
  );
};

export default Categorys;
