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
    <div className="w-full flex flex-col items-center gap-8 mt-15 py-8 px-6">
      <div className="text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-primary">Kampung Cetak picks</p>
        <h1 className="text-4xl text-center font-bold text-foreground">{title}</h1>
      </div>
      <ProductCarousel products={products} isLoading={isLoading} />
    </div>
  );
};

export default ProductSctions;
