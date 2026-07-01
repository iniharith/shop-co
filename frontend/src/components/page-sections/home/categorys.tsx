/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { useRouter } from "nextjs-toploader/app";
import React from "react";
import { printingCategories } from "@/constants";

// Define some mapping for icons and colors based on the category name
const categoryStyles: Record<string, { icon: string; color: string }> = {
  "DIGITAL PRINTING": { icon: "🖨️", color: "bg-blue-50 dark:bg-blue-900/20" },
  "DISPLAY ITEM": { icon: "🚩", color: "bg-red-50 dark:bg-red-900/20" },
  "DIGITAL OFFSET": { icon: "📄", color: "bg-yellow-50 dark:bg-yellow-900/20" },
  "PREMIUM GIFT": { icon: "🎁", color: "bg-green-50 dark:bg-green-900/20" },
  "APPAREL": { icon: "👕", color: "bg-purple-50 dark:bg-purple-900/20" },
  "FRAME": { icon: "🖼️", color: "bg-orange-50 dark:bg-orange-900/20" },
  "WEDDING PRODUCT": { icon: "💍", color: "bg-pink-50 dark:bg-pink-900/20" },
  "FOOD PACKAGING": { icon: "🍔", color: "bg-teal-50 dark:bg-teal-900/20" },
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
            const style = categoryStyles[category.label] || { icon: "🏷️", color: "bg-gray-50 dark:bg-card" };
            return (
              <div
                key={index}
                className={`${style.color} cursor-pointer hover:scale-95 transition-all duration-300 rounded-xl p-5 flex flex-col gap-2 border border-transparent dark:border-border/50 hover:shadow-lg`}
                onClick={() => router.push(category.href)}
              >
                <span className="text-4xl drop-shadow-sm">{style.icon}</span>
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