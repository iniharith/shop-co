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
  { number: "01", title: "Clear pricing", desc: "Straightforward quotes with no hidden surprises" },
  { number: "02", title: "Reliable turnaround", desc: "Production timelines you can plan around" },
  { number: "03", title: "Design support", desc: "Real people ready to check and refine your artwork" },
  { number: "04", title: "Made to last", desc: "Materials selected for colour, finish and durability" },
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
      <section className="border-b border-border bg-background py-8 sm:py-10" aria-label="Why Kampung Cetak">
        <div className="mx-auto grid w-full max-w-[1480px] grid-cols-1 gap-0 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {features.map((f, i) => (
            <div key={i} className="flex gap-4 border-b border-border py-5 last:border-b-0 sm:border-r sm:px-6 sm:last:border-r-0 lg:border-b-0">
              <span className="font-mono text-xs font-semibold text-primary">{f.number}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{f.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
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
