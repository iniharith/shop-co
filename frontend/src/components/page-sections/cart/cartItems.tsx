/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/utils/getImageUrl";

import { QuantityPicker } from "../../global/quantity-picker";
import { FaTrashAlt } from "react-icons/fa";
import { IProduct } from "@/types";
import { useAddtoCart, useRemoveFromCart } from "@/hooks/useCart";
import { getConfiguredProductImage, getDesignNumber, getStructuredConfigurationParts } from "@/utils/productConfiguration";
import { IProductConfiguration } from "@/types/ICart";

interface CartItemsProps {
  product: IProduct;
  qty: number;
  size: string;
  configuration?: IProductConfiguration;
  configurationKey?: string;
  unitPrice?: number;
  fixedPrice?: number;
}

const CartItems = ({ product, qty, size, configuration: structuredConfiguration, configurationKey, unitPrice = product.price, fixedPrice = 0 }: CartItemsProps) => {
  const [quantity, setQuantity] = useState(qty);
  const [disabled, setDisabled] = useState(false);
  const { mutate: cartUpdate, isPending } = useAddtoCart("update");
  const { mutate: removeFromCart, isPending: isRemoving } = useRemoveFromCart();
  useEffect(() => {
    setDisabled(isPending || isRemoving);
  }, [isPending, isRemoving]);

  const configuration = getStructuredConfigurationParts({ size, configuration: structuredConfiguration });
  const designNumber = getDesignNumber(size);
  const selectedImage = getConfiguredProductImage(product, size, structuredConfiguration);
  const handleQuantityChange = (qty: number) => {
    cartUpdate({
      productId: product._id,
      size: size,
      quantity: qty,
      configurationKey,
    });
  };

  const handleRemoveFromCart = () => {
    removeFromCart({
      productId: product._id,
      size: size,
      configurationKey,
    });
  };
  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted/30 p-1.5 sm:h-28 sm:w-28">
          <img
            src={getImageUrl(selectedImage)}
            alt={`${product.name}${designNumber ? ` design ${String(designNumber).padStart(2, "0")}` : ""}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain object-center"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <p className="font-sans text-sm font-semibold leading-snug sm:text-base">{product.name}</p>
          <div className="flex flex-wrap gap-1.5">
            {configuration.map((part) => (
              <span key={part} className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {part}
              </span>
            ))}
          </div>
          <p className="text-sm font-bold tabular-nums text-primary">RM {unitPrice.toFixed(2)} each</p>
          {fixedPrice > 0 && <p className="text-xs text-muted-foreground">Includes RM {fixedPrice.toFixed(2)} fixed service fee</p>}
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:items-end">
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <QuantityPicker
            disabled={disabled}
            quantity={quantity}
            onDecrement={() => {
              setQuantity((q) => Math.max(1, q - 1));
              handleQuantityChange(quantity - 1);
            }}
            onIncrement={() => {
              setQuantity((q) => q + 1);
              handleQuantityChange(quantity + 1);
            }}
            min={1}
            max={
              Array.isArray(product.sizes) && typeof product.sizes[0] === 'object'
                ? (product.sizes.find((e: any) => e.size === (structuredConfiguration?.fulfillmentSize || size.split("|")[0].trim()))?.stock || 10000)
                : 10000
            }
            onQuantityChange={(nextQuantity) => {
              setQuantity(nextQuantity);
              handleQuantityChange(nextQuantity);
            }}
            className="w-[132px]"
          />
          <Button
            variant="outline"
            className="h-12 w-12 cursor-pointer rounded-xl border-border text-muted-foreground transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500 active:scale-95"
            size="icon"
            onClick={handleRemoveFromCart}
          >
            <FaTrashAlt />
          </Button>
        </div>
        <div className="flex items-center justify-between sm:justify-end sm:gap-2">
          <p className="text-xs font-medium text-muted-foreground">Item total</p>
          <p className="text-sm font-bold tabular-nums">
            RM {(unitPrice * quantity + fixedPrice).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartItems;
