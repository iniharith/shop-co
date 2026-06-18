import React from "react";
import ProductCarousel from "../../global/product-carousel";
import { IProduct } from "@/types";
import Link from "next/link";
import { Button } from "@heroui/button";

interface ProductSctionsProps {
  title: string;
  products: IProduct[];
  isLoading: boolean;
}

const ProductSctions = ({ title, products, isLoading }: ProductSctionsProps) => {
  return (
    <div className="w-full flex flex-col items-center gap-6 mt-15 py-5 px-6">
      <h1 className="text-4xl text-center font-bold text-gray-900 dark:text-foreground">{title}</h1>
      <ProductCarousel products={products} isLoading={isLoading} />
      <Button 
        as={Link} 
        href="/home/shop"
        className="mt-2 bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all font-semibold px-8 py-2 rounded-full"
      >
        View All Products
      </Button>
    </div>
  );
};

export default ProductSctions;
