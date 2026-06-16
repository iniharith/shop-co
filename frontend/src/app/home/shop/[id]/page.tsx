"use client";
import { Breadcrumbs } from "@/components/global/breadcrumb";
import { ProductDetails } from "@/components/page-sections/shop/product-details";
import { ProductGallery } from "@/components/page-sections/shop/product-gallery";
import ProductSctions from "@/components/page-sections/home/productSctions";
import { mockProduct, products } from "@/constants/data";
import React, { useEffect, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useParams } from "next/navigation";
import ProductDetailSkeleton from "@/components/loading/ProductDetailSkeleton";
import { IProduct } from "@/types/IProduct";
const page = () => {
  const { id } = useParams();
  const { data, isPending } = useProducts(id as string);
  const { data: productsData, isPending: isProductsPending } = useProducts();
  const [relatedProducts, setRelatedProducts] = useState<IProduct[]>([]);
  const product = data?.product as IProduct;
  const products = productsData?.products || [];
  useEffect(() => {
    setRelatedProducts(products.filter((product) => product._id !== id).reverse().slice(0, 6));
  }, [products, id]);



    
  return (
    <div className="w-full py-5 md:px-10 px-5 max-w-[1400px] mx-auto">
      <Breadcrumbs />
      {isPending && <ProductDetailSkeleton />}
      {!isPending && product && (
        <div className="grid border-b border-gray-200 pb-10 grid-cols-1 mt-6 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT COLUMN: IMAGES & DESCRIPTION ── */}
          <div className="w-full lg:col-span-7 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <ProductGallery images={product.images} />
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-primary">Product Information</h2>
              <div className="w-full h-px bg-gray-200"></div>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                {product.description || "High quality printing service offering excellent results with vibrant colors and durability. Ideal for professional and personal use."}
              </p>
            </div>
          </div>
          
          {/* ── RIGHT COLUMN: CONFIGURATOR (Sticky) ── */}
          <div className="w-full lg:col-span-5 relative h-full">
            <ProductDetails product={product} />
          </div>
        </div>
      )}

      <ProductSctions isLoading={isProductsPending} title="Related Products" products={relatedProducts} />
    </div>
  );
};

export default page;
