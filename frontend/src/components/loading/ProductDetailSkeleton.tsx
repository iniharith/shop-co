/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const ProductDetailSkeleton = () => {
  return (
    <div className="max-w-[1600px] mx-auto animate-pulse">
      {/* Breadcrumbs */}
      <div className="px-5 md:px-10 lg:px-14 py-3 flex gap-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-20" />
      </div>

      {/* Two-column: Image (left 7) + Config (right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left: Image carousel */}
        <div className="lg:col-span-7 px-5 md:px-10 lg:pl-14 lg:pr-6 space-y-3">
          <Skeleton className="w-full aspect-square rounded-2xl" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-16 h-16 md:w-20 md:h-20 rounded-xl shrink-0" />
            ))}
          </div>
          <div className="flex justify-center gap-1.5">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-1.5 w-1.5 rounded-full" />
            ))}
          </div>
        </div>

        {/* Right: Config panel */}
        <div className="lg:col-span-5 px-5 md:px-10 lg:pr-14 lg:pl-6 py-6 lg:py-0 space-y-4">
          {/* Product name + price */}
          <div className="space-y-2">
            <Skeleton className="h-7 w-3/4 rounded" />
            <Skeleton className="h-8 w-1/3 rounded" />
          </div>

          {/* Option sections (Orbea-style) */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border-b border-border pb-4 space-y-2.5">
              <Skeleton className="h-3 w-28" />
              <div className="flex gap-1.5">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-9 w-20 rounded-lg" />
                ))}
              </div>
            </div>
          ))}

          {/* Sticky CTA */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-7 w-24" />
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
