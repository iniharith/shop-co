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

interface ProductDetailsProps {
  product: IProduct;
}

export function ProductDetails({ product }: ProductDetailsProps) {
          <StarRating rating={product.rating} maxRating={5} />
          <span className="text-sm text-gray-500 dark:text-muted-foreground">({product.rating} / 5 reviews)</span>
        </div>
      </div>

      <div className="p-6 space-y-8">
        
        {/* STEP 1: Design Options */}
        {product.category?.toLowerCase() !== "islamic khat" && (
          <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-border pb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
              {designStepNum}
            </span>
            <h2 className="text-lg font-bold text-gray-800 dark:text-foreground">Design & Artwork</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {product.name?.toLowerCase() === "portrait" ? (
              <div className="flex flex-col p-6 border-2 border-primary bg-primary/5 dark:bg-primary/10 rounded-xl shadow-sm text-center">
                <h3 className="text-xl font-black text-gray-900 dark:text-foreground uppercase mb-2">
                  UPLOAD YOUR PICTURE AT PROFILE PAGE
                </h3>
                <p className="text-base text-gray-600 dark:text-muted-foreground">
                  AFTER YOU HAVE PLACED THE ORDER
                </p>
              </div>
            ) : (
              <>
                <label className={`flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  designOption === "upload" 
                    ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm" 
                    : "border-gray-200 dark:border-border hover:border-primary/50"
                }`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="designOption" 
                      className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                      checked={designOption === "upload"}
                      onChange={() => setDesignOption("upload")}
                    />
                    <span className="text-sm font-bold text-gray-800 dark:text-foreground">I have my own design</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground ml-7 mt-1">Upload your print-ready artwork (PDF, AI, PSD) during checkout or in your dashboard.</p>
                </label>

                <label className={`flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  designOption === "design" 
                    ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm" 
                    : "border-gray-200 dark:border-border hover:border-primary/50"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="designOption" 
                        className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                        checked={designOption === "design"}
                        onChange={() => setDesignOption("design")}
                      />
                      <span className="text-sm font-bold text-gray-800 dark:text-foreground">Let KampungCetak design for you</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">+RM 100.00</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground ml-7 mt-1">Our professional designers will create a stunning custom design for your brand.</p>
                </label>
              </>
            )}
          </div>
        </div>
        )}

        {/* STEP 2 */}
        {step1Options.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-border pb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">{formatStepNum}</span>
              <h2 className="text-lg font-bold text-gray-800 dark:text-foreground">Format & Material</h2>
            </div>
            {renderOptions(step1Options)}
          </div>
        )}

        {/* STEP 2 */}
        {step2Options.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-border pb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">{printingStepNum}</span>
              <h2 className="text-lg font-bold text-gray-800 dark:text-foreground">Printing & Options</h2>
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
              <h2 className="text-lg font-bold text-gray-800 dark:text-foreground">Addons</h2>
            </div>
            {renderOptions(step3Addons)}
          </div>
        )}

        {/* QUANTITY / TURNAROUND */}
        {product.category !== "flyers" && (<div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-border pb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
              {quantityStepNum}
            </span>
            <h2 className="text-lg font-bold text-gray-800 dark:text-foreground">{stepTurnaround.length > 0 ? 'Quantity & Turnaround' : 'Quantity'}</h2>
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
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-border mt-4">
                <table className="w-full text-sm text-center">
                  <thead className="bg-gray-50 dark:bg-black/20 border-b border-gray-200 dark:border-border">
                    <tr>
                      <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200">Quantity</th>
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
                          const cellBasePrice = product.price + optionAddonsWithoutTurnaround + opt.priceAdd + (designOption === "design" ? 100 : 0);
                          const cellSubtotal = cellBasePrice * q;
                          const cellTotal = cellSubtotal * 1.07;
                          const isSelected = quantity === q && selectedOptions[turnaroundOpt.name] === idx;
                          
                          return (
                            <td 
                              key={idx} 
                              onClick={() => {
                                setQuantity(q);
                                handleOptionChange(turnaroundOpt.name, idx);
                              }}
                              className={`p-3 cursor-pointer transition-all border-l border-gray-200 dark:border-border ${isSelected ? "bg-primary/10 border-2 border-primary font-bold text-primary shadow-inner" : "text-gray-600 dark:text-gray-400 hover:bg-primary/5"}`}
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
          })() : null}

          {/* Fallback rendering if there are multiple step 3 options (rare) or if no turnaround opt */}
          {stepTurnaround.length > 1 && renderOptions(stepTurnaround.slice(1))}

          <div className="space-y-3 pt-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Quantity</label>
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
              <div className="p-4 border-2 border-gray-200 dark:border-border rounded-xl flex items-center justify-between">
                <span className="text-sm font-medium dark:text-foreground">Total Pieces</span>
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
            <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6 overflow-x-auto w-full mb-10 ${className}`}>
            <h2 className="text-xl font-bold tracking-tight text-primary mb-4">{product.category === 'kad-kahwin' ? 'Package Pricing' : 'Format & Size Pricing'}</h2>
            <table className="w-full text-sm text-center border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-700 border border-gray-200">Quantity</th>
                  {product.category === 'flyers' ? (
                    <>
                      <th className="p-3 font-semibold text-gray-700 border border-gray-200 w-1/4">A3</th>
                      <th className="p-3 font-semibold text-gray-700 border border-gray-200 w-1/4">A4</th>
                      <th className="p-3 font-semibold text-gray-700 border border-gray-200 w-1/4">A5</th>
                    </>
                  ) : (
                    <th className="p-3 font-semibold text-gray-700 border border-gray-200 w-1/2">Price (RM)</th>
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
                      <tr key={q} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 text-left font-semibold text-gray-800 border border-gray-200">{q}</td>
                        <td 
                          onClick={() => {
                            if (price) {
                              setQuantity(q);
                            }
                          }}
                          className={`p-3 border border-gray-200 transition-all ${!price ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'cursor-pointer'} ${isSelected ? 'bg-primary/10 border-2 border-primary font-bold text-primary shadow-inner' : 'text-gray-600 hover:bg-primary/5'}`}
                        >
                          {price ? `RM ${price.toFixed(2)}` : 'N/A'}
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={q} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-left font-semibold text-gray-800 border border-gray-200">{q}</td>
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
                            className={`p-3 border border-gray-200 transition-all ${!price ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'cursor-pointer'} ${isSelected ? 'bg-primary/10 border-2 border-primary font-bold text-primary shadow-inner' : 'text-gray-600 hover:bg-primary/5'}`}
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
        <div className="bg-gray-100 dark:bg-black/40 rounded-xl p-5 space-y-3 mt-8 border border-gray-200 dark:border-border">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span>RM {subtotal.toFixed(2)}</span>
          </div>
          <div className="w-full h-px bg-gray-300 dark:bg-border my-2"></div>
          <div className="flex justify-between items-end">
            <span className="text-base font-semibold text-gray-900 dark:text-foreground">Total Price</span>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-primary">RM {total.toFixed(2)}</span>
              <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">Delivery price will be shown at checkout</p>
            </div>
          </div>
        </div>

        <AnimatedButton
          text="Add to Cart"
          type="submit"
          isLoading={isPending}
          className="w-full bg-primary text-primary-foreground py-4 font-bold text-lg rounded-xl active:scale-95 transition-all cursor-pointer shadow-lg shadow-primary/20 hover:shadow-primary/40"
          onClick={handleAddToCart}
        />
      </div>

      

    </div>
  );
}
