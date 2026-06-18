"use client";

import { useEffect, useState } from "react";
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
  const { id } = useParams();
  const { data: session } = useSession();
  const { setIsAuthModalOpen } = useUIStore();
  const { mutate, isPending } = useAddtoCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [designOption, setDesignOption] = useState<"upload" | "design">("upload");

  useEffect(() => {
    if (product.printingOptions) {
      const defaults: Record<string, number> = {};
      product.printingOptions.forEach(opt => {
        if (opt.options.length > 0) {
          defaults[opt.name] = 0;
        }
      });
      setSelectedOptions(defaults);
    }
    setQuantity(1);
  }, [product, id]);

  const handleOptionChange = (optionName: string, index: number) => {
    setSelectedOptions(prev => ({ ...prev, [optionName]: index }));
  };

  const handleAddToCart = () => {
    if (!session) {
      toast.error("Please login to add to cart");
      setIsAuthModalOpen(true);
      return;
    }
    
    // We can store the design option in the size field or metadata, but for now we append it to the size to pass it to the backend mock
    const sizeWithDesign = `Standard | Design: ${designOption === "upload" ? "Upload Artwork" : "Need Design Service"}`;
    const artworkUrl = designOption === "upload" ? "https://example.com/mock-uploaded-artwork.pdf" : undefined; // Replace with actual uploaded file URL state if it exists
    mutate({ productId: product._id, size: sizeWithDesign, quantity, artworkUrl });
    toast.success("Added to cart");
  };

  // Calculate prices
  let optionAddons = 0;
  if (product.printingOptions) {
    product.printingOptions.forEach(opt => {
      const selectedIdx = selectedOptions[opt.name];
      if (selectedIdx !== undefined && opt.options[selectedIdx]) {
        optionAddons += opt.options[selectedIdx].priceAdd;
      }
    });
  }

  const basePrice = product.price + optionAddons + (designOption === "design" ? 50 : 0);
  const subtotal = basePrice * quantity;
  const vat = subtotal * 0.07; // 7% VAT
  const total = subtotal + vat;

  // Group printing options logically if available
  const options = product.printingOptions || [];
  
  // Try to group options into steps intelligently. 
  // Step 1: Format/Size & Material
  // Step 2: Printing sides, finishing, add-ons
  // Step 3: Turnaround (and quantity is added manually to step 3)
  const step1Options = options.filter(o => /format|size|material/i.test(o.name));
  const step2Options = options.filter(o => !/format|size|material|turnaround/i.test(o.name));
  const step3Options = options.filter(o => /turnaround/i.test(o.name));

  // Fallback if regex matching didn't catch things evenly (some products may have different names)
  const renderOptions = (opts: typeof options) => {
    return opts.map((opt, i) => (
      <div key={i} className="space-y-3">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{opt.name}</label>
        <div className="grid grid-cols-1 gap-2">
          {opt.options.map((val, idx) => (
            <label 
              key={idx}
              className={`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                selectedOptions[opt.name] === idx 
                  ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm" 
                  : "border-gray-200 dark:border-border hover:border-primary/50 dark:hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <input 
                  type="radio" 
                  name={opt.name} 
                  className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                  checked={selectedOptions[opt.name] === idx}
                  onChange={() => handleOptionChange(opt.name, idx)}
                />
                <span className="text-sm font-medium text-gray-800 dark:text-foreground">{val.label}</span>
              </div>
              {val.priceAdd !== 0 && (
                <span className={`text-sm font-semibold ${val.priceAdd > 0 ? "text-primary" : "text-green-500"}`}>
                  {val.priceAdd > 0 ? "+" : ""}RM {val.priceAdd.toFixed(2)}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="bg-white dark:bg-card rounded-2xl shadow-lg border border-gray-200 dark:border-border sticky top-24 overflow-hidden">
      
      {/* Product Header inside configurator */}
      <div className="p-6 bg-gray-50 dark:bg-black/20 border-b border-gray-200 dark:border-border">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-foreground">{product.name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <StarRating rating={product.rating} maxRating={5} />
          <span className="text-sm text-gray-500 dark:text-muted-foreground">({product.rating} / 5 reviews)</span>
        </div>
      </div>

      <div className="p-6 space-y-8">
        
        {/* STEP 1: Design Options */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-border pb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
              1
            </span>
            <h2 className="text-lg font-bold text-gray-800 dark:text-foreground">Design & Artwork</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
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
                <span className="text-sm font-semibold text-primary">+RM 50.00</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-muted-foreground ml-7 mt-1">Our professional designers will create a stunning custom design for your brand.</p>
            </label>
          </div>
        </div>

        {/* STEP 2 */}
        {step1Options.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-border pb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">2</span>
              <h2 className="text-lg font-bold text-gray-800 dark:text-foreground">Format & Material</h2>
            </div>
            {renderOptions(step1Options)}
          </div>
        )}

        {/* STEP 2 */}
        {step2Options.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-border pb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">3</span>
              <h2 className="text-lg font-bold text-gray-800 dark:text-foreground">Printing & Options</h2>
            </div>
            {renderOptions(step2Options)}
          </div>
        )}

        {/* STEP 3 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-border pb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
              {step1Options.length && step2Options.length ? "4" : step1Options.length || step2Options.length ? "3" : "2"}
            </span>
            <h2 className="text-lg font-bold text-gray-800 dark:text-foreground">Quantity & Turnaround</h2>
          </div>
          
          {renderOptions(step3Options)}

          <div className="space-y-3 pt-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Quantity</label>
            <div className="p-4 border-2 border-gray-200 dark:border-border rounded-xl flex items-center justify-between">
              <span className="text-sm font-medium dark:text-foreground">Total Pieces</span>
              <QuantityPicker
                quantity={quantity}
                onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
                onIncrement={() => setQuantity((q) => q + 1)}
                max={10000}
                onQuantityChange={setQuantity}
              />
            </div>
          </div>
        </div>

        {/* ── PRICE SUMMARY ── */}
        <div className="bg-gray-100 dark:bg-black/40 rounded-xl p-5 space-y-3 mt-8 border border-gray-200 dark:border-border">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span>RM {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>VAT (7%)</span>
            <span>RM {vat.toFixed(2)}</span>
          </div>
          <div className="w-full h-px bg-gray-300 dark:bg-border my-2"></div>
          <div className="flex justify-between items-end">
            <span className="text-base font-semibold text-gray-900 dark:text-foreground">Total Price</span>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-primary">RM {total.toFixed(2)}</span>
              <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">Includes delivery to Malaysia</p>
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
