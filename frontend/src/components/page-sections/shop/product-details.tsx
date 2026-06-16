"use client";

import { useEffect, useState } from "react";
import { QuantityPicker } from "@/components/global/quantity-picker";
import { StarRating } from "@/components/global/star-rating";
import { IProduct, IPrintingOption } from "@/types/IProduct";
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

  const [quantity, setQuantity] = useState(100); // Typical printing starting quantity
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});

  useEffect(() => {
    // Initialize default options
    if (product.printingOptions) {
      const defaults: Record<string, number> = {};
      product.printingOptions.forEach(opt => {
        if (opt.options.length > 0) {
          defaults[opt.name] = 0; // Select first option by default
        }
      });
      setSelectedOptions(defaults);
    }
    setQuantity(100);
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
    mutate({ productId: product._id, size: "Standard", quantity });
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

  const basePrice = product.price + optionAddons;
  const subtotal = basePrice * (quantity / 100); // Assume base price is per 100 units
  const vat = subtotal * 0.07; // 7% VAT example
  const total = subtotal + vat;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-primary">{product.name}</h1>
        
        <div className="flex items-center gap-2">
          <StarRating rating={product.rating} maxRating={5} />
          <span className="text-sm text-gray-500">({product.rating} / 5)</span>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 my-6"></div>

      {/* ── PRINTING OPTIONS ── */}
      <div className="space-y-6">
        {product.printingOptions && product.printingOptions.map((opt, i) => (
          <div key={i} className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">{opt.name}</label>
            <div className="grid grid-cols-1 gap-2">
              {opt.options.map((val, idx) => (
                <label 
                  key={idx}
                  className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${
                    selectedOptions[opt.name] === idx 
                      ? "border-primary bg-primary/5 ring-1 ring-primary" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name={opt.name} 
                      className="w-4 h-4 text-primary focus:ring-primary"
                      checked={selectedOptions[opt.name] === idx}
                      onChange={() => handleOptionChange(opt.name, idx)}
                    />
                    <span className="text-sm text-gray-800">{val.label}</span>
                  </div>
                  {val.priceAdd > 0 && (
                    <span className="text-sm text-gray-500">+${val.priceAdd.toFixed(2)}</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Quantity</label>
          <QuantityPicker
            quantity={quantity}
            onDecrement={() => setQuantity((q) => Math.max(100, q - 100))}
            onIncrement={() => setQuantity((q) => q + 100)}
            max={10000}
            onQuantityChange={setQuantity}
          />
          <p className="text-xs text-gray-500">Order in multiples of 100.</p>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 my-6"></div>

      {/* ── PRICE SUMMARY ── */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>VAT (7%)</span>
          <span>${vat.toFixed(2)}</span>
        </div>
        <div className="w-full h-px bg-gray-200"></div>
        <div className="flex justify-between items-end">
          <span className="text-base font-semibold text-gray-900">Total Price</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
            <p className="text-xs text-gray-500">includes delivery</p>
          </div>
        </div>
      </div>

      <AnimatedButton
        text="Add to Cart"
        type="submit"
        isLoading={isPending}
        className="w-full bg-primary text-white py-4 font-semibold rounded-xl active:scale-95 transition-all cursor-pointer shadow-md hover:shadow-lg"
        onClick={handleAddToCart}
      />
    </div>
  );
}
