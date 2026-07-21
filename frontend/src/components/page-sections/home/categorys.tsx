/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { useRouter } from "nextjs-toploader/app";
import React from "react";
import { printingCategories } from "@/constants";
import { Files, Flag, Frame, Gift, Heart, Package, Printer, Shirt, Tag } from "lucide-react";

// Define some mapping for icons and colors based on the category name
const categoryStyles: Record<string, { icon: typeof Printer; color: string }> = {
  "DIGITAL PRINTING": { icon: Printer, color: "text-blue-400" },
  "DISPLAY ITEM": { icon: Flag, color: "text-rose-400" },
  "DIGITAL OFFSET": { icon: Files, color: "text-amber-400" },
  "PREMIUM GIFT": { icon: Gift, color: "text-emerald-400" },
  "APPAREL": { icon: Shirt, color: "text-violet-400" },
  "FRAME": { icon: Frame, color: "text-orange-400" },
  "WEDDING PRODUCT": { icon: Heart, color: "text-pink-400" },
  "FOOD PACKAGING": { icon: Package, color: "text-cyan-400" },
};

const Categorys = () => {
  const router = useRouter();

  return (
    <div className="w-full py-20 grid place-items-center border-y border-white/10">
      <div className="md:w-[80%] w-[90%]">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold dark:text-foreground">Explore Our Products</h1>
          <p className="text-gray-500 dark:text-muted-foreground mt-2">Discover a wide range of premium printing services delivered across Malaysia</p>
        </div>
        <div className="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-2 gap-4">
          {printingCategories.map((category, index) => {
            const style = categoryStyles[category.label] || { icon: Tag, color: "text-primary" };
            const Icon = style.icon;
            return (
              <div
                key={index}
                className="glass-panel group cursor-pointer transition-all duration-300 rounded-3xl p-5 flex flex-col gap-3 hover:-translate-y-1 hover:border-primary/30"
                onClick={() => router.push(category.href)}
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ${style.color}`}><Icon size={24} /></span>
                <h2 className="font-bold text-sm dark:text-foreground">{category.label}</h2>
                <p className="text-gray-500 dark:text-muted-foreground text-xs leading-relaxed z-10 relative">
                  {category.subItems?.slice(0, 3).map((s, i) => (
                    <span key={i}>
                      <span 
                        onClick={(e) => { e.stopPropagation(); router.push(s.href); }}
                        className="hover:text-primary hover:underline transition-colors"
                      >
                        {s.label}
                      </span>
                      {i < 2 && category.subItems && category.subItems.length > 1 ? ", " : ""}
                    </span>
                  ))}
                  {category.subItems && category.subItems.length > 3 ? ", and more." : "."}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Categorys;
