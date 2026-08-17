/**
 * Coded by Harith
 * Kampungcetak ®
 * Orbea-faithful product detail page
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

const ProductDetailPage = () => {
  const { id } = useParams();
  const { locale } = useLanguage();
  const label = (en: string, ms: string) => locale === "ms" ? ms : en;
  const { data, isPending } = useProducts(id as string);
  const { data: productsData, isPending: isProductsPending } = useProducts();
  const [relatedProducts, setRelatedProducts] = useState<IProduct[]>([]);
  const [step, setStep] = useState<"frame" | "components" | "summary">("frame");
  const product = data?.product as IProduct;
  const products = productsData?.products || [];

  useEffect(() => {
    setRelatedProducts(products.filter((p) => p._id !== id).reverse().slice(0, 6));
  }, [products, id]);

  return (
    <div className="w-full">
      {isPending && <ProductDetailSkeleton />}
      {!isPending && product && (
        <>
          {/* ── Orbea product-detail: full viewport flex container ── */}
          <div className="product-detail flex flex-col lg:flex-row relative overflow-hidden">

            {/* ── Left: Image area (68% on desktop) ── */}
            <div className="grow relative w-full lg:w-[68%] xl:w-[70%] 2xl:w-3/4 touch-none">
              {/* Breadcrumbs (overlay top-left) */}
              <div className="absolute top-0 left-0 right-0 z-10 px-5 lg:px-8 py-3">
                <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Link href="/" className="hover:text-foreground transition-colors duration-150">{label("Home", "Utama")}</Link>
                  <ChevronRight className="w-3 h-3" />
                  <Link href="/home/shop" className="hover:text-foreground transition-colors duration-150">{label("Shop", "Kedai")}</Link>
                  {product && (
                    <>
                      <ChevronRight className="w-3 h-3" />
                      <Link href={`/home/shop?category=${product.category}`} className="hover:text-foreground transition-colors duration-150 capitalize">
                        {product.category.replace(/-/g, ' ')}
                      </Link>
                    </>
                  )}
                </nav>
              </div>

              {/* Image carousel fills entire left side */}
              <ProductGallery images={product.images} step={step} />
            </div>

            {/* ── Right: Sidebar / Configurator (32% on desktop) ── */}
            <div className="h-[62%] lg:h-auto lg:w-[32%] xl:w-[30%] 2xl:w-1/4 shrink-0 z-[2] transition-[height] duration-300 ease-in-out">
              <div className="bg-background h-full grid lg:rounded-lg overflow-y-auto overscroll-contain">
                <div className="col-span-full row-span-full">
                  <ProductDetails
                    product={product}
                    step={step}
                    onStepChange={setStep}
                  />
                </div>
              </div>
            </div>
          </div>

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

export default ProductDetailPage;
