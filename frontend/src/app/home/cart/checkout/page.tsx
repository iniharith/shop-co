/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { Breadcrumbs } from "@/components/global/breadcrumb";
import React, { useEffect, useState } from "react";
import { isAxiosError } from 'axios';
import Link from 'next/link';
import AddressForm from "@/components/forms/addressForm";
import { useGetCart } from "@/hooks/useCart";
import AnimatedButton from "@/components/animation/animatedButton";
import { useOrder } from "@/hooks/useOrder";
import { getShippingQuotations } from "@/api/order";
import { useSession } from "next-auth/react";
import { getImageUrl } from "@/utils/getImageUrl";
import { getCartLineTotal, getCartUnitPrice, getConfiguredProductImage, getStructuredConfigurationParts } from "@/utils/productConfiguration";
import type { ICartItem } from '@/types/ICart';

function makeQuoteKey(postalCode: string, state: string, country: string, token: string | undefined, items: ICartItem[], revision: number): string {
  return JSON.stringify([postalCode, state, country, token, revision,
    items.map((item) => [item.product?._id, item.size, item.quantity, item.configurationKey])]);
}

const CheckoutPage = () => {
  const [quoteState, setQuoteState] = useState<{ key: string; price: number | null; courier: string | null; error: string | null } | null>(null);
  const [configurationConfirmed, setConfigurationConfirmed] = useState(false);
  const [quoteRevision, setQuoteRevision] = useState(0);
  const { data: session, status: sessionStatus } = useSession();
  const { data: response, isLoading } = useGetCart();
  const cartItems = response?.cart?.items || [];
  const { form, onFormSubmit, control, errors, formRef, handleCheckout, profile, orderSubmitting } = useOrder({
    getShippingPrice: (address) => {
      const key = makeQuoteKey(address.postalCode, address.state, address.country, session?.user?.token, cartItems, quoteRevision);
      return quoteState?.key === key ? quoteState.price : null;
    },
    onShippingQuoteChanged: () => setQuoteRevision((revision) => revision + 1),
  });
  const postalCode = form.watch('postalCode');
  const state = form.watch('state');
  const country = form.watch('country');
  const quoteKey = makeQuoteKey(postalCode, state, country, session?.user?.token, cartItems, quoteRevision);
  const addressReady = postalCode.length >= 5 && state.length > 0 && country.length > 0 && cartItems.length > 0 && !!session?.user?.token;
  const currentQuote = addressReady && quoteState?.key === quoteKey ? quoteState : null;
  const shippingFee = currentQuote?.price ?? null;
  const shippingError = currentQuote?.error ?? null;
  const courierName = currentQuote?.courier ?? null;
  const shippingLoading = addressReady && !currentQuote;

  useEffect(() => {
    if (!addressReady) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await getShippingQuotations(session?.user?.token || "", {
          postalCode: postalCode.trim(),
          state: state.trim(),
          country: country.trim(),
        }, 30000);
        if (cancelled) return;
        if (typeof res?.shippingPrice === 'number' && Number.isFinite(res.shippingPrice)) {
          setQuoteState({ key: quoteKey, price: res.shippingPrice, courier: res.courier || '', error: null });
        } else setQuoteState({ key: quoteKey, price: null, courier: null, error: 'No shipping options available for this address' });
      } catch (err: unknown) {
        if (cancelled) return;
        const serverMessage = isAxiosError(err) ? (err.response?.data as { message?: string } | undefined)?.message : undefined;
        setQuoteState({ key: quoteKey, price: null, courier: null, error: serverMessage || (err instanceof Error ? err.message : 'Failed to get shipping rates') });
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [addressReady, postalCode, state, country, session?.user?.token, quoteKey]);

  const subtotal = cartItems.reduce(
    (acc: number, item) => acc + getCartLineTotal(item),
    0
  );
  const total = subtotal + (shippingFee || 0);
  const productionDays = cartItems.reduce((max: number, item) => Math.max(max, Number(item.product?.productionTurnaround?.standardDays) || 0), 0);

  if (!isLoading && sessionStatus !== 'loading' && cartItems.length === 0) {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <h1 className="text-3xl font-semibold text-foreground">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">Choose a product before starting checkout.</p>
        <Link href="/home/shop" className="mt-6 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2">
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <div className="w-full py-5 md:px-10 px-5">
      <Breadcrumbs />
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Checkout</h1>
      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-3">
        <div className="mt-4 h-min w-full min-w-0 rounded-xl border border-border bg-card px-4 py-4 md:col-span-2">
          <AddressForm
            form={form}
            onFormSubmit={onFormSubmit}
            control={control}
            errors={errors}
            formRef={formRef}
            profile={profile}
          />
        </div>
        <div className="mt-4 flex w-full min-w-0 flex-col gap-4 rounded-xl border border-border bg-card px-4 py-7">
          <div className="w-full">
            <p className="text-xl font-medium border-b border-dashed">
              Order Summary
            </p>

            <div className="w-full border-b border-dashed flex flex-col gap-2">
              <p className="text-lg text-primary/80 mt-2 font-medium border-b border-dashed">
                Items
              </p>
              {cartItems.map((item) => (
                <div
                  key={`${item.product._id}-${item.configurationKey || item.size}`}
                  className="flex w-full items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-3 pb-2">
                    <div className="size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30 p-1">
                      <img
                        src={getImageUrl(getConfiguredProductImage(item.product, item.size, item.configuration))}
                        alt={item.product.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base text-muted-foreground font-medium">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">
                        RM {getCartUnitPrice(item).toFixed(2)} x {item.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">{getStructuredConfigurationParts(item).join(" | ")}</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-base text-muted-foreground font-medium tabular-nums">
                    RM {getCartLineTotal(item).toFixed(2)}
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
                  <div className="text-right text-sm">
                    <p role="alert" className="font-medium text-destructive">{shippingError}</p>
                    <button type="button" onClick={() => setQuoteRevision((revision) => revision + 1)} className="mt-1 font-medium text-foreground underline underline-offset-4">Retry rates</button>
                  </div>
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
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p className="font-semibold text-foreground">Production estimate</p>
                <p className="mt-1 text-muted-foreground">
                  {productionDays > 0 ? `${productionDays} working days after artwork approval` : "Confirmed after artwork review"}
                </p>
              </div>
              <div className="w-full mt-3 border-t border-b border-dashed flex items-center justify-between">
                <p className="text-xl  font-medium">Total</p>
                <p className="text-lg font-medium tabular-nums">
                  {shippingFee === null ? '—' : `RM ${total.toFixed(2)}`}
                </p>
              </div>

               <label className="flex items-start gap-2 text-sm text-muted-foreground">
                 <input type="checkbox" checked={configurationConfirmed} onChange={(event) => setConfigurationConfirmed(event.target.checked)} className="mt-0.5 size-4 accent-primary" />
                 <span>I confirm that my product configuration and design selection are correct.</span>
               </label>
               <AnimatedButton
                 disabled={cartItems.length === 0 || isLoading || orderSubmitting || shippingLoading || shippingFee === null || !!shippingError || !configurationConfirmed}
                className="w-full hover:bg-primary/90 cursor-pointer mt-3 bg-primary text-primary-foreground rounded-lg"
                isLoading={isLoading || orderSubmitting}
                loadingText="Checking out..."
                onClick={handleCheckout}
                text="Place order"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
