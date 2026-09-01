/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import Link from "next/link";
import { ProductDetails } from "@/components/page-sections/shop/product-details";
import { ProductGallery } from "@/components/page-sections/shop/product-gallery";
import ProductSctions from "@/components/page-sections/home/productSctions";
import { mockProduct, products } from "@/constants/data";
import React, { useEffect, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useParams } from "next/navigation";
import ProductDetailSkeleton from "@/components/loading/ProductDetailSkeleton";
import { IProduct } from "@/types/IProduct";
import { ProductReviews } from "@/components/global/ProductReviews";
import { WishlistButton } from "@/components/global/WishlistButton";
const page = () => {
  const { id } = useParams();
  const { data, isPending } = useProducts(id as string);
  const { data: productsData, isPending: isProductsPending } = useProducts();
  const [relatedProducts, setRelatedProducts] = useState<IProduct[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState<number | null>(null);
  const product = data?.product as IProduct;
  const products = productsData?.products || [];

  useEffect(() => {
    setSelectedImageIndex(0);
    setSelectedVariationIndex(null);
  }, [id]);

  useEffect(() => {
    setRelatedProducts(products.filter((product) => product._id !== id).reverse().slice(0, 6));
  }, [products, id]);



    
  return (
    <div className="mx-auto w-full max-w-[1480px] px-3 py-4 sm:px-6 sm:py-6 xl:px-8">
      {/* Custom Dynamic Breadcrumbs */}
      <nav className="mb-5 flex items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-border px-1 pb-3 text-xs text-muted-foreground sm:mb-7 sm:text-sm" aria-label="Breadcrumb">
         <Link href="/" className="transition-colors hover:text-primary">Home</Link>
         <span className="text-border">/</span>
         <Link href="/home/shop" className="transition-colors hover:text-primary">Shop</Link>
         {product && (
           <>
              <span className="text-border">/</span>
              <Link href={`/home/shop?category=${product.category}`} className="capitalize transition-colors hover:text-primary">
                {product.category.replace(/-/g, ' ')}
              </Link>
              <span className="text-border">/</span>
              <span className="font-semibold text-foreground">
                {product.name}
              </span>
           </>
         )}
      </nav>
      {isPending && <ProductDetailSkeleton />}
      {!isPending && product && (
        <div className="grid grid-cols-1 items-start gap-5 border-b border-border pb-10 lg:grid-cols-12 xl:gap-8">
          {/* ── LEFT COLUMN: IMAGES & DESCRIPTION ── */}
          <div className="w-full space-y-5 lg:col-span-7 sm:space-y-6">
            <div className="relative rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-sm sm:rounded-3xl sm:p-5">
              <div className="absolute right-5 top-5 z-20">
                {product && <WishlistButton productId={product._id} />}
              </div>
              <ProductGallery
                images={product.images}
                selectedIndex={selectedImageIndex}
                onSelectedIndexChange={setSelectedImageIndex}
              />
            </div>
            
            <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:rounded-3xl sm:p-6">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Product details</span>
              <h2 className="font-sans text-xl font-semibold tracking-tight text-foreground">Product information</h2>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                {product.description || "High quality printing service offering excellent results with vibrant colors and durability. Ideal for professional and personal use."}
              </p>
            </div>
            
            <div id="flyer-pricing-portal"></div>

            {/* ── REVIEWS (inside left column) ── */}
            {product && (
              <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:rounded-3xl sm:p-6">
                <ProductReviews productId={product._id} />
              </div>
            )}
          </div>
          
          {/* ── RIGHT COLUMN: CONFIGURATOR (Sticky) ── */}
          <div className="w-full lg:col-span-5 relative h-full">
            <ProductDetails
              product={product}
              selectedVariationIndex={selectedVariationIndex}
              onSelectedImageChange={setSelectedImageIndex}
              onSelectedVariationChange={(index) => {
                setSelectedVariationIndex(index);
                setSelectedImageIndex(index);
              }}
            />
          </div>
        </div>
      )}

      <ProductSctions isLoading={isProductsPending} title="Related Products" products={relatedProducts} />
    </div>
  );
};

export default page;
