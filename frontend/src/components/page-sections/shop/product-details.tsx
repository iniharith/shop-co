/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useEffect, useState } from "react";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { ChevronDown, FileText, Package } from "lucide-react";

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

  // ── Orbea-style section renderer ──
  const renderOptionSection = (opts: typeof options, sectionLabel: string, icon: React.ReactNode) => {
    if (opts.length === 0) return null;
    return (
      <div className="border-b border-border">
        <button
          className="w-full flex items-center justify-between py-4 text-left group"
        >
          <div className="flex items-center gap-2.5">
            {icon}
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">{sectionLabel}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
        <div className="pb-4 space-y-4">
          {opts.map((opt, i) => (
            <div key={i} className="space-y-2.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{opt.name}</label>
              <div className="flex flex-wrap gap-1.5">
                {opt.options.map((val, idx) => {
                  const isSelected = opt.isMultiSelect
                    ? Array.isArray(selectedOptions[opt.name]) && (selectedOptions[opt.name] as number[]).includes(idx)
                    : selectedOptions[opt.name] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionChange(opt.name, idx, opt.isMultiSelect)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-150",
                        isSelected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card hover:border-foreground/30 text-foreground"
                      )}
                    >
                      {val.label}
                      {val.priceAdd !== 0 && (
                        <span className={cn("ml-1", isSelected ? "text-background/70" : "text-muted-foreground")}>
                          {val.priceAdd > 0 ? `+RM${val.priceAdd.toFixed(0)}` : `-RM${Math.abs(val.priceAdd).toFixed(0)}`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Spec sections for accordion ──
  const specSections: { title: string; content: string }[] = [
    { title: label("Description", "Penerangan"), content: product.description || "High quality printing service offering excellent results with vibrant colors and durability. Ideal for professional and personal use." },
    { title: label("Category", "Kategori"), content: product.category?.replace(/-/g, ' ') || "" },
    { title: label("Size Guide", "Panduan Saiz"), content: label("Sizes vary by product. Select your preferred format in the configuration panel to see available options.", "Saiz berbeza mengikut produk. Pilih format pilihan anda dalam panel konfigurasi untuk melihat pilihan yang tersedia.") },
    { title: label("Material Information", "Maklumat Bahan"), content: label("We use premium quality materials for all our printing services. Specific material options are available based on your product selection.", "Kami menggunakan bahan berkualiti premium untuk semua perkhidmatan percetakan kami. Pilihan bahan spesifik tersedia berdasarkan pilihan produk anda.") },
    { title: label("Turnaround Time", "Tempoh Siap"), content: label("Standard turnaround is 3-5 business days. Express options may be available depending on the product. Check the pricing table for turnaround-specific pricing.", "Tempoh piawai ialah 3-5 hari bekerja. Pilihan ekspres mungkin tersedia bergantung pada produk. Semak jadual harga untuk harga mengikut tempoh.") },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* ── Product Header (Orbea: name + price at top) ── */}
      <div className="mb-2">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight">{product.name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-2xl font-extrabold text-foreground">RM {product.price.toFixed(2)}</span>
          {product.discount > 0 && product.originalPrice > product.price && (
            <>
              <span className="text-sm text-muted-foreground line-through">RM {product.originalPrice.toFixed(2)}</span>
              <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">-{product.discount}%</span>
            </>
          )}
        </div>
      </div>

      {/* ── Configuration Sections (Orbea-style stacked) ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Design & Artwork */}
        {product.category?.toLowerCase() !== "islamic khat" && (
          <div className="border-b border-border">
            <div className="py-4 space-y-2.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                {label("Design & Artwork", "Reka Bentuk & Karya")}
              </label>
              {product.name?.toLowerCase() === "portrait" ? (
                <div className="p-4 border-2 border-foreground bg-foreground/5 text-center">
                  <p className="text-xs font-bold text-foreground">{label("UPLOAD YOUR PICTURE AT PROFILE PAGE", "MUAT NAIK GAMBAR DI HALAMAN PROFIL")}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{label("AFTER YOU HAVE PLACED THE ORDER", "SELEPAS ANDA MEMBUAT PESANAN")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDesignOption("upload")}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all duration-150",
                      designOption === "upload"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground/30"
                    )}
                  >
                    <span className="text-xs font-bold block">{label("Own Design", "Reka Sendiri")}</span>
                    <span className={cn("text-[10px] mt-0.5 block", designOption === "upload" ? "text-background/70" : "text-muted-foreground")}>{label("Upload at checkout", "Muat naik semasa checkout")}</span>
                  </button>
                  <button
                    onClick={() => setDesignOption("design")}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all duration-150",
                      designOption === "design"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground/30"
                    )}
                  >
                    <span className="text-xs font-bold block">{label("Design Service", "Perkhidmatan Reka")}</span>
                    <span className={cn("text-[10px] font-semibold block mt-0.5", designOption === "design" ? "text-background/70" : "text-primary")}>+RM 100</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Format & Material */}
        {renderOptionSection(step1Options, label("Format & Material", "Format & Bahan"), <Package className="w-3.5 h-3.5 text-muted-foreground" />)}

        {/* Printing Options */}
        {renderOptionSection(step2Options, label("Options", "Pilihan"), <FileText className="w-3.5 h-3.5 text-muted-foreground" />)}

        {/* Add-ons */}
        {renderOptionSection(step3Addons, label("Add-ons", "Tambahan"), <Package className="w-3.5 h-3.5 text-muted-foreground" />)}

        {/* Turnaround & Pricing */}
        {product.category !== "flyers" && stepTurnaround.length > 0 && (
          <div className="border-b border-border">
            <div className="py-4 space-y-2.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
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
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-xs text-center">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="p-2 text-left font-semibold text-foreground">{label("Qty", "Kuantiti")}</th>
                          {turnaroundOpt.options.map((opt, idx) => (
                            <th key={idx} className="p-2 font-semibold text-foreground">{opt.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {standardQuantities.map((q) => (
                          <tr key={q} className="hover:bg-muted/30 transition-colors">
                            <td className="p-2 text-left font-semibold text-foreground">{q}</td>
                            {turnaroundOpt.options.map((opt, idx) => {
                              const cellBasePrice = product.price + optionAddonsWithoutTurnaround + opt.priceAdd + (designOption === "design" ? 100 : 0);
                              const cellTotal = cellBasePrice * q * 1.07;
                              const isSelected = quantity === q && selectedOptions[turnaroundOpt.name] === idx;
                              return (
                                <td
                                  key={idx}
                                  onClick={() => { setQuantity(q); handleOptionChange(turnaroundOpt.name, idx); }}
                                  className={cn(
                                    "p-2 cursor-pointer transition-all border-l border-border",
                                    isSelected ? "bg-foreground text-background font-bold" : "text-muted-foreground hover:bg-muted/30"
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
          </div>
        )}

        {/* Quantity */}
        {product.category !== "flyers" && (
          <div className="border-b border-border">
            <div className="py-4 space-y-2.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                {label("Quantity", "Kuantiti")}
              </label>
              {product.matrixPricing?.enabled && !product.matrixPricing.hideQuantityGrid && availableQuantities.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {availableQuantities.map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuantity(q)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-xs font-semibold border transition-all",
                        quantity === q
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card hover:border-foreground/30 text-foreground"
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <span className="text-xs font-medium text-foreground">{label("Pieces", "Unit")}</span>
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
            <div className={`rounded-lg border border-border overflow-x-auto w-full ${className}`}>
              <table className="w-full text-xs text-center border-collapse">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-2 text-left font-semibold text-foreground border border-border">{label("Qty", "Kuantiti")}</th>
                    {product.category === 'flyers' ? (
                      <>
                        <th className="p-2 font-semibold text-foreground border border-border">A3</th>
                        <th className="p-2 font-semibold text-foreground border border-border">A4</th>
                        <th className="p-2 font-semibold text-foreground border border-border">A5</th>
                      </>
                    ) : (
                      <th className="p-2 font-semibold text-foreground border border-border">{label("Price", "Harga")} (RM)</th>
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
                          <td className="p-2 text-left font-semibold text-foreground border border-border">{q}</td>
                          <td
                            onClick={() => { if (price) setQuantity(q); }}
                            className={cn("p-2 border border-border transition-all", !price ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'cursor-pointer', isSelected ? 'bg-foreground text-background font-bold' : 'text-muted-foreground hover:bg-muted/30')}
                          >
                            {price ? `RM ${price.toFixed(2)}` : 'N/A'}
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={q} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2 text-left font-semibold text-foreground border border-border">{q}</td>
                        {['A3', 'A4', 'A5'].map((size) => {
                          const price = qPrices ? qPrices[size] : null;
                          const isSelected = quantity === q && selectedGridSize === size;
                          return (
                            <td
                              key={size}
                              onClick={() => { if (price) { setQuantity(q); setSelectedGridSize(size); } }}
                              className={cn("p-2 border border-border transition-all", !price ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'cursor-pointer', isSelected ? 'bg-foreground text-background font-bold' : 'text-muted-foreground hover:bg-muted/30')}
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

        {/* ── Specs / Details (Orbea-style accordion) ── */}
        <div className="border-b border-border">
          <Accordion type="single" collapsible className="w-full">
            {specSections.map((section, idx) => (
              <AccordionItem key={idx} value={`spec-${idx}`} className="border-b border-border last:border-b-0">
                <AccordionTrigger className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] py-3 hover:no-underline">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{section.content}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* ── Sticky Bottom CTA (Orbea: price + add to basket) ── */}
      <div className="sticky bottom-0 bg-card border-t border-border pt-4 pb-5 mt-4 -mx-6 px-6 -mb-6 rounded-b-2xl z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs text-muted-foreground block">{label("Total", "Jumlah")}</span>
            <span className="text-xl font-extrabold text-foreground">RM {total.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block">{label("Delivery", "Penghantaran")}</span>
            <span className="text-xs font-semibold text-muted-foreground">{label("shown at checkout", "ditunjukkan semasa checkout")}</span>
          </div>
        </div>
        <AnimatedButton
          text={label("Add to Cart", "Tambah ke Troli")}
          type="submit"
          isLoading={isPending}
          className="w-full bg-foreground text-background py-3.5 font-bold text-sm tracking-wide rounded-lg active:scale-[0.98] transition-all cursor-pointer hover:bg-foreground/90"
          onClick={handleAddToCart}
        />
      </div>
    </div>
  );
}
