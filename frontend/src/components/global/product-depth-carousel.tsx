/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useMemo } from "react";
import Link from "next/link";
import HorizontalDepthFade from "@/components/ui/horizontal-depth-fade";
import ProductCard from "./productCard";
import ProductCardSkeleton from "../loading/ProductCardSkeleton";
import { IProduct } from "@/types";
import { getImageUrl } from "@/utils/getImageUrl";

interface ProductDepthCarouselProps {
  products: IProduct[];
  isLoading: boolean;
}

const SKELETON_COUNT = 8;

export default function ProductDepthCarousel({
  products,
  isLoading,
}: ProductDepthCarouselProps) {
  const images = useMemo(() => {
    if (isLoading) {
      return Array.from({ length: SKELETON_COUNT }, (_, i) => ({
        src: "/placeholder.svg",
        alt: `Loading product ${i + 1}`,
      }));
    }
    return products.map((product) => ({
      src: getImageUrl(product.images?.[0] || "/placeholder.svg"),
      alt: product.name,
    }));
  }, [products, isLoading]);

  return (
    <div className="relative w-full">
      <HorizontalDepthFade
        images={images}
        renderItem={(item, index) =>
          isLoading ? (
            <ProductCardSkeleton />
          ) : (
            <ProductCard product={products[index]} />
          )
        }
        brightnessBoost={55}
        focusSpread={0.14}
        scaleEffect={0.11}
        itemWidth={320}
        itemHeight={440}
        gap="2rem"
        scrollLength={280}
      />
      <Link
        href="/home/shop"
        className="absolute bottom-6 right-6 z-20 rounded-full border border-border bg-background/80 px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur transition-all duration-300 hover:border-primary/40 hover:bg-background hover:shadow-md active:scale-95"
      >
        View all products →
      </Link>
    </div>
  );
}