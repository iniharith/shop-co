/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const ProductDetailSkeleton = () => {
  return (
    <div className="max-w-[1400px] mx-auto px-5 md:px-10 space-y-8 animate-pulse">
      {/* Breadcrumbs */}
      <div className="flex gap-2 py-4">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-20" />
      </div>

      {/* Full-width Hero */}
      <Skeleton className="w-full aspect-[21/9] rounded-2xl" />

      {/* Two-column: Gallery + Configurator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Gallery (5 cols) */}
        <div className="lg:col-span-5 flex gap-3">
          {/* Vertical thumbnails */}
          <div className="flex flex-col gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-16 h-16 md:w-20 md:h-20 rounded-lg shrink-0" />
            ))}
          </div>
          {/* Main image */}
          <Skeleton className="w-full aspect-square rounded-xl" />
        </div>

        {/* Right: Configurator (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Skeleton className="h-8 w-3/4 rounded" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-10" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />

          {/* Tab bar */}
          <div className="flex gap-4 mt-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-28 rounded-full" />
            ))}
          </div>

          {/* Option chips */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <div className="flex gap-3 flex-wrap">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-3 flex-wrap">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-20 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
