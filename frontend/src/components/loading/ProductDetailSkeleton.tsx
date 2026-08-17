/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const ProductDetailSkeleton = () => {
  return (
    <div className="product-detail flex flex-col lg:flex-row animate-pulse">
      {/* Left: Image area (68%) */}
      <div className="grow relative w-full lg:w-[68%] xl:w-[70%] 2xl:w-3/4">
        {/* Breadcrumbs */}
        <div className="absolute top-0 left-0 right-0 z-10 px-5 lg:px-8 py-3 flex gap-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
        {/* Main image */}
        <div className="w-full h-full flex items-center justify-center p-8 lg:p-12">
          <Skeleton className="w-full h-full max-h-[70vh] rounded-lg" />
        </div>
        {/* Thumbnails */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-14 h-14 lg:h-0 lg:group-hover:h-14 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Right: Config panel (32%) */}
      <div className="h-[62%] lg:h-auto lg:w-[32%] xl:w-[30%] 2xl:w-1/4 shrink-0">
        <div className="bg-background h-full grid lg:rounded-lg overflow-hidden">
          <div className="col-span-full row-span-full p-4 lg:p-5 space-y-4">
            {/* Step nav */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <Skeleton className="h-4 w-40" />
              <div className="flex gap-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-3 w-16" />
                ))}
              </div>
            </div>
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
            {/* Bottom CTA */}
            <div className="sticky bottom-0 pt-4 border-t border-border space-y-2">
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
