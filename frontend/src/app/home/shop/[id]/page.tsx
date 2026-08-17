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
import { cn } from "@/lib/utils";

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
          {/* ═══ Orbea Subnav Bar — sits cleanly below fixed header ═══ */}
          <nav
            ref={navRef}
            className="sticky z-30 top-0 bg-background/95 backdrop-blur-md border-b border-border/80 grid grid-cols-3 items-center px-4 py-3 lg:px-8 lg:flex transition-all duration-200"
          >
            {/* Left: back arrow (mobile) / Change model (desktop) */}
            <div className="text-sm lg:hidden">
              {step !== "frame" ? (
                <button type="button" onClick={() => setStep(prevStep)} className="flex gap-1.5 items-center text-foreground font-medium">
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  <span className="min-w-0 truncate text-xs">{prevStepLabel}</span>
                </button>
              ) : (
                <span />
              )}
            </div>

            {/* Left: Product Name + Change model link (desktop) */}
            <div className="hidden lg:flex items-center gap-3 mr-auto">
              <span className="text-base font-bold text-foreground">{product.name}</span>
              <span className="text-muted-foreground/60">|</span>
              <Link
                href="/home/shop"
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>{label("Change model", "Tukar Produk")}</span>
              </Link>
            </div>

            {/* Center: current step label (mobile) */}
            <span className="font-bold justify-self-center text-sm lg:hidden text-foreground">
              {currentStepMeta.button_mobile}
            </span>

            {/* Right: desktop step links */}
            <ul className="hidden lg:flex items-center gap-8 ml-auto">
              {stepLabels.map((s) => (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => setStep(s.key)}
                    className={cn(
                      "text-sm font-medium transition-all duration-150 relative py-1 cursor-pointer",
                      step === s.key
                        ? "text-foreground font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>

            {/* Right: mobile next button */}
            <div className="lg:hidden flex justify-end">
              {step !== "summary" && (
                <button type="button" onClick={() => setStep(nextStep)} className="flex gap-1 items-center text-foreground font-medium">
                  <span className="min-w-0 truncate text-xs">{nextStepLabel}</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              )}
            </div>
          </nav>

          {/* ═══ Orbea Canvas: Full-bleed product image with floating spec card ═══ */}
          <div
            className="product-detail relative overflow-hidden w-full bg-[#f6f6f8] dark:bg-neutral-950 flex flex-col lg:block"
            style={{
              height: canvasHeight > 0 ? `${canvasHeight}px` : "calc(100vh - 180px)",
              minHeight: "560px",
            }}
          >
            {/* ── Background Image Layer ── */}
            <div className="relative w-full h-[45vh] lg:absolute lg:inset-0 lg:h-full flex items-center justify-center">
              <ProductGallery images={product.images} step={step} />
            </div>

            {/* ── Floating Configurator Card (Orbea 100% Match) ── */}
            <div className="
              relative lg:absolute lg:top-4 lg:right-4 lg:bottom-4
              w-full lg:w-[410px] xl:w-[440px]
              flex-1 lg:flex-initial
              z-20 flex flex-col
              bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl
              border-t lg:border border-neutral-200/80 dark:border-neutral-800
              lg:rounded-3xl shadow-2xl
              overflow-hidden
            ">
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

