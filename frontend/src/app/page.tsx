"use client";

import Hero from "@/components/page-sections/home/hero";
import Marque from "@/components/page-sections/home/marque";
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

  return (
    <>
      <Hero />
      {/* Features Bar */}
      <div className="w-full bg-black text-white py-6">
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
      <Marque />
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