/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { Breadcrumbs } from "@/components/global/breadcrumb";
import React from "react";
import CartItems from "@/components/page-sections/cart/cartItems";
import { Button } from "@heroui/button";
import { useRouter } from "nextjs-toploader/app";
import { MdShoppingCart } from "react-icons/md";
import { useClearCart, useGetCart } from "@/hooks/useCart";
import CartPageSkeleton from "@/components/loading/CartPageSkeleton";
import AnimatedButton from "@/components/animation/animatedButton";
import { getCartLineTotal } from "@/utils/productConfiguration";
const page = () => {
  const router = useRouter();
  const { data: response, isLoading } = useGetCart();
  const { mutate: clearCart, isPending } = useClearCart();
  const cartItems = response?.cart?.items || [];
const handleCheckout = () => {
    router.push("/home/cart/checkout");
  };
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6">
      <Breadcrumbs />
      <div className="flex w-full items-center justify-between gap-4">
        <h1 className="mt-3 font-sans text-3xl font-semibold sm:text-4xl">Your cart</h1>
        {cartItems.length > 0 && (
          <AnimatedButton
            className="w-min rounded-full border border-input bg-muted px-4 text-xs text-muted-foreground"
            size="sm"
            isLoading={isPending}
            onClick={() => {
              clearCart({});
            }}
            text="Clear cart"
          />
        )}
      </div>
      {isLoading ? (
        <CartPageSkeleton />
      ) : (
        <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="mt-4 flex h-min w-full flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:col-span-2">
            {cartItems.length > 0 &&
              cartItems.map((item, index) => (
                <div key={`${item.product._id}-${item.configurationKey || item.size}`}>
                  <CartItems
                    product={item.product}
                    qty={item.quantity}
                    size={item.size}
                    configuration={item.configuration}
                    configurationKey={item.configurationKey}
                    unitPrice={item.unitPrice}
                    fixedPrice={item.fixedPrice}
                  />
                  {index < cartItems.length - 1 && (
                    <div className="mt-4 h-px w-full bg-border"></div>
                  )}
                </div>
              ))}
            {cartItems.length === 0 && (
              <div className="w-full flex items-center justify-center h-full">
                <p className="text-muted-foreground flex items-center gap-2">
                  No items in cart{" "}
                  <span className="">
                    <MdShoppingCart />
                  </span>
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 flex w-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-[190px]">
            <div className="w-full">
              <p className="border-b border-border pb-3 font-sans text-lg font-semibold">
                Cart summary
              </p>

              <div className="flex mt-2 flex-col gap-2">
                <div className="w-full  flex items-center text-muted-foreground justify-between">
                  <p className="text-sm text-muted-foreground font-medium">
                    Subtotal
                  </p>
                  <p className="text-sm text-muted-foreground font-medium tabular-nums">
                    RM {" "}
                    {cartItems.reduce(
                      (acc, item) => acc + getCartLineTotal(item),
                      0
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="w-full flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-medium">
                    Shipping
                  </p>
                  <p className="max-w-[160px] text-right text-sm text-muted-foreground font-medium">
                    Calculated at checkout
                  </p>
                </div>
                <div className="mt-4 flex w-full items-center justify-between border-t border-border pt-4">
                  <p className="text-lg font-semibold">Total</p>
                  <p className="text-xl font-bold tabular-nums text-primary">
                    RM {" "}
                    {cartItems.reduce(
                      (acc, item) => acc + getCartLineTotal(item),
                      0
                    ).toFixed(2)}
                  </p>
                </div>
                <Button
                  onPress={() => {
                    if (cartItems.length > 0) {
                      handleCheckout();
                    } else {
                      router.push("/home/shop");
                    }
                  }}
                  className="mt-4 h-12 w-full cursor-pointer rounded-full bg-primary font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
                >
                  {cartItems.length > 0 ? "Checkout" : "Go to shop"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default page;
