/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useEffect, useState } from "react";

import Hero from "@/components/page-sections/home/hero";
import ProductSctions from "@/components/page-sections/home/productSctions";
import Categorys from "@/components/page-sections/home/categorys";
import Testimonials from "@/components/page-sections/home/testimonials";
import { testimonials } from "@/constants/data";
import { useProducts } from "@/hooks/useProducts";

const features = [
  { icon: "🏷️", title: "Best Price Guarantee", desc: "Lowest prices in Malaysia" },
  { icon: "🚚", title: "Fast Delivery", desc: "48-hour delivery nationwide" },
  { icon: "🎨", title: "Design Services", desc: "Professional design support" },
  { icon: "⭐", title: "Top Quality", desc: "Premium materials & printing" },
];

export default function Home() {
  const { data, isPending } = useProducts();
  const products = data?.products || [];
  const [featuredProducts, setFeaturedProducts] = useState<typeof products>([]);
  const [bestSellerProducts, setBestSellerProducts] = useState<typeof products>([]);

  useEffect(() => {
    const productsByType = new Map<string, typeof products[number]>();
    for (const product of products) {
      const type = String(product.category || product.sections?.[0] || "uncategorized");
      if (!productsByType.has(type)) productsByType.set(type, product);
    }
    const byType = Array.from(productsByType.values());
    setFeaturedProducts([...byType].sort(() => Math.random() - 0.5));
    setBestSellerProducts([...byType].sort(() => Math.random() - 0.5));
  }, [products]);

  return (
    <>
      <Hero />
      {/* Features Bar */}
      <div className="w-full bg-[#101820] text-white py-7 dark:bg-[#0b1116]">
        <div className="md:w-[80%] w-[90%] mx-auto grid md:grid-cols-4 grid-cols-2 gap-4">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="font-bold text-sm">{f.title}</p>
                <p className="text-gray-400 text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ProductSctions
        isLoading={isPending}
        title="Featured Products"
        products={featuredProducts}
      />
      <Categorys />
      <ProductSctions
        isLoading={isPending}
        title="Best Sellers"
        products={bestSellerProducts}
      />
      <Testimonials title="What Our Customers Say" testimonials={testimonials} />
    </>
  );
}
