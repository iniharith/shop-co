/**
 * Coded by Harith
 * Kampungcetak ®
 */
import React from "react";
import ProductCarousel from "../../global/product-carousel";
import ProductDepthCarousel from "../../global/product-depth-carousel";
import { IProduct } from "@/types";

interface ProductSctionsProps {
  title: string;
  products: IProduct[];
  isLoading: boolean;
  variant?: "carousel" | "depth";
}

const ProductSctions = ({
  title,
  products,
  isLoading,
  variant = "carousel",
}: ProductSctionsProps) => {
  return (
    <section id={title === "Featured Products" ? "featured-section" : undefined} className="flex w-full flex-col items-center gap-8 border-b border-border bg-background px-4 py-16 sm:px-8 sm:py-24">
      <div className="flex w-full max-w-[1480px] items-end justify-between gap-4 px-1">
        <div><p className="store-eyebrow mb-3">Selected for you</p><h2 className="store-page-title text-left text-3xl font-semibold sm:text-5xl">{title}</h2></div>
        <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:inline">Curated selection</span>
      </div>
      {variant === "depth" ? (
        <ProductDepthCarousel products={products} isLoading={isLoading} />
      ) : (
        <ProductCarousel products={products} isLoading={isLoading} />
      )}
    </section>
  );
};

export default ProductSctions;
