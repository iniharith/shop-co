/**
 * Coded by Harith
 * Kampungcetak ®
 * Orbea-clone product detail page: nav-hero bar + two-column flex layout
 */
"use client";
import { ProductDetails } from "@/components/page-sections/shop/product-details";
import { ProductGallery } from "@/components/page-sections/shop/product-gallery";
import ProductSctions from "@/components/page-sections/home/productSctions";
import React, { useEffect, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useParams } from "next/navigation";
import ProductDetailSkeleton from "@/components/loading/ProductDetailSkeleton";
import { IProduct } from "@/types/IProduct";
import { useLanguage } from "@/i18n/LanguageProvider";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Step = "frame" | "components" | "summary";

const ProductDetailPage = () => {
  const { id } = useParams();
  const { locale } = useLanguage();
  const label = (en: string, ms: string) => (locale === "ms" ? ms : en);
  const { data, isPending } = useProducts(id as string);
  const { data: productsData, isPending: isProductsPending } = useProducts();
  const [relatedProducts, setRelatedProducts] = useState<IProduct[]>([]);
  const [step, setStep] = useState<Step>("frame");
  const product = data?.product as IProduct;
  const products = productsData?.products || [];

  useEffect(() => {
    setRelatedProducts(
      products.filter((p) => p._id !== id).reverse().slice(0, 6)
    );
  }, [products, id]);

  const stepLabels: { key: Step; label: string; button: string; button_mobile: string }[] = [
    { key: "frame", label: label("Frame", "Bingkai"), button: label("Configure Options", "Konfigurasi Pilihan"), button_mobile: label("Frame", "Bingkai") },
    { key: "components", label: label("Options", "Pilihan"), button: label("View Summary", "Lihat Ringkasan"), button_mobile: label("Options", "Pilihan") },
    { key: "summary", label: label("Summary", "Ringkasan"), button: label("Add to Cart", "Tambah ke Troli"), button_mobile: label("Summary", "Ringkasan") },
  ];
  const currentStepMeta = stepLabels.find((s) => s.key === step)!;
  const prevStep: Step = step === "components" ? "frame" : step === "summary" ? "components" : "frame";
  const nextStep: Step = step === "frame" ? "components" : step === "components" ? "summary" : "summary";
  const prevStepLabel = stepLabels.find((s) => s.key === prevStep)?.button_mobile || "";
  const nextStepLabel = stepLabels.find((s) => s.key === nextStep)?.button_mobile || "";

  return (
    <div className="w-full">
      {isPending && <ProductDetailSkeleton />}
      {!isPending && product && (
        <>
          {/* ═══ Orbea nav-hero: sticky step nav bar ═══ */}
          <nav
            className="sticky z-50 top-0 after:absolute after:border-b after:border-border after:bottom-0 after:inset-x-0 bg-background grid grid-cols-3 items-center px-4 py-2.5 lg:px-5 lg:py-2 transition-all duration-300"
          >
            {/* Left: back link (desktop) / back arrow (mobile) */}
            <div className="text-sm lg:hidden">
              {step !== "frame" ? (
                <button
                  onClick={() => setStep(prevStep)}
                  className="flex gap-1 items-center"
                >
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  <span className="min-w-0 truncate">{prevStepLabel}</span>
                </button>
              ) : (
                <span />
              )}
            </div>

            {/* Center: product name (desktop) / current step label (mobile) */}
            <h1 className="hidden lg:flex items-center after:content-['|'] after:mx-2 after:text-base after:font-sans">
              <span className="text-base font-medium">{product.name}</span>
            </h1>
            <span className="font-medium justify-self-center text-[.9375rem] lg:hidden">
              {currentStepMeta.button_mobile}
            </span>

            {/* Right: desktop step links / mobile next button */}
            <ul className="hidden lg:flex items-center gap-6 ml-auto">
              {stepLabels.map((s) => (
                <li key={s.key}>
                  <button
                    onClick={() => setStep(s.key)}
                    className={`body-l transition-colors underline-offset-4 hover:text-foreground ${step === s.key ? "text-foreground underline" : "text-muted-foreground"}`}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="lg:hidden">
              {step !== "summary" && (
                <button
                  onClick={() => setStep(nextStep)}
                  className="flex gap-1 items-center justify-self-end max-w-full"
                >
                  <span className="min-w-0 truncate">{nextStepLabel}</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              )}
            </div>
          </nav>

          {/* ═══ Orbea product-detail: full-viewport two-column flex ═══ */}
          <div
            className="product-detail flex flex-col lg:flex-row relative"
            style={{ height: "calc(100svh - var(--header-height, 70px))" }}
          >
            {/* ── Left: Image area (Orbea: grow, 68-75% responsive) ── */}
            <div className="grow relative w-full lg:w-[68%] xl:w-[71%] 2xl:w-3/4 max-lg:h-[48svh]">
              <ProductGallery images={product.images} step={step} />
            </div>

            {/* ── Right: Sidebar (Orbea: shrink-0, 32-25% responsive) ── */}
            <div className="h-[62%] lg:h-auto lg:w-[32%] xl:w-[29%] 2xl:w-1/4 shrink-0 z-[2]">
              <div className="bg-background h-full grid lg:rounded-lg no-scrollbar overscroll-contain overflow-y-auto relative row-span-full transition-all">
                <ProductDetails
                  product={product}
                  step={step}
                  onStepChange={setStep}
                />
              </div>
            </div>
          </div>

          <div id="flyer-pricing-portal" />

          {/* ── Related Products ── */}
          <div className="mt-12 border-t border-border pt-12">
            <ProductSctions
              isLoading={isProductsPending}
              title={label("Related Products", "Produk Berkaitan")}
              products={relatedProducts}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ProductDetailPage;
