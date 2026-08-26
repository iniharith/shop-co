/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { cn } from "@/lib/utils";
import { getImageUrl } from "@/utils/getImageUrl";

interface ProductGalleryProps {
  images: string[];
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}

export function ProductGallery({ images, selectedIndex, onSelectedIndexChange }: ProductGalleryProps) {
  const displayImages = images?.length > 0 ? images : ["/placeholder.svg"];
  const activeIndex = selectedIndex >= 0 && selectedIndex < displayImages.length ? selectedIndex : 0;

  return (
    <div className="flex md:flex-row flex-col-reverse gap-4">
      {displayImages.length > 1 && (
        <div className="flex gap-2 md:flex-col overflow-x-auto md:overflow-x-hidden md:overflow-y-auto md:max-h-[32rem] py-1">
          {displayImages.map((image, index) => (
            <button
              type="button"
              key={index}
              aria-label={`Select variation ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={cn(
                "relative cursor-pointer aspect-square h-20 flex-shrink-0 overflow-hidden rounded-md border-2 bg-muted/20 p-1 transition-all",
                activeIndex === index
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/30"
              )}
              onClick={() => onSelectedIndexChange(index)}
            >
              <img
                src={getImageUrl(image)}
                alt={`Variation ${index + 1}`}
                className="h-full w-full object-contain object-center"
              />
            </button>
          ))}
        </div>
      )}
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-muted/10 p-2">
        <img
          src={getImageUrl(displayImages[activeIndex])}
          alt={`Product variation ${activeIndex + 1}`}
          className="h-full w-full object-contain object-center"
        />
      </div>
    </div>
  );
}
