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
              key={index}
              className={cn(
                "relative cursor-pointer aspect-square h-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all",
                activeIndex === index
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/30"
              )}
              onClick={() => onSelectedIndexChange(index)}
            >
              <img
                src={getImageUrl(image)}
                alt={`Product thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
      <div className="relative flex items-center justify-center aspect-square w-full overflow-hidden rounded-md">
        <img
          src={getImageUrl(displayImages[activeIndex])}
          alt="Product image"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
