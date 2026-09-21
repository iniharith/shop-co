/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QuantityPicker } from "@/components/global/quantity-picker";
import { StarRating } from "@/components/global/star-rating";
import { IProduct } from "@/types/IProduct";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useUIStore } from "@/store/uiStore";
import { useAddtoCart } from "@/hooks/useCart";
import AnimatedButton from "@/components/animation/animatedButton";
import { useLanguage } from "@/i18n/LanguageProvider";
import { getImageUrl } from "@/utils/getImageUrl";
import { getProductVariation, getVariationImagesForSize } from "@/utils/productConfiguration";
import { Check, Headphones, ShieldCheck, Truck, Palette, MessageCircle, Upload } from "lucide-react";
import Link from "next/link";

interface ProductDetailsProps {
  product: IProduct;
  selectedVariationIndex?: number | null;
  onSelectedImageChange?: (index: number) => void;
  onSelectedVariationChange?: (index: number) => void;
  onSelectedSizeImagesChange?: (images: string[] | null) => void;
}

export function ProductDetails({
  product,
  selectedVariationIndex = null,
  onSelectedImageChange,
  onSelectedVariationChange,
  onSelectedSizeImagesChange
}: ProductDetailsProps) {
  const { locale } = useLanguage();
  const label = (english: string, malay: string) => locale === "ms" ? malay : english;
  const { id } = useParams();
  const { data: session } = useSession();
  const { setIsAuthModalOpen } = useUIStore();
  const { mutate, isPending } = useAddtoCart();

  const [quantity, setQuantity] = useState(1);
  const isPortraitProduct = String(id || "").toLowerCase() === "portrait" || String(product.slug || "").toLowerCase() === "portrait";
  const supportsCanvas = isPortraitProduct || /photo|canvas|frame|acrylic|clock/i.test(`${product.name} ${product.category}`);
  const [canvasDesign, setCanvasDesign] = useState<{ url: string; templateName: string; size: string; productId?: string } | null>(null);
  const [useCanvas, setUseCanvas] = useState(false);
  useEffect(() => {
    setCanvasDesign(null); setUseCanvas(false);
    if (!supportsCanvas) return;
    try {
      const value = JSON.parse(localStorage.getItem('kc-canvas-ready') || 'null');
      if (value && typeof value.url === 'string' && value.url.startsWith('https://') && (!value.productId || value.productId === product._id)) {
        setCanvasDesign(value); setUseCanvas(value.productId === product._id);
      }
    } catch { /* No completed design on this device. */ }
  }, [product._id, supportsCanvas]);
  const [selectedGridSize, setSelectedGridSize] = useState<string>("A4");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalEl(document.getElementById("flyer-pricing-portal"));
  }, []);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number | number[]>>({});

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

    if (!isMultiSelect && /\bdesigns?\b|reka bentuk/i.test(optionName)) {
      onSelectedImageChange?.(index);
    }
  };

  useEffect(() => {
    if ((product.variations || []).length > 0) {
      const variation =
        selectedVariationIndex !== null && selectedVariationIndex != null
          ? product.variations![selectedVariationIndex]
          : undefined;
      onSelectedSizeImagesChange?.(variation?.images?.length ? variation.images : null);
      return;
    }

    const sizes = product.sizes || [];
    let images: string[] | null = null;

    const activeSize = selectedSize ? sizes.find(size => size.size === selectedSize) : null;
    // A single-size product can still have a multi-image gallery. Only let
    // size-specific images replace the gallery when there are multiple sizes
    // or the selected size actually has more than one image.
    if (activeSize?.images?.length && (sizes.length > 1 || activeSize.images.length > 1)) {
      images = activeSize.images;
    }

    if (!images && sizes.length <= 1) {
      const sizeOption = (product.printingOptions || []).find(opt => /format|size/i.test(opt.name) && opt.options.length > 0 && !opt.isMultiSelect);
      const selected = sizeOption ? selectedOptions[sizeOption.name] : undefined;
      const sizeLabel = sizeOption && typeof selected === "number" ? sizeOption.options[selected]?.label : null;
      images = getVariationImagesForSize(product, sizeLabel);
    }

    onSelectedSizeImagesChange?.(images);
  }, [product, selectedVariationIndex, selectedSize, selectedOptions, onSelectedSizeImagesChange]);

  useEffect(() => {
    const sizes = product.sizes || [];
    if (!sizes.length) {
      setSelectedSize(null);
      return;
    }
    setSelectedSize(
      sizes.find(size => String(size.size).trim().toLowerCase() === "standard")?.size
      || sizes.find(size => Number(size.stock) > 0)?.size
      || sizes[0].size
    );
  }, [product]);

  const handleAddToCart = () => {
    if (!session) {
      toast.error("Please login to add to cart");
      setIsAuthModalOpen(true);
      return;
    }
    
const hasDesignVariations = (product.variations || []).length > 0;
    const isIslamicKhat = product.category?.toLowerCase() === "islamic khat";
    if ((hasDesignVariations || (isIslamicKhat && product.images.length > 1)) && selectedVariationIndex === null) {
      toast.error(label("Please choose a design before adding to cart", "Sila pilih reka bentuk sebelum menambah ke troli"));
      return;
    }

    const baseSize = hasDesignVariations ? "Standard" : (product.category === "flyers" ? selectedGridSize : (selectedSize || "Standard"));
    const selectedVariation = isIslamicKhat && product.images.length > 1
      ? getProductVariation(product, selectedVariationIndex as number)
      : hasDesignVariations && selectedVariationIndex !== null && selectedVariationIndex != null
        ? product.variations![selectedVariationIndex]
        : null;
    const selectedVariationInfo = selectedVariation
      ? "variantLabel" in selectedVariation
        ? {
            label: selectedVariation.variantLabel,
            image: selectedVariation.variantImage,
            id: selectedVariation.variantId,
          }
        : {
            label: selectedVariation.name || "",
            image: selectedVariation.images?.[0],
            id: undefined as string | undefined,
          }
      : null;
    const selectedConfiguration = isIslamicKhat && product.images.length > 1
      ? baseSize
        : hasDesignVariations
          ? `${baseSize} | Design: ${selectedVariationInfo?.label || "Not selected"}`
        : baseSize;
    const artworkUrl = useCanvas && canvasDesign ? canvasDesign.url : undefined;
    const selections = options.flatMap((option) => {
      const selected = selectedOptions[option.name];
      const indexes = Array.isArray(selected) ? selected : typeof selected === "number" ? [selected] : [];
      const values = indexes
        .map((index) => option.options[index])
        .filter(Boolean)
        .map((value) => ({ label: value.label, priceAdd: value.priceAdd }));
      return values.length > 0 ? [{ name: option.name, values }] : [];
    });
const configVariationLabel = selectedVariationInfo?.label || "";
    const configVariationImage = selectedVariationInfo?.image;
    const configVariationId = selectedVariationInfo?.id || `${product._id}:${String(selectedVariationIndex)}`;
    const configuration = {
      version: 1,
      fulfillmentSize: baseSize,
      selections,
      design: artworkUrl ? { type: "upload" as const, label: "Upload Artwork", priceAdd: 0 } : isIslamicKhat || hasDesignVariations
        ? {
            type: "variation" as const,
            label: configVariationLabel,
            variantId: configVariationId,
            variantLabel: configVariationLabel,
            variantImage: configVariationImage,
            variationIndex: selectedVariationIndex as number,
            image: configVariationImage,
            priceAdd: 0,
          }
        : undefined,
    };
    const fixedPrice = 0;
    const unitPrice = Math.max(0, (total - fixedPrice) / quantity);
    mutate({
      productId: product._id,
      size: selectedConfiguration,
      quantity,
      artworkUrl,
      configuration,
      configurationKey: JSON.stringify(configuration),
      unitPrice,
      fixedPrice,
      lineTotal: total,
      pricingVersion: "storefront-v1",
    });
  };

  const options = product.printingOptions || [];
const stockBySize = product.sizes || [];
  const designVariations = product.variations || [];
  const hasDesignVariations = designVariations.length > 0;
  const totalAvailableStock = hasDesignVariations
    ? designVariations.reduce((total, variation) => total + Number(variation.stock || 0), 0)
    : stockBySize.reduce((total, size) => total + Number(size.stock || 0), 0);
  const standardStock = stockBySize.find(size => size.size.toLowerCase() === "standard")?.stock;
  const hasImageVariations = product.category?.toLowerCase() === "islamic khat" && product.images.length > 1;
  const hasSizeVariations = !isPortraitProduct && !hasDesignVariations && stockBySize.length > 1 && product.category?.toLowerCase() !== "islamic khat";
  const activeSize = stockBySize.find(size => size.size === selectedSize);
  const activeVariation = selectedVariationIndex !== null && selectedVariationIndex != null ? designVariations[selectedVariationIndex] : undefined;
  const maxQuantity = hasDesignVariations
    ? activeVariation && Number(activeVariation.stock) > 0
      ? Number(activeVariation.stock)
      : 1
    : activeSize && Number(activeSize.stock) > 0
      ? Number(activeSize.stock)
      : hasSizeVariations ? 1 : (stockBySize.length > 0 ? (standardStock ?? totalAvailableStock) : 10000);

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


  // Calculate prices
  let subtotal = 0;
  let availableQuantities: number[] = [];
  
  if (product.matrixPricing?.enabled) {
    const materialOptName = options.find(o => o.name.toLowerCase().includes('material') || o.name.toLowerCase().includes('format') || o.name.toLowerCase().includes('package'))?.name;
    const laminationOptName = options.find(o => o.name.toLowerCase().includes('lamination') || o.name.toLowerCase().includes('sides') || o.name.toLowerCase().includes('packaging'))?.name;
    
    const selectedMaterial = materialOptName && typeof selectedOptions[materialOptName] === 'number' 
      ? options.find(o => o.name === materialOptName)?.options[selectedOptions[materialOptName] as number]?.label 
      : "";
    const selectedLamination = laminationOptName && typeof selectedOptions[laminationOptName] === 'number' 
      ? options.find(o => o.name === laminationOptName)?.options[selectedOptions[laminationOptName] as number]?.label 
      : "";

    let matrixRow: any = null;
    if (product.category === 'paper-bag') {
      const designOptName = options.find(o => o.name.toLowerCase().includes('design') || o.name.toLowerCase().includes('size'))?.name;
      const selectedDesign = designOptName && typeof selectedOptions[designOptName] === 'number' 
        ? options.find(o => o.name === designOptName)?.options[selectedOptions[designOptName] as number]?.label 
        : "";
        
      matrixRow = product.matrixPricing.pricingData.find((row: any) => 
        row.material === selectedMaterial && 
        row.lamination === selectedLamination && 
        row.design === selectedDesign
      );
    } else {
      matrixRow = product.matrixPricing.pricingData.find((row: any) => 
        row.material === selectedMaterial && row.laminate === selectedLamination
      );
    }

    if (matrixRow) {
      availableQuantities = Object.keys(matrixRow.quantityPrices).map(Number).sort((a,b) => a-b);
      
      let qPrices: any = matrixRow.quantityPrices[quantity] || matrixRow.quantityPrices[availableQuantities[0]];
      let exactPrice = 0;
      
      if (typeof qPrices === 'object') {
        // Flyer Grid Pricing
        if (!qPrices[selectedGridSize]) {
          const availableSizesForQ = Object.keys(qPrices);
          if (availableSizesForQ.length > 0) {
            setTimeout(() => setSelectedGridSize(availableSizesForQ[0]), 0);
          }
        }
        exactPrice = qPrices[selectedGridSize] || Object.values(qPrices)[0] || 0;
      } else {
        // Normal Matrix Pricing
        exactPrice = qPrices || 0;
      }

      if (!availableQuantities.includes(quantity) && availableQuantities.length > 0) {
        setTimeout(() => setQuantity(availableQuantities[0]), 0);
      }
      
      subtotal = exactPrice;
    } else {
      subtotal = product.price * quantity; // fallback if no combination exists
    }
  } else {
    let optionAddons = 0;
    if (product.printingOptions) {
      product.printingOptions.forEach(opt => {
        const selectedVal = selectedOptions[opt.name];
        if (Array.isArray(selectedVal)) {
          selectedVal.forEach(idx => {
            if (opt.options[idx]) optionAddons += opt.options[idx].priceAdd;
          });
        } else if (selectedVal !== undefined && opt.options[selectedVal as number]) {
          optionAddons += opt.options[selectedVal as number].priceAdd;
        }
      });
    }

    const basePrice = product.price + optionAddons;
    subtotal = basePrice * quantity;
  }

  const total = subtotal;

  // Group printing options logically if available
  // Try to group options into steps intelligently. 
  // Step 1: Format/Size & Material
  // Step 2: Printing sides, finishing, add-ons
  // Step 3: Turnaround (and quantity is added manually to step 3)
  const step1Options = options.filter(o => /format|size|material|package/i.test(o.name));
  const step2Options = options.filter(o => !/format|size|material|package|turnaround|addon/i.test(o.name));
  const step3Addons = options.filter(o => /addon/i.test(o.name));
  const stepTurnaround = options.filter(o => /turnaround/i.test(o.name));

  // Fallback if regex matching didn't catch things evenly (some products may have different names)
  const renderOptions = (opts: typeof options) => {
    return opts.map((opt, i) => (
      <div key={i} className="space-y-3">
        <fieldset>
          <legend className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{opt.name}</legend>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {opt.options.map((val, idx) => (
              <label
                key={idx}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${
                  opt.isMultiSelect ? (Array.isArray(selectedOptions[opt.name]) && (selectedOptions[opt.name] as number[]).includes(idx)) : selectedOptions[opt.name] === idx
                    ? "border-primary bg-primary/5 ring-2 ring-primary/15 dark:bg-primary/10"
                    : "border-gray-200 hover:border-primary/50 dark:border-border dark:hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type={opt.isMultiSelect ? "checkbox" : "radio"}
                    name={opt.name}
                    className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                    checked={opt.isMultiSelect ? Array.isArray(selectedOptions[opt.name]) && (selectedOptions[opt.name] as number[]).includes(idx) : selectedOptions[opt.name] === idx}
                    onChange={() => handleOptionChange(opt.name, idx, opt.isMultiSelect)}
                  />
                  <span className="text-sm font-medium text-gray-800 dark:text-foreground">{val.label}</span>
                </div>
                {val.priceAdd !== 0 && (
                  <span className={`text-sm font-semibold ${val.priceAdd > 0 ? "text-primary" : "text-green-700 dark:text-green-400"}`}>
                    {val.priceAdd > 0 ? "+" : ""}RM {val.priceAdd.toFixed(2)}
                  </span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    ));
  };

  let currentStep = 1;
  const formatStepNum = step1Options.length > 0 ? currentStep++ : 0;
  const printingStepNum = step2Options.length > 0 ? currentStep++ : 0;
  const addonsStepNum = step3Addons.length > 0 ? currentStep++ : 0;
const variationStepNum = (hasImageVariations || hasDesignVariations) ? currentStep++ : 0;
  const sizeStepNum = hasSizeVariations ? currentStep++ : 0;
  const quantityStepNum = currentStep++;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-border dark:bg-card sm:rounded-3xl lg:sticky lg:top-[190px]">
      {supportsCanvas && <section className="m-4 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.1] via-card to-card p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Palette className="size-4" /></span><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Design options</p><h2 className="mt-0.5 text-lg font-bold tracking-tight">How would you like to design?</h2><p className="mt-1 text-sm text-muted-foreground">Choose the easiest option for you. You can change this later.</p></div></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link href={`/diy?product=${encodeURIComponent(product._id)}${isPortraitProduct ? "&mode=frame&source=portrait" : ""}`} className="group relative rounded-xl border-2 border-primary bg-primary/[0.08] p-4 transition hover:-translate-y-0.5 hover:bg-primary/[0.14]">
            <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Recommended</span><Palette className="mb-3 size-5 text-primary" /><span className="block text-sm font-bold text-foreground">{isPortraitProduct ? "Open DIY Frame" : "DIY Yourself"}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{isPortraitProduct ? "Choose a frame template and add your portrait" : "Insert your photos into our templates"}</span>
          </Link>
          <a href="https://wa.me/601116141946?text=Hi%20Kampung%20Cetak%2C%20I%20need%20help%20with%20my%20design." target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-border bg-background/70 p-4 transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/[0.06]"><MessageCircle className="mb-3 size-5 text-primary" /><span className="block text-sm font-bold text-foreground">Kampung Cetak Design</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Our admin will prepare it for you via WhatsApp</span></a>
          <Link href="/home/profile/upload" className="group rounded-xl border border-border bg-background/70 p-4 transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/[0.06]"><Upload className="mb-3 size-5 text-primary" /><span className="block text-sm font-bold text-foreground">I have my own design</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Upload a finished JPG, PNG or PDF</span></Link>
        </div>
        {canvasDesign && <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" checked={useCanvas} onChange={event => setUseCanvas(event.target.checked)} className="mt-1" /><span>Attach my completed design: {canvasDesign.templateName}<span className="block text-xs text-muted-foreground">Template size: {canvasDesign.size}. Select the matching product size below.</span></span></label>}
      </section>}
      
      {/* Product Header inside configurator */}
      <div className="border-b border-gray-200 bg-gray-50/80 p-5 dark:border-border dark:bg-black/20 sm:p-6">
        <span className="mb-3 inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
          {product.category.replace(/-/g, " ")}
        </span>
        <h1 className="font-sans text-xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-foreground sm:text-2xl">{product.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StarRating rating={product.rating} maxRating={5} />
          <span className="text-sm font-medium text-gray-500 dark:text-muted-foreground">{product.rating.toFixed(1)} {label("rating", "penilaian")}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${totalAvailableStock > 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>
            {totalAvailableStock > 0 ? `${totalAvailableStock} ${label("available", "tersedia")}` : label("Out of stock", "Stok habis")}
          </span>
        </div>
        <div className="mt-5 flex items-end justify-between gap-4 border-t border-border pt-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label("Current total", "Jumlah semasa")}</p>
            <p aria-live="polite" className="mt-1 text-2xl font-extrabold tabular-nums text-primary">RM {total.toFixed(2)}</p>
          </div>
{(hasImageVariations || hasDesignVariations) && (
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              selectedVariationIndex === null
                ? "bg-primary/10 text-primary"
                : "bg-green-500/10 text-green-700 dark:text-green-400"
            }`}>
              {selectedVariationIndex === null
                ? label("Design required", "Reka bentuk diperlukan")
                : hasDesignVariations
                  ? designVariations[selectedVariationIndex]?.name || "Selected"
                  : getProductVariation(product, selectedVariationIndex).variantLabel}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6 p-4 sm:space-y-8 sm:p-6">
        
        {/* STEP 2 */}
        {step1Options.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-border pb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">{formatStepNum}</span>
              <h2 className="font-sans text-base font-semibold text-gray-800 dark:text-foreground sm:text-lg">{label("Format & Material", "Format & Bahan")}</h2>
            </div>
            {renderOptions(step1Options)}
          </div>
        )}

        {/* STEP 2 */}
        {step2Options.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-border pb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">{printingStepNum}</span>
              <h2 className="font-sans text-base font-semibold text-gray-800 dark:text-foreground sm:text-lg">{label("Printing & Options", "Cetakan & Pilihan")}</h2>
            </div>
            {renderOptions(step2Options)}
          </div>
        )}

        {/* STEP 3 (ADDONS) */}
        {step3Addons.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-border pb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                {addonsStepNum}
              </span>
              <h2 className="font-sans text-base font-semibold text-gray-800 dark:text-foreground sm:text-lg">{label("Add-ons", "Tambahan")}</h2>
            </div>
            {renderOptions(step3Addons)}
          </div>
        )}

{(hasImageVariations || hasDesignVariations) && (
          <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {variationStepNum}
              </span>
              <div className="min-w-0">
                <h2 className="font-sans text-base font-semibold text-gray-800 dark:text-foreground sm:text-lg">
                  {label("Choose Variation", "Pilih Variasi")}
                </h2>
                <p aria-live="polite" className={`text-xs ${selectedVariationIndex === null ? "font-medium text-primary" : "text-muted-foreground"}`}>
                  {selectedVariationIndex === null
                    ? label("Select one design to continue", "Pilih satu reka bentuk untuk teruskan")
                    : `${label("Selected", "Dipilih")}: ${
                        hasDesignVariations
                          ? designVariations[selectedVariationIndex]?.name || ""
                          : getProductVariation(product, selectedVariationIndex).variantLabel
                      }`}
                </p>
              </div>
            </div>
            <div role="group" aria-label={label("Artwork variations", "Variasi karya")} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {hasDesignVariations
                ? designVariations.map((variation, index) => {
                    const isSelected = selectedVariationIndex === index;
                    const isOut = Number(variation.stock) <= 0;
                    return (
                      <button
                        type="button"
                        key={index}
                        disabled={isOut}
                        onFocus={() => onSelectedImageChange?.(index)}
                        onClick={() => {
                          onSelectedVariationChange?.(index);
                          onSelectedSizeImagesChange?.(variation.images?.length ? variation.images : null);
                        }}
                        aria-pressed={isSelected}
                        aria-label={`${label("Select artwork", "Pilih karya")} ${variation.name || ""}`}
                        className={`relative overflow-hidden rounded-xl border bg-card text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-gray-200 opacity-75 hover:border-primary/50 hover:opacity-100 dark:border-border"
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute right-2 top-2 z-10 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                            <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
                          </span>
                        )}
                        {isOut && (
                          <span className="absolute inset-x-0 top-2 z-10 flex justify-center">
                            <span className="rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-bold text-white">
                              {label("Out of stock", "Stok habis")}
                            </span>
                          </span>
                        )}
                        <span className="flex aspect-[4/3] items-center justify-center bg-muted/20 p-1">
                          <img
                            src={getImageUrl(variation.images?.[0] || product.images[0])}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            className="h-full w-full object-contain object-center"
                          />
                        </span>
                        <span className={`block px-2 py-2.5 text-center text-xs font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                          {variation.name || `${label("Variation", "Variasi")} ${index + 1}`}
                        </span>
                      </button>
                    );
                  })
                : product.images.map((image, index) => {
                const isSelected = selectedVariationIndex === index;
                const variation = getProductVariation(product, index);
                return (
                  <button
                    type="button"
                    key={image}
                    onMouseEnter={() => onSelectedImageChange?.(index)}
                    onFocus={() => onSelectedImageChange?.(index)}
                    onClick={() => onSelectedVariationChange?.(index)}
                    aria-pressed={isSelected}
                    aria-label={`${label("Select artwork", "Pilih karya")} ${variation.variantLabel}`}
                    className={`relative overflow-hidden rounded-xl border bg-card text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-gray-200 opacity-75 hover:border-primary/50 hover:opacity-100 dark:border-border"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute right-2 top-2 z-10 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
                      </span>
                    )}
                    <span className="flex aspect-[4/3] items-center justify-center bg-muted/20 p-1">
                      <img
                        src={getImageUrl(image)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="h-full w-full object-contain object-center"
                      />
                    </span>
                    <span className={`block px-2 py-2.5 text-center text-xs font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {variation.variantLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SIZE VARIATIONS */}
        {hasSizeVariations && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-border pb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">{sizeStepNum}</span>
              <h2 className="font-sans text-base font-semibold text-gray-800 dark:text-foreground sm:text-lg">{label("Choose Size", "Pilih Saiz")}</h2>
            </div>
            <div role="group" aria-label={label("Product size", "Saiz produk")} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {stockBySize.map((size) => {
                const isSelected = selectedSize === size.size;
                const isOut = Number(size.stock) <= 0;
                return (
                  <button
                    key={size.size}
                    type="button"
                    disabled={isOut}
                    onClick={() => { setSelectedSize(size.size); setQuantity(current => Math.min(current, Math.max(1, Number(size.stock) || 1))); }}
                    aria-pressed={isSelected}
                    className={`rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45 ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/15 dark:bg-primary/10"
                        : "border-gray-200 hover:border-primary/50 dark:border-border"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-gray-800 dark:text-foreground">{size.size}</span>
                    <span className={`mt-0.5 block text-xs font-medium ${isOut ? "text-red-600" : "text-muted-foreground"}`}>
                      {isOut ? label("Out of stock", "Stok habis") : `${size.stock} ${label("available", "tersedia")}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* QUANTITY / TURNAROUND */}
        {product.category !== "flyers" && (<div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-border pb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
              {quantityStepNum}
            </span>
            <h2 className="font-sans text-base font-semibold text-gray-800 dark:text-foreground sm:text-lg">{stepTurnaround.length > 0 ? label("Quantity & Turnaround", "Kuantiti & Tempoh Siap") : label("Quantity", "Kuantiti")}</h2>
          </div>
          
          {stepTurnaround.length > 0 ? (() => {
            const turnaroundOpt = stepTurnaround[0];
            const standardQuantities = [100, 200, 300, 500, 1000, 2000];
            
            let optionAddonsWithoutTurnaround = 0;
            if (product.printingOptions) {
              product.printingOptions.forEach(opt => {
                if (opt.name === turnaroundOpt.name) return;
                const selectedVal = selectedOptions[opt.name];
                if (Array.isArray(selectedVal)) {
                  selectedVal.forEach(idx => {
                    if (opt.options[idx]) optionAddonsWithoutTurnaround += opt.options[idx].priceAdd;
                  });
                } else if (selectedVal !== undefined && opt.options[selectedVal as number]) {
                  optionAddonsWithoutTurnaround += opt.options[selectedVal as number].priceAdd;
                }
              });
            }

            return (
              <div role="group" aria-label={label("Quantity and turnaround options", "Pilihan kuantiti dan tempoh siap")}>
                <p className="mt-4 text-xs text-muted-foreground sm:hidden">Swipe horizontally to compare prices</p>
                <div className="mt-2 overflow-x-auto rounded-xl border border-gray-200 dark:border-border sm:mt-4">
                  <table className="w-full min-w-[560px] text-center text-sm">
                  <thead className="bg-gray-50 dark:bg-black/20 border-b border-gray-200 dark:border-border">
                    <tr>
                      <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200">{label("Quantity", "Kuantiti")}</th>
                      {turnaroundOpt.options.map((opt, idx) => (
                        <th key={idx} className="p-3 font-semibold text-gray-700 dark:text-gray-200">{opt.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-border">
                    {standardQuantities.map((q) => (
                      <tr key={q} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-3 text-left font-semibold text-gray-800 dark:text-foreground">{q}</td>
                        {turnaroundOpt.options.map((opt, idx) => {
                          const cellBasePrice = product.price + optionAddonsWithoutTurnaround + opt.priceAdd;
                          const cellSubtotal = cellBasePrice * q;
                          const cellTotal = cellSubtotal * 1.07;
                          const isSelected = quantity === q && selectedOptions[turnaroundOpt.name] === idx;
                          
                          return (
                            <td
                              key={idx}
                              className={`border-l border-gray-200 p-1 transition-all dark:border-border ${isSelected ? "border-2 border-primary bg-primary/10 font-bold text-primary shadow-inner" : "text-gray-600 dark:text-gray-300"}`}
                            >
                              <button
                                type="button"
                                aria-pressed={isSelected}
                                aria-label={`${q}, ${opt.label}, RM ${cellTotal.toFixed(2)}`}
                                onClick={() => {
                                  setQuantity(q);
                                  handleOptionChange(turnaroundOpt.name, idx);
                                }}
                                className="w-full rounded-md p-2 transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                              >
                                RM {cellTotal.toFixed(2)}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              </div>
            );
          })() : null}

          {/* Fallback rendering if there are multiple step 3 options (rare) or if no turnaround opt */}
          {stepTurnaround.length > 1 && renderOptions(stepTurnaround.slice(1))}

          <div className="space-y-3 pt-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{label("Quantity", "Kuantiti")}</label>
            {product.matrixPricing?.enabled && !product.matrixPricing.hideQuantityGrid && availableQuantities.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {availableQuantities.map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuantity(q)}
                    className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      quantity === q 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-gray-200 dark:border-border hover:border-primary/50 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {q} pcs
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-muted/20 p-4 dark:border-border">
                <span className="text-sm font-medium dark:text-foreground">{label("Total Pieces", "Jumlah Unit")}</span>
                <QuantityPicker
                  quantity={quantity}
                  onDecrement={() => setQuantity((q) => Math.max(minQuantity, q - 1))}
                  onIncrement={() => setQuantity((q) => q + 1)}
                   max={maxQuantity}
                  onQuantityChange={setQuantity}
                />
              </div>
            )}
          </div>
        </div>
        )}

{(product.category === 'flyers' || product.category === 'kad-kahwin') && (() => {
        let matrixRow: any = null;
        if (product.matrixPricing?.enabled) {
          const materialOptName = options.find(o => o.name.toLowerCase().includes('material') || o.name.toLowerCase().includes('format'))?.name;
          const laminationOptName = options.find(o => o.name.toLowerCase().includes('lamination') || o.name.toLowerCase().includes('sides') || o.name.toLowerCase().includes('packaging'))?.name;
          
          const selectedMaterial = materialOptName && typeof selectedOptions[materialOptName] === 'number' 
      ? options.find(o => o.name === materialOptName)?.options[selectedOptions[materialOptName] as number]?.label 
      : "";
          const selectedLamination = laminationOptName && typeof selectedOptions[laminationOptName] === 'number' 
      ? options.find(o => o.name === laminationOptName)?.options[selectedOptions[laminationOptName] as number]?.label 
      : "";
      
          matrixRow = product.matrixPricing.pricingData.find((row: any) => 
            row.material === selectedMaterial && row.laminate === selectedLamination
          );
        }

        if (!matrixRow) return null;

        
          const PricingTable = ({ className }: { className: string }) => (
            <div className={`bg-card text-card-foreground p-6 rounded-2xl shadow-sm border border-border mt-6 overflow-x-auto w-full mb-10 ${className}`}>
            <h2 className="text-xl font-bold tracking-tight text-primary mb-4">{product.category === 'kad-kahwin' ? label("Package Pricing", "Harga Pakej") : label("Format & Size Pricing", "Harga Format & Saiz")}</h2>
            <p className="mb-3 text-xs text-muted-foreground sm:hidden">{label("Swipe horizontally to compare prices", "Leret ke sisi untuk membandingkan harga")}</p>
            <table className="w-full min-w-[620px] border-collapse text-center text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="p-3 text-left font-semibold text-foreground border border-border">{label("Quantity", "Kuantiti")}</th>
                  {product.category === 'flyers' ? (
                    <>
                      <th className="p-3 font-semibold text-foreground border border-border w-1/4">A3</th>
                      <th className="p-3 font-semibold text-foreground border border-border w-1/4">A4</th>
                      <th className="p-3 font-semibold text-foreground border border-border w-1/4">A5</th>
                    </>
                  ) : (
                    <th className="p-3 font-semibold text-foreground border border-border w-1/2">{label("Price", "Harga")} (RM)</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {availableQuantities.map((q) => {
                  const qPrices = matrixRow.quantityPrices[q];
                  
                  if (product.category === 'kad-kahwin') {
                    const price = qPrices; // For kad-kahwin, qPrices is just a number
                    const isSelected = quantity === q;
                    return (
                      <tr key={q} className="hover:bg-muted/50 transition-colors">
                        <td className="p-3 text-left font-semibold text-foreground border border-border">{q}</td>
                        <td 
                          onClick={() => {
                            if (price) {
                              setQuantity(q);
                            }
                          }}
                          className={`p-3 border border-border transition-all ${!price ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'cursor-pointer'} ${isSelected ? 'bg-primary/10 border-2 border-primary font-bold text-primary shadow-inner' : 'text-muted-foreground hover:bg-muted/50'}`}
                        >
                          {price ? `RM ${price.toFixed(2)}` : 'N/A'}
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={q} className="hover:bg-muted/50 transition-colors">
                      <td className="p-3 text-left font-semibold text-foreground border border-border">{q}</td>
                      {['A3', 'A4', 'A5'].map((size) => {
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
                            className={`p-3 border border-border transition-all ${!price ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'cursor-pointer'} ${isSelected ? 'bg-primary/10 border-2 border-primary font-bold text-primary shadow-inner' : 'text-muted-foreground hover:bg-muted/50'}`}
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
              {/* Mobile inline render (hidden on desktop) */}
              <PricingTable className="lg:hidden" />
              
              {/* Desktop portal render (hidden on mobile) */}
              {portalEl && createPortal(<PricingTable className="hidden lg:block" />, portalEl)}
            </>
          );
      })()}


        {/* ── PRICE SUMMARY ── */}
        {/* End of conditional */}
        <div className="mt-8 space-y-3 rounded-2xl border border-gray-200 bg-gray-100/70 p-5 dark:border-border dark:bg-black/40">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{label("Subtotal", "Subjumlah")}</span>
            <span>RM {subtotal.toFixed(2)}</span>
          </div>
          <div className="w-full h-px bg-gray-300 dark:bg-border my-2"></div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <span className="text-base font-semibold text-gray-900 dark:text-foreground">{label("Total Price", "Jumlah Harga")}</span>
            <div className="text-right">
              <span className="text-2xl font-extrabold tabular-nums text-primary sm:text-3xl">RM {total.toFixed(2)}</span>
              <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">{label("Delivery price will be shown at checkout", "Caj penghantaran akan dipaparkan semasa checkout")}</p>
            </div>
          </div>
        </div>

        <AnimatedButton
          text={label("Add to Cart", "Tambah ke Troli")}
          type="submit"
          isLoading={isPending}
          className="hidden h-14 w-full cursor-pointer rounded-full bg-primary py-4 text-base font-bold text-primary-foreground shadow-md shadow-primary/15 transition-all hover:brightness-105 active:scale-[0.98] sm:text-lg lg:flex"
          onClick={handleAddToCart}
        />

        <div className="grid gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0 text-primary" />
            <span>{label("Secure checkout", "Pembayaran selamat")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="size-4 shrink-0 text-primary" />
            <span>{label("Shipping at checkout", "Penghantaran semasa checkout")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Headphones className="size-4 shrink-0 text-primary" />
            <span>{label("Customer support", "Khidmat pelanggan")}</span>
          </div>
        </div>

        <div className="h-20 lg:hidden" aria-hidden="true" />
      </div>

      <div className="fixed inset-x-3 bottom-3 z-50 flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-xl lg:hidden">
        <div className="min-w-0 shrink-0">
          <p className="text-[11px] font-medium text-muted-foreground">
{(hasImageVariations || hasDesignVariations) && selectedVariationIndex === null
              ? label("Choose a design", "Pilih reka bentuk")
              : label("Total", "Jumlah")}
          </p>
          <p className="text-lg font-extrabold tabular-nums text-primary">RM {total.toFixed(2)}</p>
        </div>
        <AnimatedButton
          text={label("Add to Cart", "Tambah ke Troli")}
          type="button"
          isLoading={isPending}
          className="h-12 min-w-0 flex-1 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground shadow-md shadow-primary/15"
          onClick={handleAddToCart}
        />
      </div>
    </div>
  );
}
