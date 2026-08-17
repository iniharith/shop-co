/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import Link from "next/link";
import { ProductDetails } from "@/components/page-sections/shop/product-details";
import { ProductGallery } from "@/components/page-sections/shop/product-gallery";
import ProductSctions from "@/components/page-sections/home/productSctions";
import React, { useEffect, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useParams } from "next/navigation";
import ProductDetailSkeleton from "@/components/loading/ProductDetailSkeleton";
import { IProduct } from "@/types/IProduct";
import { useLanguage } from "@/i18n/LanguageProvider";
import { ChevronRight } from "lucide-react";

const page = () => {
  const { id } = useParams();
  const { locale } = useLanguage();
  const label = (en: string, ms: string) => locale === "ms" ? ms : en;
  const { data, isPending } = useProducts(id as string);
  const { data: productsData, isPending: isProductsPending } = useProducts();
  const [relatedProducts, setRelatedProducts] = useState<IProduct[]>([]);
  const product = data?.product as IProduct;
  const products = productsData?.products || [];
  useEffect(() => {
    setRelatedProducts(products.filter((product) => product._id !== id).reverse().slice(0, 6));
  }, [products, id]);

  return (
    <div className="w-full">
      {isPending && <ProductDetailSkeleton />}
      {!isPending && product && (
        <>
          {/* ── Orbea-style Two-Column Layout ── */}
          <div className="max-w-[1600px] mx-auto">
            {/* Breadcrumbs */}
            <div className="px-5 md:px-10 lg:px-14 py-3">
              <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">{label("Home", "Utama")}</Link>
                <ChevronRight className="w-3 h-3" />
                <Link href="/home/shop" className="hover:text-foreground transition-colors">{label("Shop", "Kedai")}</Link>
                {product && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <Link href={`/home/shop?category=${product.category}`} className="hover:text-foreground transition-colors capitalize">
                      {product.category.replace(/-/g, ' ')}
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* Main two-column: Image carousel (left) + Configurator (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-start">
              {/* Left: Large Image Carousel — Orbea puts this as 55-60% */}
              <div className="w-full lg:col-span-7 px-5 md:px-10 lg:pl-14 lg:pr-6 lg:sticky lg:top-24">
                <ProductGallery images={product.images} />
              </div>

              {/* Right: Configurator Panel — Orbea puts this as 40-45% */}
              <div className="w-full lg:col-span-5 px-5 md:px-10 lg:pr-14 lg:pl-6 py-6 lg:py-0 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-none">
                <ProductDetails product={product} />
              </div>
            </div>
          </div>

          {/* ── Flyer pricing portal ── */}
          <div id="flyer-pricing-portal" className="max-w-[1600px] mx-auto px-5 md:px-10 lg:px-14" />

          {/* ── Related Products ── */}
          <div className="mt-12 border-t border-border pt-12">
            <ProductSctions isLoading={isProductsPending} title={label("Related Products", "Produk Berkaitan")} products={relatedProducts} />
          </div>
        </>
      )}
    </div>
  );
};

export default page;
