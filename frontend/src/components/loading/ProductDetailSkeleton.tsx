/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const ProductDetailSkeleton = () => {
  return (
    <div className="animate-pulse" style={{ height: "calc(100svh - var(--header-height, 70px))" }}>
      {/* Nav-hero skeleton */}
      <div className="sticky z-50 top-0 bg-background border-b border-border grid grid-cols-3 items-center px-4 py-2.5 lg:px-5 lg:py-2">
        <div />
        <Skeleton className="h-4 w-32 justify-self-center" />
        <div className="flex gap-4 justify-self-end">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left: Image area (68%) */}
        <div className="grow relative w-full lg:w-[68%] xl:w-[71%] 2xl:w-3/4">
          <div className="w-full h-full flex items-center justify-center p-8 lg:p-12">
            <Skeleton className="w-full h-full max-h-[70vh] rounded-lg" />
          </div>
          {/* Thumbnail strip skeleton */}
          <div className="absolute bottom-2.5 min-h-[0.625rem] flex items-center justify-center w-full z-[2] lg:bottom-5 lg:min-h-[42px]">
            <div className="hidden lg:flex gap-2 h-[58px] items-end pb-[21px]">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="w-14 h-0 lg:h-14 rounded-lg transition-all duration-500" />
              ))}
            </div>
            <div className="flex gap-2 lg:hidden">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-1.5 w-1.5 rounded-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Config panel (32%) */}
        <div className="h-[62%] lg:h-auto lg:w-[32%] xl:w-[29%] 2xl:w-1/4 shrink-0">
          <div className="bg-background h-full grid lg:rounded-lg overflow-hidden">
            <div className="col-span-full row-span-full p-4 lg:px-4 lg:py-4 xl:px-5 space-y-4">
              {/* Options */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <div className="flex gap-1.5 flex-wrap">
                    {[...Array(3)].map((_, j) => (
                      <Skeleton key={j} className="h-10 w-20 rounded-lg" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Bottom CTA skeleton */}
            <div className="sticky bottom-0 z-[1] bg-background px-4 py-3 rounded-t-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] border-t border-border space-y-2 lg:px-3 lg:py-2 xl:px-5 xl:py-3">
              <Skeleton className="h-12 w-full rounded-[2.5rem]" />
              <div className="flex justify-center gap-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
