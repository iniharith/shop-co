/**
 * Coded by Harith
 * Kampungcetak ®
 * Orbea-clone product detail page — structural replica of Orbea's product-detail layout
 */
"use client";
import { ProductDetails } from "@/components/page-sections/shop/product-details";
import { ProductGallery } from "@/components/page-sections/shop/product-gallery";
import ProductSctions from "@/components/page-sections/home/productSctions";
import React, { useEffect, useRef, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useParams } from "next/navigation";
import ProductDetailSkeleton from "@/components/loading/ProductDetailSkeleton";
import { IProduct } from "@/types/IProduct";
import { useLanguage } from "@/i18n/LanguageProvider";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

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

  // Measure the remaining viewport height below the subnav bar
  const navRef = useRef<HTMLElement>(null);
  const [canvasHeight, setCanvasHeight] = useState<number>(0);

  useEffect(() => {
    const update = () => {
      const navEl = navRef.current;
      if (!navEl) return;
      const navBottom = navEl.getBoundingClientRect().bottom;
      setCanvasHeight(Math.max(400, window.innerHeight - navBottom));
    };
    update();
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(update);
    ro.observe(document.documentElement);
    return () => {
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, [isPending, product]);

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
          {/* ═══ Sticky Subnav Bar — sits below fixed main header ═══ */}
          <nav
            ref={navRef}
            className="sticky z-30 top-0 bg-background/95 backdrop-blur-md border-b border-border grid grid-cols-3 items-center px-4 py-3 lg:px-8 lg:flex transition-all duration-300 shadow-sm"
          >
            {/* Left: back arrow (mobile) */}
            <div className="text-sm lg:hidden">
              {step !== "frame" ? (
                <button onClick={() => setStep(prevStep)} className="flex gap-1 items-center text-foreground">
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  <span className="min-w-0 truncate">{prevStepLabel}</span>
                </button>
              ) : (
                <span />
              )}
            </div>

            {/* Left: product name + change model (desktop) */}
            <div className="hidden lg:flex items-center gap-2 mr-auto">
              <span className="text-base font-semibold text-foreground">{product.name}</span>
              <span className="text-muted-foreground">|</span>
              <Link
                href="/home/shop"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                {label("Change model", "Tukar Produk")}
              </Link>
            </div>

            {/* Center: current step label (mobile) */}
            <span className="font-semibold justify-self-center text-sm lg:hidden">
              {currentStepMeta.button_mobile}
            </span>

            {/* Right: desktop step links */}
            <ul className="hidden lg:flex items-center gap-8 ml-auto">
              {stepLabels.map((s) => (
                <li key={s.key}>
                  <button
                    onClick={() => setStep(s.key)}
                    className={`text-sm font-medium transition-colors underline-offset-4 ${step === s.key ? "text-foreground underline font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>

            {/* Right: mobile next button */}
            <div className="lg:hidden flex justify-end">
              {step !== "summary" && (
                <button onClick={() => setStep(nextStep)} className="flex gap-1 items-center text-foreground">
                  <span className="min-w-0 truncate text-sm">{nextStepLabel}</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              )}
            </div>
          </nav>

          {/* ═══ Two-column product canvas ═══ */}
          <div
            className="product-detail flex flex-col lg:flex-row bg-neutral-950 overflow-hidden"
            style={{ height: canvasHeight > 0 ? `${canvasHeight}px` : "calc(100vh - 130px)" }}
          >
            {/* ── Left: Full-bleed product image (takes remaining space) ── */}
            <div className="relative flex-1 min-w-0 min-h-0 max-lg:h-[45%] overflow-hidden">
              <ProductGallery images={product.images} step={step} />
              {/* Right-edge fade blending into card */}
              <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-neutral-950/60 to-transparent pointer-events-none hidden lg:block" />
            </div>

            {/* ── Right: Configurator panel — fixed width BESIDE the image ── */}
            <div className="shrink-0 w-full lg:w-[380px] xl:w-[420px] h-full flex flex-col bg-background border-t lg:border-t-0 lg:border-l border-border/50 overflow-hidden">
              <ProductDetails
                product={product}
                step={step}
                onStepChange={setStep}
              />
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
