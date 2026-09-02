/**
 * Coded by Harith
 * Kampungcetak ®
 */
import React from "react";
import ProductCarousel from "../../global/product-carousel";
import { IProduct } from "@/types";

interface ProductSctionsProps {
  title: string;
  products: IProduct[];
  isLoading: boolean;
}

const ProductSctions = ({ title, products, isLoading }: ProductSctionsProps) => {
  return (
    <section id={title === "Featured Products" ? "featured-section" : undefined} className={`w-full flex flex-col items-center gap-6 py-12 px-4 sm:px-6 ${title === "Featured Products" ? "bg-[#101820] dark:bg-[#0b1116]" : "bg-background"}`}>
      <div className="flex w-full max-w-[1480px] items-end justify-between gap-4 px-1">
        <h1 className={`text-3xl text-left font-bold tracking-tight sm:text-4xl ${title === "Featured Products" ? "text-white" : "text-foreground"}`}>{title}</h1>
        <span className={`hidden text-xs font-semibold uppercase tracking-[0.18em] sm:inline ${title === "Featured Products" ? "text-white/60" : "text-muted-foreground"}`}>Curated selection</span>
      </div>
      <ProductCarousel products={products} isLoading={isLoading} />
    </section>
  );
};

export default ProductSctions;
