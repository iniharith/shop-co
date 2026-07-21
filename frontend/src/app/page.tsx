/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import Hero from "@/components/page-sections/home/hero";
import ProductSctions from "@/components/page-sections/home/productSctions";
import Categorys from "@/components/page-sections/home/categorys";
import Testimonials from "@/components/page-sections/home/testimonials";
import { testimonials } from "@/constants/data";
import { useProducts } from "@/hooks/useProducts";
import { Palette, ShieldCheck, Sparkles, Truck } from "lucide-react";

const features = [
  { icon: ShieldCheck, title: "Best Price Guarantee", desc: "Lowest prices in Malaysia" },
  { icon: Truck, title: "Fast Delivery", desc: "48-hour delivery nationwide" },
  { icon: Palette, title: "Design Services", desc: "Professional design support" },
  { icon: Sparkles, title: "Top Quality", desc: "Premium materials & printing" },
];

export default function Home() {
  const { data, isPending } = useProducts();
  const products = data?.products || [];

  return (
    <>
      <Hero />
      {/* Features Bar */}
      <div className="glass-panel-strong w-full rounded-none border-x-0 py-6 text-foreground">
        <div className="md:w-[80%] w-[90%] mx-auto grid md:grid-cols-4 grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"><Icon size={19} /></span>
              <div>
                <p className="font-bold text-sm">{title}</p>
                <p className="text-muted-foreground text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ProductSctions
        isLoading={isPending}
        title="Featured Products"
        products={products.slice(0, 5)}
      />
      <Categorys />
      <ProductSctions
        isLoading={isPending}
        title="Best Sellers"
        products={products.slice(5, 10)}
      />
      <Testimonials title="What Our Customers Say" testimonials={testimonials} />
    </>
  );
}
