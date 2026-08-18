/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { Breadcrumbs } from "@/components/global/breadcrumb";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { useRouter } from "nextjs-toploader/app";
import AddressForm from "@/components/forms/addressForm";
import { useGetCart } from "@/hooks/useCart";
import AnimatedButton from "@/components/animation/animatedButton";
import { toast } from "sonner";
import { useOrder } from "@/hooks/useOrder";
import { getShippingQuotations } from "@/api/order";
import { useSession } from "next-auth/react";

const DEFAULT_WEIGHT = 1;
const DEFAULT_DIMENSIONS = { width: 20, length: 30, height: 5 };

function estimateCartWeight(cartItems: any[]): number {
  let totalWeight = 0;
  const sizeMap: Record<string, number> = {
    A3: 0.12474,
    A4: 0.06237,
    A5: 0.03108,
    A6: 0.01554,
  };
  for (const item of cartItems) {
    let area = 0.06237;
    const sizeName = (item.size || "").toUpperCase();
    for (const [key, val] of Object.entries(sizeMap)) {
      if (sizeName.includes(key)) {
        area = val;
        break;
      }
    }
    const qty = item.quantity || 1;
    totalWeight += (qty * 128 * area) / 1000;
  }
  totalWeight += 0.2;
  if (totalWeight < 1) totalWeight = 1;
  return Number(totalWeight.toFixed(2));
}

const page = () => {
  const { form, onFormSubmit, control, errors, formRef, handleCheckout } = useOrder();
  const router = useRouter();
  const { data: session } = useSession();

  const { data: response, isLoading } = useGetCart();
  const cartItems = response?.cart?.items || [];

  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [courierName, setCourierName] = useState<string | null>(null);

  const postalCode = form.watch("postalCode");
  const state = form.watch("state");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!postalCode || postalCode.length < 5 || !state || state.length < 1) {
      setShippingFee(null);
      setShippingError(null);
      setCourierName(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setShippingLoading(true);
      setShippingError(null);
      try {
        const weight = cartItems.length > 0 ? estimateCartWeight(cartItems) : DEFAULT_WEIGHT;
        const res = await getShippingQuotations(session?.user?.token || "", {
          postalCode: postalCode.trim(),
          state: state.trim(),
          country: "Malaysia",
          weight,
          ...DEFAULT_DIMENSIONS,
        }, 30000);
        const groups = Array.isArray(res?.quotations) ? res.quotations : [];
        const quotations = groups.flatMap((group: any) => Array.isArray(group?.quotations) ? group.quotations : Array.isArray(group) ? group : []);
        if (quotations.length > 0) {
          const getQuotationPrice = (q: any) => Number(q?.pricing?.total_amount || q?.pricing?.shipment_price || q?.price || q?.total_amount || q?.shipping_price) || Infinity;
          const cheapest = quotations.reduce((min: any, q: any) => {
            return getQuotationPrice(q) < getQuotationPrice(min) ? q : min;
          });
          const price = getQuotationPrice(cheapest);
          setShippingFee(price === Infinity ? 0 : price);
          setCourierName(cheapest?.courier?.courier_name || cheapest?.courier?.service_name || cheapest?.courier_name || "");
        } else {
          setShippingFee(null);
          setShippingError(res?.error || "No shipping options available for this address");
        }
      } catch (err: any) {
        setShippingFee(null);
        setShippingError(err?.response?.data?.message || err?.message || "Failed to get shipping rates");
      } finally {
        setShippingLoading(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [postalCode, state, cartItems, session?.user?.token]);

  const subtotal = cartItems.reduce(
    (acc: number, item: any) => acc + item.product.price * item.quantity,
    0
  );
  const total = subtotal + (shippingFee || 0);

  return (
    <div className="w-full py-5 md:px-10 px-5">
      <Breadcrumbs />
      <h1 className="text-4xl mt-3 font-bold">Checkout</h1>
      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-3">
        <div className="w-full col-span-2 rounded-lg bg-gray-300/10 border-input border-1 h-min py-4 px-4 mt-4">
          <AddressForm
            form={form}
            onFormSubmit={onFormSubmit}
            control={control}
            errors={errors}
            formRef={formRef as any}
          />
        </div>
        <div className="w-full rounded-lg bg-gray-300/10 border-input border-1 py-7 mt-4 flex flex-col gap-4 md:px-4 px-2">
          <div className="w-full">
            <p className="text-xl font-medium border-b border-dashed">
              Order Summary
            </p>

            <div className="w-full border-b border-dashed flex flex-col gap-2">
              <p className="text-lg text-primary/80 mt-2 font-medium border-b border-dashed">
                Items
              </p>
              {cartItems.map((item: any, index: number) => (
                <div
                  key={index}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex flex-col pb-2">
                    <p className="text-base text-muted-foreground font-medium">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                      RM {item.product.price}x{item.quantity}
                    </p>
                  </div>
                  <p className="text-base text-muted-foreground font-medium">
                    RM {(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex mt-4 flex-col gap-2">
              <div className="w-full  flex items-center text-primary/90 justify-between">
                <p className="text-lg  font-medium">Subtotal</p>
                <p className="text-lg  font-medium">
                  RM {subtotal.toFixed(2)}
                </p>
              </div>
              <div className="w-full flex items-center text-primary/90 justify-between">
                <p className="text-lg  font-medium">Shipping</p>
                {shippingLoading ? (
                  <p className="text-sm text-muted-foreground font-medium">Calculating...</p>
                ) : shippingFee !== null ? (
                  <div className="flex flex-col items-end">
                    <p className="text-lg font-medium">RM {shippingFee.toFixed(2)}</p>
                    {courierName && (
                      <p className="text-xs text-muted-foreground">{courierName}</p>
                    )}
                  </div>
                ) : shippingError ? (
                  <p className="text-sm text-destructive font-medium">{shippingError}</p>
                ) : (
                  <p className="text-sm text-muted-foreground font-medium">Enter address</p>
                )}
              </div>
              <div className="w-full flex flex-col">
                <p className="text-lg  font-medium">Payment Method</p>
                <p className="text-sm text-muted-foreground font-medium">
                  Cash on Delivery
                </p>
              </div>
              <div className="w-full mt-3 border-t border-b border-dashed flex items-center justify-between">
                <p className="text-xl  font-medium">Total</p>
                <p className="text-lg   font-medium">
                  RM {total.toFixed(2)}
                </p>
              </div>

              <AnimatedButton
                disabled={cartItems.length === 0 || isLoading}
                className="w-full hover:bg-primary/90 cursor-pointer mt-3 bg-primary text-primary-foreground rounded-lg"
                isLoading={isLoading}
                loadingText="Checking out..."
                onClick={() => {
                  if (cartItems.length > 0) {
                    handleCheckout();
                  } else {
                    toast.error("No items in cart", {
                      description: "Please add some items to your cart",
                    });
                    router.push("/home/shop");
                  }
                }}
                text={cartItems.length > 0 ? "Checkout" : "No items in cart"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
