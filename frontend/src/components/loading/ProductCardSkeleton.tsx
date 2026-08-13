/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const ProductCardSkeleton = () => {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden h-full flex flex-col">
      <div className="relative w-full aspect-square">
        <Skeleton className="h-full bg-muted w-full absolute inset-0" />
      </div>
      <div className="p-3 flex flex-1 flex-col">
        <Skeleton className="h-6 w-3/4 bg-muted mb-3 rounded" />
        <div className="mt-auto">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-14 bg-muted rounded" />
            <Skeleton className="h-5 w-10 bg-muted rounded" />
          </div>
          <Skeleton className="h-7 w-20 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
