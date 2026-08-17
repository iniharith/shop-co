/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { QuantityPicker } from "@/components/global/quantity-picker";
import { IProduct } from "@/types/IProduct";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useUIStore } from "@/store/uiStore";
import { useAddtoCart } from "@/hooks/useCart";
import AnimatedButton from "@/components/animation/animatedButton";
import { useLanguage } from "@/i18n/LanguageProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface ProductDetailsProps {
  product: IProduct;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const { locale } = useLanguage();
  const label = (english: string, malay: string) => locale === "ms" ? malay : english;
  const { id } = useParams();
  const { data: session } = useSession();
  const { setIsAuthModalOpen } = useUIStore();
  const { mutate, isPending } = useAddtoCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedGridSize, setSelectedGridSize] = useState<string>("A4");
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalEl(document.getElementById("flyer-pricing-portal"));
  }, []);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number | number[]>>({});
  const [designOption, setDesignOption] = useState<"upload" | "design">("upload");

  useEffect(() => {
    if (product.printingOptions) {
      const defaults: Record<string, number | number[]> = {};
      product.printingOptions.forEach(opt => {
        if (opt.options.length > 0) {
          defaults[opt.name] = opt.isMultiSelect ? [] : 0;
        }
      });
      setSelectedOptions(defaults);
    }
    setQuantity(1);
  }, [product, id]);

  const handleOptionChange = (optionName: string, index: number, isMultiSelect?: boolean) => {
    setSelectedOptions(prev => {
      if (isMultiSelect) {
        const current = Array.isArray(prev[optionName]) ? (prev[optionName] as number[]) : [];
        if (current.includes(index)) {
          return { ...prev, [optionName]: current.filter(i => i !== index) };
        } else {
          return { ...prev, [optionName]: [...current, index] };
        }
      }
      return { ...prev, [optionName]: index };
    });
  };

  const handleAddToCart = () => {
    if (!session) {
      toast.error("Please login to add to cart");
      setIsAuthModalOpen(true);
      return;
    }
    const baseSize = product.category === "flyers" ? selectedGridSize : "Standard";
    const sizeWithDesign = `${baseSize} | Design: ${designOption === "upload" ? "Upload Artwork" : "Need Design Service"}`;
    const artworkUrl = designOption === "upload" ? "https://example.com/mock-uploaded-artwork.pdf" : undefined;
    mutate({ productId: product._id, size: sizeWithDesign, quantity, artworkUrl });
    toast.success("Added to cart");
  };

  const options = product.printingOptions || [];

  let minQuantity = 1;
  if (product.category === 'button-badge') {
    const typeName = options.find(o => o.name.toLowerCase() === 'type')?.name;
    const type = typeName && typeof selectedOptions[typeName] === 'number' ? options.find(o => o.name === typeName)?.options[selectedOptions[typeName] as number]?.label : "";
    if (type === "BUTTON BADGE MAGNET TAG") {
      minQuantity = 10;
    }
  }

  useEffect(() => {
    if (quantity < minQuantity) {
      setQuantity(minQuantity);
    }
  }, [minQuantity, quantity]);

  // ── Pricing logic (unchanged) ──
  let subtotal = 0;
  let availableQuantities: number[] = [];

  if (product.category === "photobook") {
    const matName = options.find(o => o.name.toLowerCase().includes('material'))?.name;
    const sizeName = options.find(o => o.name.toLowerCase().includes('size'))?.name;
    const pagesName = options.find(o => o.name.toLowerCase().includes('pages'))?.name;
    const mat = matName && typeof selectedOptions[matName] === 'number' ? options.find(o => o.name === matName)?.options[selectedOptions[matName] as number]?.label : "";
    const size = sizeName && typeof selectedOptions[sizeName] === 'number' ? options.find(o => o.name === sizeName)?.options[selectedOptions[sizeName] as number]?.label : "";
    const pages = pagesName && typeof selectedOptions[pagesName] === 'number' ? options.find(o => o.name === pagesName)?.options[selectedOptions[pagesName] as number]?.label : "";
    const pricingDB: any = {
      "HARDCOVER": { "6X6": { "40 PAGES": 109, "60 PAGES": 119, "100 PAGES": 129 }, "8X6": { "40 PAGES": 129, "60 PAGES": 139, "100 PAGES": 149 } },
      "SOFTCOVER": { "6X6": { "40 PAGES": 49, "60 PAGES": 59, "100 PAGES": 69 }, "8X6": { "40 PAGES": 55, "60 PAGES": 65, "100 PAGES": 75 } }
    };
    const unitPrice = pricingDB[mat || ""]?.[size || ""]?.[pages || ""] || 0;
    subtotal = unitPrice * quantity + (designOption === "design" ? 100 : 0);
  } else if (product.category === "sublimation-tshirt") {
    const typeName = options.find(o => o.name.toLowerCase().includes('type'))?.name;
    const type = typeName && typeof selectedOptions[typeName] === 'number' ? options.find(o => o.name === typeName)?.options[selectedOptions[typeName] as number]?.label : "Round Neck";
    const tshirtPrices: Record<string, Record<string, number>> = {
      "Round Neck": { "1": 39, "10": 29, "20": 25, "30": 24, "50": 22, "100": 20 },
      "Muslimah": { "1": 49, "10": 39, "20": 35, "30": 34, "50": 32, "100": 30 },
      "Kids": { "1": 39, "10": 29, "20": 25, "30": 24, "50": 22, "100": 20 },
      "Sweater Lycra": { "1": 119, "10": 99, "20": 89, "30": 79, "50": 75, "100": 65 },
      "Baseball Lycra": { "1": 119, "10": 99, "20": 89, "30": 79, "50": 75, "100": 65 },
      "Versity Lycra": { "1": 150, "10": 120, "20": 110, "30": 99, "50": 95, "100": 79 },
      "Korporat Shortsleeve": { "1": 120, "10": 99, "20": 89, "30": 79, "50": 75, "100": 65 },
      "Korporat Longsleeve": { "1": 130, "10": 109, "20": 99, "30": 89, "50": 85, "100": 75 }
    };
    const tiers = [100, 50, 30, 20, 10, 1];
    let applicableTier = 1;
    for (let t of tiers) { if (quantity >= t) { applicableTier = t; break; } }
    const unitPrice = tshirtPrices[type || "Round Neck"]?.[applicableTier.toString()] || tshirtPrices["Round Neck"]["1"];
    let optionAddonsPerPiece = 0;
    if (product.printingOptions) {
      product.printingOptions.forEach(opt => {
        if (opt.name.toLowerCase().includes('add on')) {
          const selectedVal = selectedOptions[opt.name];
          if (Array.isArray(selectedVal)) {
            selectedVal.forEach(idx => { if (opt.options[idx]) optionAddonsPerPiece += opt.options[idx].priceAdd; });
          }
        }
      });
    }
    subtotal = ((unitPrice + optionAddonsPerPiece) * quantity) + (designOption === "design" ? 100 : 0);
  } else if (product.matrixPricing?.enabled) {
    const materialOptName = options.find(o => o.name.toLowerCase().includes('material') || o.name.toLowerCase().includes('format') || o.name.toLowerCase().includes('package'))?.name;
    const laminationOptName = options.find(o => o.name.toLowerCase().includes('lamination') || o.name.toLowerCase().includes('sides') || o.name.toLowerCase().includes('packaging'))?.name;
    const selectedMaterial = materialOptName && typeof selectedOptions[materialOptName] === 'number' ? options.find(o => o.name === materialOptName)?.options[selectedOptions[materialOptName] as number]?.label : "";
    const selectedLamination = laminationOptName && typeof selectedOptions[laminationOptName] === 'number' ? options.find(o => o.name === laminationOptName)?.options[selectedOptions[laminationOptName] as number]?.label : "";
    let matrixRow: any = null;
    if (product.category === 'paper-bag') {
      const designOptName = options.find(o => o.name.toLowerCase().includes('design') || o.name.toLowerCase().includes('size'))?.name;
      const selectedDesign = designOptName && typeof selectedOptions[designOptName] === 'number' ? options.find(o => o.name === designOptName)?.options[selectedOptions[designOptName] as number]?.label : "";
      matrixRow = product.matrixPricing.pricingData.find((row: any) => row.material === selectedMaterial && row.lamination === selectedLamination && row.design === selectedDesign);
    } else {
      matrixRow = product.matrixPricing.pricingData.find((row: any) => row.material === selectedMaterial && row.laminate === selectedLamination);
    }
    if (matrixRow) {
      availableQuantities = Object.keys(matrixRow.quantityPrices).map(Number).sort((a,b) => a-b);
      let qPrices: any = matrixRow.quantityPrices[quantity] || matrixRow.quantityPrices[availableQuantities[0]];
      let exactPrice = 0;
      if (typeof qPrices === 'object') {
        if (!qPrices[selectedGridSize]) {
          const availableSizesForQ = Object.keys(qPrices);
          if (availableSizesForQ.length > 0) { setTimeout(() => setSelectedGridSize(availableSizesForQ[0]), 0); }
        }
        exactPrice = qPrices[selectedGridSize] || Object.values(qPrices)[0] || 0;
      } else { exactPrice = qPrices || 0; }
      if (!availableQuantities.includes(quantity) && availableQuantities.length > 0) { setTimeout(() => setQuantity(availableQuantities[0]), 0); }
      subtotal = exactPrice + (designOption === "design" ? 100 : 0);
    } else {
      subtotal = product.price * quantity + (designOption === "design" ? 100 : 0);
    }
  } else {
    let optionAddons = 0;
    if (product.printingOptions) {
      product.printingOptions.forEach(opt => {
        const selectedVal = selectedOptions[opt.name];
        if (Array.isArray(selectedVal)) {
          selectedVal.forEach(idx => { if (opt.options[idx]) optionAddons += opt.options[idx].priceAdd; });
        } else if (selectedVal !== undefined && opt.options[selectedVal as number]) {
          optionAddons += opt.options[selectedVal as number].priceAdd;
        }
      });
    }
    const basePrice = product.price + optionAddons;
    subtotal = basePrice * quantity + (designOption === "design" ? 100 : 0);
  }

  const total = subtotal;

  const step1Options = options.filter(o => /format|size|material|package/i.test(o.name));
  const step2Options = options.filter(o => !/format|size|material|package|turnaround|addon/i.test(o.name));
  const step3Addons = options.filter(o => /addon/i.test(o.name));
  const stepTurnaround = options.filter(o => /turnaround/i.test(o.name));

  // ── Pill selector renderer ──
  const renderPillOptions = (opts: typeof options) => {
    return opts.map((opt, i) => (
      <div key={i} className="space-y-3">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{opt.name}</label>
        <div className="flex flex-wrap gap-2">
          {opt.options.map((val, idx) => {
            const isSelected = opt.isMultiSelect
              ? Array.isArray(selectedOptions[opt.name]) && (selectedOptions[opt.name] as number[]).includes(idx)
              : selectedOptions[opt.name] === idx;
            return (
              <button
                key={idx}
                onClick={() => handleOptionChange(opt.name, idx, opt.isMultiSelect)}
                className={cn(
                  "px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card hover:border-primary/50 text-foreground"
                )}
              >
                {val.label}
                {val.priceAdd !== 0 && (
                  <span className={cn("ml-1.5 text-xs", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {val.priceAdd > 0 ? `+RM${val.priceAdd.toFixed(0)}` : `-RM${Math.abs(val.priceAdd).toFixed(0)}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Product Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{product.name}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-2xl font-extrabold text-primary">RM {product.price.toFixed(2)}</span>
          {product.discount > 0 && product.originalPrice > product.price && (
            <>
              <span className="text-lg text-muted-foreground line-through">RM {product.originalPrice.toFixed(2)}</span>
              <span className="text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">-{product.discount}%</span>
            </>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="configure" className="flex-1">
        <TabsList className="w-full justify-start gap-1 bg-muted/50 p-1 rounded-xl h-auto">
          <TabsTrigger value="configure" className="rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
            {label("Configure", "Konfigurasi")}
          </TabsTrigger>
          <TabsTrigger value="specs" className="rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
            {label("Details", "Butiran")}
          </TabsTrigger>
          <TabsTrigger value="guide" className="rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
            {label("Guide", "Panduan")}
          </TabsTrigger>
        </TabsList>

        {/* ── Configure Tab ── */}
        <TabsContent value="configure" className="mt-6 space-y-6">
          {/* Design Options */}
          {product.category?.toLowerCase() !== "islamic khat" && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {label("Design & Artwork", "Reka Bentuk & Karya")}
              </label>
              {product.name?.toLowerCase() === "portrait" ? (
                <div className="p-5 border-2 border-primary bg-primary/5 rounded-xl text-center">
                  <p className="text-sm font-bold text-foreground">{label("UPLOAD YOUR PICTURE AT PROFILE PAGE", "MUAT NAIK GAMBAR DI HALAMAN PROFIL")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label("AFTER YOU HAVE PLACED THE ORDER", "SELEPAS ANDA MEMBUAT PESANAN")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDesignOption("upload")}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all duration-200",
                      designOption === "upload"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <span className="text-sm font-bold block">{label("Own Design", "Reka Sendiri")}</span>
                    <span className="text-xs text-muted-foreground mt-1 block">{label("Upload artwork at checkout", "Muat naik semasa checkout")}</span>
                  </button>
                  <button
                    onClick={() => setDesignOption("design")}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all duration-200",
                      designOption === "design"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <span className="text-sm font-bold block">{label("Design Service", "Perkhidmatan Reka")}</span>
                    <span className="text-xs text-primary font-semibold block">+RM 100</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Format & Material */}
          {step1Options.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {label("Format & Material", "Format & Bahan")}
              </label>
              {renderPillOptions(step1Options)}
            </div>
          )}

          {/* Printing Options */}
          {step2Options.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {label("Printing Options", "Pilihan Cetakan")}
              </label>
              {renderPillOptions(step2Options)}
            </div>
          )}

          {/* Add-ons */}
          {step3Addons.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {label("Add-ons", "Tambahan")}
              </label>
              {renderPillOptions(step3Addons)}
            </div>
          )}

          {/* Turnaround Pricing Table */}
          {product.category !== "flyers" && stepTurnaround.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {label("Turnaround & Pricing", "Tempoh & Harga")}
              </label>
              {(() => {
                const turnaroundOpt = stepTurnaround[0];
                const standardQuantities = [100, 200, 300, 500, 1000, 2000];
                let optionAddonsWithoutTurnaround = 0;
                if (product.printingOptions) {
                  product.printingOptions.forEach(opt => {
                    if (opt.name === turnaroundOpt.name) return;
                    const selectedVal = selectedOptions[opt.name];
                    if (Array.isArray(selectedVal)) {
                      selectedVal.forEach(idx => { if (opt.options[idx]) optionAddonsWithoutTurnaround += opt.options[idx].priceAdd; });
                    } else if (selectedVal !== undefined && opt.options[selectedVal as number]) {
                      optionAddonsWithoutTurnaround += opt.options[selectedVal as number].priceAdd;
                    }
                  });
                }
                return (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm text-center">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="p-3 text-left font-semibold text-foreground">{label("Qty", "Kuantiti")}</th>
                          {turnaroundOpt.options.map((opt, idx) => (
                            <th key={idx} className="p-3 font-semibold text-foreground">{opt.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {standardQuantities.map((q) => (
                          <tr key={q} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 text-left font-semibold text-foreground">{q}</td>
                            {turnaroundOpt.options.map((opt, idx) => {
                              const cellBasePrice = product.price + optionAddonsWithoutTurnaround + opt.priceAdd + (designOption === "design" ? 100 : 0);
                              const cellTotal = cellBasePrice * q * 1.07;
                              const isSelected = quantity === q && selectedOptions[turnaroundOpt.name] === idx;
                              return (
                                <td
                                  key={idx}
                                  onClick={() => { setQuantity(q); handleOptionChange(turnaroundOpt.name, idx); }}
                                  className={cn(
                                    "p-3 cursor-pointer transition-all border-l border-border",
                                    isSelected ? "bg-primary/10 font-bold text-primary" : "text-muted-foreground hover:bg-primary/5"
                                  )}
                                >
                                  RM {cellTotal.toFixed(2)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Quantity */}
          {product.category !== "flyers" && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {label("Quantity", "Kuantiti")}
              </label>
              {product.matrixPricing?.enabled && !product.matrixPricing.hideQuantityGrid && availableQuantities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableQuantities.map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuantity(q)}
                      className={cn(
                        "px-5 py-2.5 rounded-full text-sm font-semibold border-2 transition-all",
                        quantity === q
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:border-primary/30 text-foreground"
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 border-2 border-border rounded-xl">
                  <span className="text-sm font-medium text-foreground">{label("Pieces", "Unit")}</span>
                  <QuantityPicker
                    quantity={quantity}
                    onDecrement={() => setQuantity((q) => Math.max(minQuantity, q - 1))}
                    onIncrement={() => setQuantity((q) => q + 1)}
                    max={10000}
                    onQuantityChange={setQuantity}
                  />
                </div>
              )}
            </div>
          )}

          {/* Flyers/Kad-kahwin Pricing Table */}
          {(product.category === 'flyers' || product.category === 'kad-kahwin') && (() => {
            let matrixRow: any = null;
            if (product.matrixPricing?.enabled) {
              const materialOptName = options.find(o => o.name.toLowerCase().includes('material') || o.name.toLowerCase().includes('format'))?.name;
              const laminationOptName = options.find(o => o.name.toLowerCase().includes('lamination') || o.name.toLowerCase().includes('sides') || o.name.toLowerCase().includes('packaging'))?.name;
              const selectedMaterial = materialOptName && typeof selectedOptions[materialOptName] === 'number' ? options.find(o => o.name === materialOptName)?.options[selectedOptions[materialOptName] as number]?.label : "";
              const selectedLamination = laminationOptName && typeof selectedOptions[laminationOptName] === 'number' ? options.find(o => o.name === laminationOptName)?.options[selectedOptions[laminationOptName] as number]?.label : "";
              matrixRow = product.matrixPricing.pricingData.find((row: any) => row.material === selectedMaterial && row.laminate === selectedLamination);
            }
            if (!matrixRow) return null;
            const PricingTable = ({ className }: { className: string }) => (
              <div className={`rounded-xl border border-border overflow-x-auto w-full ${className}`}>
                <table className="w-full text-sm text-center border-collapse">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="p-3 text-left font-semibold text-foreground border border-border">{label("Qty", "Kuantiti")}</th>
                      {product.category === 'flyers' ? (
                        <>
                          <th className="p-3 font-semibold text-foreground border border-border">A3</th>
                          <th className="p-3 font-semibold text-foreground border border-border">A4</th>
                          <th className="p-3 font-semibold text-foreground border border-border">A5</th>
                        </>
                      ) : (
                        <th className="p-3 font-semibold text-foreground border border-border">{label("Price", "Harga")} (RM)</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {availableQuantities.map((q) => {
                      const qPrices = matrixRow.quantityPrices[q];
                      if (product.category === 'kad-kahwin') {
                        const price = qPrices;
                        const isSelected = quantity === q;
                        return (
                          <tr key={q} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 text-left font-semibold text-foreground border border-border">{q}</td>
                            <td
                              onClick={() => { if (price) setQuantity(q); }}
                              className={cn("p-3 border border-border transition-all", !price ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'cursor-pointer', isSelected ? 'bg-primary/10 font-bold text-primary' : 'text-muted-foreground hover:bg-muted/30')}
                            >
                              {price ? `RM ${price.toFixed(2)}` : 'N/A'}
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={q} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-left font-semibold text-foreground border border-border">{q}</td>
                          {['A3', 'A4', 'A5'].map((size) => {
                            const price = qPrices ? qPrices[size] : null;
                            const isSelected = quantity === q && selectedGridSize === size;
                            return (
                              <td
                                key={size}
                                onClick={() => { if (price) { setQuantity(q); setSelectedGridSize(size); } }}
                                className={cn("p-3 border border-border transition-all", !price ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'cursor-pointer', isSelected ? 'bg-primary/10 font-bold text-primary' : 'text-muted-foreground hover:bg-muted/30')}
                              >
                                {price ? `RM ${price.toFixed(2)}` : 'N/A'}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
            return (
              <>
                <PricingTable className="lg:hidden" />
                {portalEl && createPortal(<PricingTable className="hidden lg:block" />, portalEl)}
              </>
            );
          })()}
        </TabsContent>

        {/* ── Details Tab ── */}
        <TabsContent value="specs" className="mt-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description || "High quality printing service offering excellent results with vibrant colors and durability. Ideal for professional and personal use."}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-muted/30 rounded-xl">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">{label("Category", "Kategori")}</span>
                <span className="text-sm font-semibold text-foreground capitalize">{product.category?.replace(/-/g, ' ')}</span>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">{label("Rating", "Penilaian")}</span>
                <span className="text-sm font-semibold text-foreground">{product.rating > 0 ? `${product.rating} / 5` : label("No ratings yet", "Tiada penilaian lagi")}</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Guide Tab ── */}
        <TabsContent value="guide" className="mt-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="sizing">
              <AccordionTrigger className="text-sm font-semibold">{label("Size Guide", "Panduan Saiz")}</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  {label(
                    "Sizes vary by product. Select your preferred format in the Configure tab to see available options.",
                    "Saiz berbeza mengikut produk. Pilih format pilihan anda dalam tab Konfigurasi untuk melihat pilihan yang tersedia."
                  )}
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="material">
              <AccordionTrigger className="text-sm font-semibold">{label("Material Information", "Maklumat Bahan")}</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  {label(
                    "We use premium quality materials for all our printing services. Specific material options are available in the Configure tab based on your product selection.",
                    "Kami menggunakan bahan berkualiti premium untuk semua perkhidmatan percetakan kami. Pilihan bahan spesifik tersedia dalam tab Konfigurasi berdasarkan pilihan produk anda."
                  )}
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="turnaround">
              <AccordionTrigger className="text-sm font-semibold">{label("Turnaround Time", "Tempoh Siap")}</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  {label(
                    "Standard turnaround is 3-5 business days. Express options may be available depending on the product. Check the pricing table in the Configure tab for turnaround-specific pricing.",
                    "Tempoh piawai ialah 3-5 hari bekerja. Pilihan ekspres mungkin tersedia bergantung pada produk. Semak jadual harga dalam tab Konfigurasi untuk harga mengikut tempoh."
                  )}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>

      {/* ── Sticky Price Bar ── */}
      <div className="sticky bottom-0 mt-6 bg-card border-t border-border pt-4 pb-2 -mx-6 px-6 -mb-6 pb-6 rounded-b-2xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{label("Total", "Jumlah")}</span>
          <span className="text-2xl font-extrabold text-primary">RM {total.toFixed(2)}</span>
        </div>
        <AnimatedButton
          text={label("Add to Cart", "Tambah ke Troli")}
          type="submit"
          isLoading={isPending}
          className="w-full bg-primary text-primary-foreground py-4 font-bold text-lg rounded-xl active:scale-95 transition-all cursor-pointer shadow-lg shadow-primary/20 hover:shadow-primary/40"
          onClick={handleAddToCart}
        />
        <p className="text-[11px] text-muted-foreground text-center mt-2">{label("Delivery price shown at checkout", "Caj penghantaran ditunjukkan semasa checkout")}</p>
      </div>
    </div>
  );
}
