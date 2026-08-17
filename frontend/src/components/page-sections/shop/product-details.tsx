/**
 * Coded by Harith
 * Kampungcetak ®
 * Orbea-faithful configurator panel (sidebar content only — step nav lives in page.tsx)
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
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

interface ProductDetailsProps {
  product: IProduct;
  step: "frame" | "components" | "summary";
  onStepChange: (step: "frame" | "components" | "summary") => void;
}

export function ProductDetails({ product, step, onStepChange }: ProductDetailsProps) {
  const { locale } = useLanguage();
  const label = (english: string, malay: string) => (locale === "ms" ? malay : english);
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
      product.printingOptions.forEach((opt) => {
        if (opt.options.length > 0) {
          defaults[opt.name] = opt.isMultiSelect ? [] : 0;
        }
      });
      setSelectedOptions(defaults);
    }
    setQuantity(1);
  }, [product, id]);

  const handleOptionChange = (optionName: string, index: number, isMultiSelect?: boolean) => {
    setSelectedOptions((prev) => {
      if (isMultiSelect) {
        const current = Array.isArray(prev[optionName]) ? (prev[optionName] as number[]) : [];
        if (current.includes(index)) {
          return { ...prev, [optionName]: current.filter((i) => i !== index) };
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
  if (product.category === "button-badge") {
    const typeName = options.find((o) => o.name.toLowerCase() === "type")?.name;
    const type =
      typeName && typeof selectedOptions[typeName] === "number"
        ? options.find((o) => o.name === typeName)?.options[selectedOptions[typeName] as number]?.label
        : "";
    if (type === "BUTTON BADGE MAGNET TAG") minQuantity = 10;
  }

  useEffect(() => {
    if (quantity < minQuantity) setQuantity(minQuantity);
  }, [minQuantity, quantity]);

  // ── Pricing logic (unchanged) ──
  let subtotal = 0;
  let availableQuantities: number[] = [];

  if (product.category === "photobook") {
    const matName = options.find((o) => o.name.toLowerCase().includes("material"))?.name;
    const sizeName = options.find((o) => o.name.toLowerCase().includes("size"))?.name;
    const pagesName = options.find((o) => o.name.toLowerCase().includes("pages"))?.name;
    const mat =
      matName && typeof selectedOptions[matName] === "number"
        ? options.find((o) => o.name === matName)?.options[selectedOptions[matName] as number]?.label
        : "";
    const size =
      sizeName && typeof selectedOptions[sizeName] === "number"
        ? options.find((o) => o.name === sizeName)?.options[selectedOptions[sizeName] as number]?.label
        : "";
    const pages =
      pagesName && typeof selectedOptions[pagesName] === "number"
        ? options.find((o) => o.name === pagesName)?.options[selectedOptions[pagesName] as number]?.label
        : "";
    const pricingDB: any = {
      HARDCOVER: { "6X6": { "40 PAGES": 109, "60 PAGES": 119, "100 PAGES": 129 }, "8X6": { "40 PAGES": 129, "60 PAGES": 139, "100 PAGES": 149 } },
      SOFTCOVER: { "6X6": { "40 PAGES": 49, "60 PAGES": 59, "100 PAGES": 69 }, "8X6": { "40 PAGES": 55, "60 PAGES": 65, "100 PAGES": 75 } },
    };
    const unitPrice = pricingDB[mat || ""]?.[size || ""]?.[pages || ""] || 0;
    subtotal = unitPrice * quantity + (designOption === "design" ? 100 : 0);
  } else if (product.category === "sublimation-tshirt") {
    const typeName = options.find((o) => o.name.toLowerCase().includes("type"))?.name;
    const type =
      typeName && typeof selectedOptions[typeName] === "number"
        ? options.find((o) => o.name === typeName)?.options[selectedOptions[typeName] as number]?.label
        : "Round Neck";
    const tshirtPrices: Record<string, Record<string, number>> = {
      "Round Neck": { "1": 39, "10": 29, "20": 25, "30": 24, "50": 22, "100": 20 },
      Muslimah: { "1": 49, "10": 39, "20": 35, "30": 34, "50": 32, "100": 30 },
      Kids: { "1": 39, "10": 29, "20": 25, "30": 24, "50": 22, "100": 20 },
      "Sweater Lycra": { "1": 119, "10": 99, "20": 89, "30": 79, "50": 75, "100": 65 },
      "Baseball Lycra": { "1": 119, "10": 99, "20": 89, "30": 79, "50": 75, "100": 65 },
      "Versity Lycra": { "1": 150, "10": 120, "20": 110, "30": 99, "50": 95, "100": 79 },
      "Korporat Shortsleeve": { "1": 120, "10": 99, "20": 89, "30": 79, "50": 75, "100": 65 },
      "Korporat Longsleeve": { "1": 130, "10": 109, "20": 99, "30": 89, "50": 85, "100": 75 },
    };
    const tiers = [100, 50, 30, 20, 10, 1];
    let applicableTier = 1;
    for (let t of tiers) {
      if (quantity >= t) {
        applicableTier = t;
        break;
      }
    }
    const unitPrice = tshirtPrices[type || "Round Neck"]?.[applicableTier.toString()] || tshirtPrices["Round Neck"]["1"];
    let optionAddonsPerPiece = 0;
    if (product.printingOptions) {
      product.printingOptions.forEach((opt) => {
        if (opt.name.toLowerCase().includes("add on")) {
          const selectedVal = selectedOptions[opt.name];
          if (Array.isArray(selectedVal)) {
            selectedVal.forEach((idx) => {
              if (opt.options[idx]) optionAddonsPerPiece += opt.options[idx].priceAdd;
            });
          }
        }
      });
    }
    subtotal = (unitPrice + optionAddonsPerPiece) * quantity + (designOption === "design" ? 100 : 0);
  } else if (product.matrixPricing?.enabled) {
    const materialOptName = options.find(
      (o) =>
        o.name.toLowerCase().includes("material") ||
        o.name.toLowerCase().includes("format") ||
        o.name.toLowerCase().includes("package")
    )?.name;
    const laminationOptName = options.find(
      (o) =>
        o.name.toLowerCase().includes("lamination") ||
        o.name.toLowerCase().includes("sides") ||
        o.name.toLowerCase().includes("packaging")
    )?.name;
    const selectedMaterial =
      materialOptName && typeof selectedOptions[materialOptName] === "number"
        ? options.find((o) => o.name === materialOptName)?.options[selectedOptions[materialOptName] as number]?.label
        : "";
    const selectedLamination =
      laminationOptName && typeof selectedOptions[laminationOptName] === "number"
        ? options.find((o) => o.name === laminationOptName)?.options[selectedOptions[laminationOptName] as number]?.label
        : "";
    let matrixRow: any = null;
    if (product.category === "paper-bag") {
      const designOptName = options.find(
        (o) => o.name.toLowerCase().includes("design") || o.name.toLowerCase().includes("size")
      )?.name;
      const selectedDesign =
        designOptName && typeof selectedOptions[designOptName] === "number"
          ? options.find((o) => o.name === designOptName)?.options[selectedOptions[designOptName] as number]?.label
          : "";
      matrixRow = product.matrixPricing.pricingData.find(
        (row: any) => row.material === selectedMaterial && row.lamination === selectedLamination && row.design === selectedDesign
      );
    } else {
      matrixRow = product.matrixPricing.pricingData.find(
        (row: any) => row.material === selectedMaterial && row.laminate === selectedLamination
      );
    }
    if (matrixRow) {
      availableQuantities = Object.keys(matrixRow.quantityPrices)
        .map(Number)
        .sort((a, b) => a - b);
      let qPrices: any = matrixRow.quantityPrices[quantity] || matrixRow.quantityPrices[availableQuantities[0]];
      let exactPrice = 0;
      if (typeof qPrices === "object") {
        if (!qPrices[selectedGridSize]) {
          const availableSizesForQ = Object.keys(qPrices);
          if (availableSizesForQ.length > 0) {
            setTimeout(() => setSelectedGridSize(availableSizesForQ[0]), 0);
          }
        }
        exactPrice = qPrices[selectedGridSize] || Object.values(qPrices)[0] || 0;
      } else {
        exactPrice = qPrices || 0;
      }
      if (!availableQuantities.includes(quantity) && availableQuantities.length > 0) {
        setTimeout(() => setQuantity(availableQuantities[0]), 0);
      }
      subtotal = exactPrice + (designOption === "design" ? 100 : 0);
    } else {
      subtotal = product.price * quantity + (designOption === "design" ? 100 : 0);
    }
  } else {
    let optionAddons = 0;
    if (product.printingOptions) {
      product.printingOptions.forEach((opt) => {
        const selectedVal = selectedOptions[opt.name];
        if (Array.isArray(selectedVal)) {
          selectedVal.forEach((idx) => {
            if (opt.options[idx]) optionAddons += opt.options[idx].priceAdd;
          });
        } else if (selectedVal !== undefined && opt.options[selectedVal as number]) {
          optionAddons += opt.options[selectedVal as number].priceAdd;
        }
      });
    }
    const basePrice = product.price + optionAddons;
    subtotal = basePrice * quantity + (designOption === "design" ? 100 : 0);
  }

  const total = subtotal;

  const step1Options = options.filter((o) => /format|size|material|package/i.test(o.name));
  const step2Options = options.filter((o) => !/format|size|material|package|turnaround|addon/i.test(o.name));
  const step3Addons = options.filter((o) => /addon/i.test(o.name));
  const stepTurnaround = options.filter((o) => /turnaround/i.test(o.name));

  const nextStep = step === "frame" ? "components" : step === "components" ? "summary" : "summary";

  const stepButtonLabel =
    step === "frame"
      ? label("Configure Options", "Konfigurasi Pilihan")
      : step === "components"
        ? label("View Summary", "Lihat Ringkasan")
        : label("Add to Cart", "Tambah ke Troli");

  return (
    <div className="col-span-full row-span-full flex flex-col no-scrollbar overflow-x-hidden overscroll-contain">
      {/* ══════════════ STEP: FRAME ══════════════ */}
      {step === "frame" && (
        <div className="col-span-full row-span-full flex flex-col gap-6 p-4 lg:px-4 lg:py-4 xl:px-5">
          {/* Design & Artwork */}
          {product.category?.toLowerCase() !== "islamic khat" && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                {label("Design & Artwork", "Reka Bentuk & Karya")}
              </label>
              {product.name?.toLowerCase() === "portrait" ? (
                <div className="p-3 border border-border text-center">
                  <p className="text-[11px] font-bold text-foreground">
                    {label("UPLOAD YOUR PICTURE AT PROFILE PAGE", "MUAT NAIK GAMBAR DI HALAMAN PROFIL")}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {label("AFTER YOU HAVE PLACED THE ORDER", "SELEPAS ANDA MEMBUAT PESANAN")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setDesignOption("upload")}
                    className={cn("orbea-pill text-left justify-start px-3", designOption === "upload" && "selected")}
                  >
                    <div>
                      <span className="text-[11px] font-bold block">{label("Own Design", "Reka Sendiri")}</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5 block">
                        {label("Upload at checkout", "Muat naik semasa checkout")}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setDesignOption("design")}
                    className={cn("orbea-pill text-left justify-start px-3", designOption === "design" && "selected")}
                  >
                    <div>
                      <span className="text-[11px] font-bold block">{label("Design Service", "Perkhidmatan Reka")}</span>
                      <span className="text-[9px] text-primary font-semibold block mt-0.5">+RM 100</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Format & Material */}
          {step1Options.length > 0 &&
            step1Options.map((opt, i) => (
              <div key={i} className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{opt.name}</label>
                <div className="flex flex-wrap gap-1.5">
                  {opt.options.map((val, idx) => {
                    const isSelected = opt.isMultiSelect
                      ? Array.isArray(selectedOptions[opt.name]) && (selectedOptions[opt.name] as number[]).includes(idx)
                      : selectedOptions[opt.name] === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionChange(opt.name, idx, opt.isMultiSelect)}
                        className={cn("orbea-pill whitespace-nowrap", isSelected && "selected")}
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
      )}

      {/* ══════════════ STEP: COMPONENTS (Options) ══════════════ */}
      {step === "components" && (
        <div className="col-span-full row-span-full flex flex-col gap-6 p-4 lg:px-4 lg:py-4 xl:px-5">
          {/* Printing Options */}
          {step2Options.length > 0 &&
            step2Options.map((opt, i) => (
              <div key={i} className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{opt.name}</label>
                <div className="flex flex-wrap gap-1.5">
                  {opt.options.map((val, idx) => {
                    const isSelected = opt.isMultiSelect
                      ? Array.isArray(selectedOptions[opt.name]) && (selectedOptions[opt.name] as number[]).includes(idx)
                      : selectedOptions[opt.name] === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionChange(opt.name, idx, opt.isMultiSelect)}
                        className={cn("orbea-pill whitespace-nowrap", isSelected && "selected")}
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

          {/* Add-ons */}
          {step3Addons.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                {label("Add-ons", "Tambahan")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {step3Addons.map((opt, i) =>
                  opt.options.map((val, idx) => {
                    const isSelected = opt.isMultiSelect
                      ? Array.isArray(selectedOptions[opt.name]) && (selectedOptions[opt.name] as number[]).includes(idx)
                      : selectedOptions[opt.name] === idx;
                    return (
                      <button
                        key={`${i}-${idx}`}
                        onClick={() => handleOptionChange(opt.name, idx, opt.isMultiSelect)}
                        className={cn("orbea-pill whitespace-nowrap", isSelected && "selected")}
                      >
                        {val.label}
                        {val.priceAdd !== 0 && (
                          <span className={cn("ml-1", isSelected ? "text-background/70" : "text-muted-foreground")}>
                            {val.priceAdd > 0 ? `+RM${val.priceAdd.toFixed(0)}` : `-RM${Math.abs(val.priceAdd).toFixed(0)}`}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Quantity */}
          {product.category !== "flyers" && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                {label("Quantity", "Kuantiti")}
              </label>
              {product.matrixPricing?.enabled && !product.matrixPricing.hideQuantityGrid && availableQuantities.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {availableQuantities.map((q) => (
                    <button key={q} onClick={() => setQuantity(q)} className={cn("orbea-pill", quantity === q && "selected")}>
                      {q}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <span className="text-xs font-medium">{label("Pieces", "Unit")}</span>
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

          {/* Turnaround & Pricing */}
          {product.category !== "flyers" && stepTurnaround.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                {label("Turnaround & Pricing", "Tempoh & Harga")}
              </label>
              {(() => {
                const turnaroundOpt = stepTurnaround[0];
                const standardQuantities = [100, 200, 300, 500, 1000, 2000];
                let optionAddonsWithoutTurnaround = 0;
                if (product.printingOptions) {
                  product.printingOptions.forEach((opt) => {
                    if (opt.name === turnaroundOpt.name) return;
                    const selectedVal = selectedOptions[opt.name];
                    if (Array.isArray(selectedVal)) {
                      selectedVal.forEach((idx) => {
                        if (opt.options[idx]) optionAddonsWithoutTurnaround += opt.options[idx].priceAdd;
                      });
                    } else if (selectedVal !== undefined && opt.options[selectedVal as number]) {
                      optionAddonsWithoutTurnaround += opt.options[selectedVal as number].priceAdd;
                    }
                  });
                }
                return (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-[11px] text-center">
                      <thead className="bg-secondary border-b border-border">
                        <tr>
                          <th className="p-2 text-left font-semibold">{label("Qty", "Kuantiti")}</th>
                          {turnaroundOpt.options.map((opt, idx) => (
                            <th key={idx} className="p-2 font-semibold">
                              {opt.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {standardQuantities.map((q) => (
                          <tr key={q} className="hover:bg-secondary/50 transition-colors duration-100">
                            <td className="p-2 text-left font-semibold">{q}</td>
                            {turnaroundOpt.options.map((opt, idx) => {
                              const cellBasePrice =
                                product.price + optionAddonsWithoutTurnaround + opt.priceAdd + (designOption === "design" ? 100 : 0);
                              const cellTotal = cellBasePrice * q * 1.07;
                              const isSelected = quantity === q && selectedOptions[turnaroundOpt.name] === idx;
                              return (
                                <td
                                  key={idx}
                                  onClick={() => {
                                    setQuantity(q);
                                    handleOptionChange(turnaroundOpt.name, idx);
                                  }}
                                  className={cn(
                                    "p-2 cursor-pointer transition-all duration-100 border-l border-border",
                                    isSelected
                                      ? "bg-foreground text-background font-bold"
                                      : "text-muted-foreground hover:bg-secondary/50"
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

          {/* Flyers/Kad-kahwin Pricing Table */}
          {(product.category === "flyers" || product.category === "kad-kahwin") &&
            (() => {
              let matrixRow: any = null;
              if (product.matrixPricing?.enabled) {
                const materialOptName = options.find(
                  (o) => o.name.toLowerCase().includes("material") || o.name.toLowerCase().includes("format")
                )?.name;
                const laminationOptName = options.find(
                  (o) =>
                    o.name.toLowerCase().includes("lamination") ||
                    o.name.toLowerCase().includes("sides") ||
                    o.name.toLowerCase().includes("packaging")
                )?.name;
                const selectedMaterial =
                  materialOptName && typeof selectedOptions[materialOptName] === "number"
                    ? options.find((o) => o.name === materialOptName)?.options[selectedOptions[materialOptName] as number]?.label
                    : "";
                const selectedLamination =
                  laminationOptName && typeof selectedOptions[laminationOptName] === "number"
                    ? options.find((o) => o.name === laminationOptName)?.options[selectedOptions[laminationOptName] as number]
                        ?.label
                    : "";
                matrixRow = product.matrixPricing.pricingData.find(
                  (row: any) => row.material === selectedMaterial && row.laminate === selectedLamination
                );
              }
              if (!matrixRow) return null;
              const PricingTable = ({ className }: { className: string }) => (
                <div className={`rounded-lg border border-border overflow-x-auto w-full ${className}`}>
                  <table className="w-full text-[11px] text-center border-collapse">
                    <thead className="bg-secondary border-b border-border">
                      <tr>
                        <th className="p-2 text-left font-semibold border border-border">
                          {label("Qty", "Kuantiti")}
                        </th>
                        {product.category === "flyers" ? (
                          <>
                            <th className="p-2 font-semibold border border-border">A3</th>
                            <th className="p-2 font-semibold border border-border">A4</th>
                            <th className="p-2 font-semibold border border-border">A5</th>
                          </>
                        ) : (
                          <th className="p-2 font-semibold border border-border">{label("Price", "Harga")} (RM)</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {availableQuantities.map((q) => {
                        const qPrices = matrixRow.quantityPrices[q];
                        if (product.category === "kad-kahwin") {
                          const price = qPrices;
                          const isSelected = quantity === q;
                          return (
                            <tr key={q} className="hover:bg-secondary/50 transition-colors duration-100">
                              <td className="p-2 text-left font-semibold border border-border">{q}</td>
                              <td
                                onClick={() => {
                                  if (price) setQuantity(q);
                                }}
                                className={cn(
                                  "p-2 border border-border transition-all duration-100",
                                  !price
                                    ? "bg-secondary text-muted-foreground cursor-not-allowed"
                                    : "cursor-pointer",
                                  isSelected
                                    ? "bg-foreground text-background font-bold"
                                    : "text-muted-foreground hover:bg-secondary/50"
                                )}
                              >
                                {price ? `RM ${price.toFixed(2)}` : "N/A"}
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={q} className="hover:bg-secondary/50 transition-colors duration-100">
                            <td className="p-2 text-left font-semibold border border-border">{q}</td>
                            {["A3", "A4", "A5"].map((size) => {
                              const price = qPrices ? qPrices[size] : null;
                              const isSelected = quantity === q && selectedGridSize === size;
                              return (
                                <td
                                  key={size}
                                  onClick={() => {
                                    if (price) {
                                      setQuantity(q);
                                      setSelectedGridSize(size);
                                    }
                                  }}
                                  className={cn(
                                    "p-2 border border-border transition-all duration-100",
                                    !price
                                      ? "bg-secondary text-muted-foreground cursor-not-allowed"
                                      : "cursor-pointer",
                                    isSelected
                                      ? "bg-foreground text-background font-bold"
                                      : "text-muted-foreground hover:bg-secondary/50"
                                  )}
                                >
                                  {price ? `RM ${price.toFixed(2)}` : "N/A"}
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
        </div>
      )}

      {/* ══════════════ STEP: SUMMARY ══════════════ */}
      {step === "summary" && (
        <div className="col-span-full row-span-full flex flex-col gap-6 p-4 lg:px-4 lg:py-4 xl:px-5">
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">{label("Summary", "Ringkasan")}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {product.description ||
                "High quality printing service offering excellent results with vibrant colors and durability. Ideal for professional and personal use."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary rounded-lg">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  {label("Category", "Kategori")}
                </span>
                <span className="text-xs font-semibold capitalize">{product.category?.replace(/-/g, " ")}</span>
              </div>
              <div className="p-3 bg-secondary rounded-lg">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  {label("Rating", "Penilaian")}
                </span>
                <span className="text-xs font-semibold">
                  {product.rating > 0 ? `${product.rating} / 5` : label("No ratings yet", "Tiada penilaian lagi")}
                </span>
              </div>
            </div>
            <div className="p-3 bg-secondary rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                {label("Size Guide", "Panduan Saiz")}
              </span>
              <p className="text-[11px] text-muted-foreground">
                {label(
                  "Sizes vary by product. Select your preferred format in the Configure tab.",
                  "Saiz berbeza mengikut produk. Pilih format dalam tab Konfigurasi."
                )}
              </p>
            </div>
            <div className="p-3 bg-secondary rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                {label("Turnaround Time", "Tempoh Siap")}
              </span>
              <p className="text-[11px] text-muted-foreground">
                {label(
                  "Standard turnaround is 3-5 business days. Express options may be available.",
                  "Tempoh piawai ialah 3-5 hari bekerja. Pilihan ekspres mungkin tersedia."
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Sticky Bottom CTA (Orbea: target-bottom, sticky inside scroll container) ═══ */}
      <div className="sticky bottom-0 z-[1] bg-background flex flex-col gap-2 pointer-events-auto px-4 py-3 rounded-t-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] border-t border-border lg:px-3 lg:py-2 xl:px-5 xl:py-3">
        <button
          onClick={
            step === "summary"
              ? handleAddToCart
              : () => onStepChange(nextStep as "frame" | "components" | "summary")
          }
          disabled={isPending}
          className="orbea-btn-primary"
        >
          {step === "summary" ? (isPending ? label("Adding...", "Menambah...") : stepButtonLabel) : stepButtonLabel}
        </button>
        <div className="flex items-center justify-center gap-3 text-xs">
          <span className="font-medium truncate">{product.name}</span>
          <span className="text-muted-foreground">|</span>
          <span className="font-bold">RM {total.toFixed(2)}</span>
          <button
            onClick={() => onStepChange("summary")}
            className="underline text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            {label("View summary", "Lihat ringkasan")}
          </button>
        </div>
      </div>
    </div>
  );
}
