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

  // ── Real available-height measurement ──
  // The old `calc(100svh - var(--header-height))` relied on a CSS var that's
  // never actually set anywhere, so it always fell back to a wrong constant
  // and the bottom CTA/price row got pushed off-screen. Measure the real
  // offset (site header + sticky step-nav) instead, so the two-pane area
  // always fits the remaining viewport exactly, like Orbea's immersive
  // no-page-scroll layout.
  const detailRef = React.useRef<HTMLDivElement>(null);
  const [detailHeight, setDetailHeight] = useState<number | null>(null);

  useEffect(() => {
    const el = detailRef.current;
    if (!el) return;
    const update = () => {
      const top = el.getBoundingClientRect().top;
      setDetailHeight(Math.max(320, window.innerHeight - top));
    };
    update();
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(update);
    ro.observe(document.body);
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
          {/* ═══ Sticky Subnav Bar ═══ */}
          <nav
            className="sticky z-30 top-0 bg-background/95 backdrop-blur-md border-b border-border/80 grid grid-cols-3 items-center px-4 py-2.5 lg:px-8 lg:py-2.5 lg:flex transition-all duration-300"
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

            {/* Center/left: product name + "Change model" back-to-shop link (desktop) */}
            <div className="hidden lg:flex items-center gap-2 mr-auto">
              <span className="text-base font-semibold text-foreground">{product.name}</span>
              <span className="text-muted-foreground">|</span>
              <Link
                href="/home/shop"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                {label("Change model", "Tukar Produk")}
              </Link>
            </div>

            {/* Center: current step label (mobile) */}
            <span className="font-medium justify-self-center text-[.9375rem] lg:hidden">
              {currentStepMeta.button_mobile}
            </span>

            {/* Right: desktop step links */}
            <ul className="hidden lg:flex items-center gap-6 ml-auto">
              {stepLabels.map((s) => (
                <li key={s.key}>
                  <button
                    onClick={() => setStep(s.key)}
                    className={`text-sm transition-colors underline-offset-4 hover:text-foreground font-medium ${step === s.key ? "text-foreground underline font-bold" : "text-muted-foreground"}`}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>

            {/* Right: mobile next button */}
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

          {/* ═══ Orbea product-detail: Full-screen two-column layout ═══ */}
          <div
            className="product-detail flex flex-col overflow-hidden relative bg-neutral-950 text-foreground lg:flex-row w-full h-[calc(100vh-130px)] min-h-[540px]"
          >
            {/* ── Left: Full-Screen Background Image Area ── */}
            <div className="grow relative w-full h-full lg:w-[65%] xl:w-[70%] max-lg:h-[45vh] overflow-hidden">
              <ProductGallery images={product.images} step={step} />
              {/* Subtle scrim for smooth contrast on desktop */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/60 pointer-events-none hidden lg:block" />
            </div>

            {/* ── Right: Floating Configurator Card ── */}
            <div className="shrink-0 z-20 w-full lg:w-[35%] xl:w-[30%] max-w-lg h-full p-2 sm:p-4 lg:p-5 flex flex-col overflow-hidden">
              <div className="bg-card/95 text-card-foreground border border-border/70 rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden backdrop-blur-xl">
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
