/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { Skeleton } from "@/components/ui/skeleton";

const ProductDetailSkeleton = () => {
  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 xl:gap-8" aria-label="Loading product">
      <div className="space-y-5 lg:col-span-7 sm:space-y-6">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:rounded-3xl sm:p-5">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <div className="mt-4 flex gap-2 overflow-hidden">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-20 w-24 shrink-0 rounded-xl sm:h-24 sm:w-28" />
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm sm:rounded-3xl sm:p-6">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <div className="grid gap-2 pt-2 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm sm:rounded-3xl lg:col-span-5">
        <div className="space-y-3 border-b border-border p-5 sm:p-6">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-7 w-4/5" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-4 h-16 w-full" />
        </div>
        <div className="space-y-6 p-4 sm:p-6">
          <Skeleton className="h-8 w-44" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Skeleton key={item} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
