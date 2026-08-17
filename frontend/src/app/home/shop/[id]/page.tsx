/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import Link from "next/link";
import { ProductDetails } from "@/components/page-sections/shop/product-details";
import { ProductGallery } from "@/components/page-sections/shop/product-gallery";
import ProductHero from "@/components/page-sections/shop/ProductHero";
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
      {/* ── Minimal Breadcrumbs ── */}
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-4">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">{label("Home", "Utama")}</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/home/shop" className="hover:text-primary transition-colors">{label("Shop", "Kedai")}</Link>
          {product && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/home/shop?category=${product.category}`} className="hover:text-primary transition-colors capitalize">
                {product.category.replace(/-/g, ' ')}
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium truncate max-w-[200px] md:max-w-[400px]">{product.name}</span>
            </>
          )}
        </nav>
      </div>

      {isPending && <ProductDetailSkeleton />}
      {!isPending && product && (
        <>
          {/* ── Full-width Hero Image ── */}
          <div className="max-w-[1400px] mx-auto px-5 md:px-10 mb-8">
            <ProductHero images={product.images} alt={product.name} />
          </div>

          {/* ── Two-column: Gallery + Configurator ── */}
          <div className="max-w-[1400px] mx-auto px-5 md:px-10 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left: Gallery (sticky) */}
              <div className="w-full lg:col-span-5 lg:sticky lg:top-28">
                <ProductGallery images={product.images} />
              </div>

              {/* Right: Configurator */}
              <div className="w-full lg:col-span-7">
                <ProductDetails product={product} />
              </div>
            </div>

            <div id="flyer-pricing-portal"></div>
          </div>

          {/* ── Related Products ── */}
          <ProductSctions isLoading={isProductsPending} title={label("Related Products", "Produk Berkaitan")} products={relatedProducts} />
        </>
      )}
    </div>
  );
};

export default page;
