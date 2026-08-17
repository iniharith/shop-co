/**
 * Coded by Harith
 * Kampungcetak ®
 * Orbea-clone product detail page — structural replica of Orbea's product-detail layout
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
    <div className="w-full orbea-product-page">
      {isPending && <ProductDetailSkeleton />}
      {!isPending && product && (
        <>
          {/* ═══ Orbea nav-hero: sticky step nav bar ═══
              Orbea: sticky z-50 top-0 after:absolute after:border-b after:border-border-default
              after:bottom-0 after:inset-x-0 bg-surface-default grid grid-cols-3 items-center
              px-s1000-narrow py-[.625rem] 1024:py-200 1024:flex transition-all duration-300
              Real Orbea left side: "{ProductName} | ← Change model" — chromeless, no global
              site nav visible on top (global header/footer are hidden via .orbea-product-page) */}
          <nav
            className="sticky z-50 top-0 after:absolute after:border-b after:border-border after:bottom-0 after:inset-x-0 bg-background grid grid-cols-3 items-center px-4 py-2.5 lg:px-5 lg:py-2 lg:flex transition-all duration-300"
          >
            {/* Left: back link (desktop) / back arrow (mobile) — Orbea line 1174 */}
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

            {/* Center/left: product name + "Change model" back-to-shop link (desktop)
                — Orbea line 1122: "{name} | ← Change model" */}
            <div className="hidden lg:flex items-center gap-2 mr-auto">
              <span className="text-base font-medium">{product.name}</span>
              <span className="text-muted-foreground">|</span>
              <Link
                href="/home/shop"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                {label("Change model", "Tukar Produk")}
              </Link>
            </div>

            {/* Center: current step label (mobile) — Orbea line 1197 */}
            <span className="font-medium justify-self-center text-[.9375rem] lg:hidden">
              {currentStepMeta.button_mobile}
            </span>

            {/* Right: desktop step links — Orbea line 1135 */}
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

            {/* Right: mobile next button — Orbea line 1198 */}
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

          {/* ═══ Orbea product-detail: full-viewport two-column layout ═══
              Orbea: flex flex-col pt-[var(--header-height)] product-detail relative 1024:flex-row
              CSS: height: calc(100svh - var(--product-nav-height) + var(--header-height))
              .h-top/.h-scrolled: transition: height .3s ease-in-out
              overflow-hidden when not summary
              bg-secondary = the gray canvas Orbea's studio bg-image sits on — this is what
              makes the white sidebar card "float" instead of reading as a flush edge panel */}
          <div
            className="product-detail flex flex-col overflow-hidden relative bg-secondary lg:flex-row"
            style={{ height: "calc(100svh - var(--header-height, 0px))" }}
          >
            {/* ── Left: Image area ──
                Orbea: grow relative 1024:w-[68%] 1280:w-[67.421875%] 1440:w-[70%] 1680:w-[71%] 1920:w-3/4 */}
            <div className="grow relative w-full lg:w-[68%] xl:w-[71%] 2xl:w-3/4 max-lg:h-[48svh]">
              <ProductGallery images={product.images} step={step} />
            </div>

            {/* ── Right: Sidebar ──
                Orbea: h-1/3 shrink-0 transition-[height] z-[2] 1024:h-auto 1024:w-[32%]
                Dynamic: h-[62%] when step !== 'summary'
                orbea-card-gap = Orbea's --s-250-between-cards padding token (.5rem→1.25rem),
                the gap that lets the gray canvas peek around the floating white card */}
            <div className="shrink-0 transition-[height] z-[2] h-[62%] orbea-card-gap max-lg:!p-0 lg:h-auto lg:w-[32%] xl:w-[29%] 2xl:w-1/4">
              {/* ── Grid wrapper (Orbea: <div class="grid h-full">) ── */}
              <div className="grid h-full">
                {/* ── Scrollable aside content (Orbea: #aside-content) ──
                    Orbea: bg-surface-default col-span-full grid no-scrollbar overscroll-contain
                    overflow-y-auto relative row-span-full transition-all 768:rounded-t-none 1280:rounded-lg
                    Dynamic: rounded-t-lg when not summary
                    shadow added to sell the floating-card look on desktop */}
                <div
                  className="bg-background col-span-full grid no-scrollbar overscroll-contain overflow-y-auto relative row-span-full transition-all rounded-t-lg lg:rounded-lg lg:shadow-[0px_0px_12px_0px_rgba(0,0,0,0.08)]"
                >
                  <ProductDetails
                    product={product}
                    step={step}
                    onStepChange={setStep}
                  />
                </div>

                {/* ── CTA portal target (Orbea: #target-bottom) ──
                    Orbea: bottom-0 col-span-full row-span-full bg-surface-default flex flex-col gap-200
                    pointer-events-auto px-400 py-300 rounded-t-lg self-end
                    shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] sticky z-[1]
                    1024:px-300 1024:py-200 1024:relative 1180:py-300
                    1280:w-[calc(100%-16px)] 1280:bottom-3 1280:left-2 1280:rounded-b-lg */}
                <div
                  id="product-cta-portal"
                  className="bottom-0 col-span-full row-span-full bg-background flex flex-col gap-2 pointer-events-auto px-4 py-3 rounded-t-lg self-end shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] sticky z-[1] lg:px-3 lg:py-2 xl:py-3 lg:rounded-b-lg lg:relative"
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
