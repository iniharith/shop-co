/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { cn } from "@/lib/utils";
import { getImageUrl } from "@/utils/getImageUrl";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}

export function ProductGallery({ images, selectedIndex, onSelectedIndexChange }: ProductGalleryProps) {
  const displayImages = images?.length > 0 ? images : ["/placeholder.svg"];
  const activeIndex = selectedIndex >= 0 && selectedIndex < displayImages.length ? selectedIndex : 0;
  const showPrevious = () => onSelectedIndexChange(activeIndex === 0 ? displayImages.length - 1 : activeIndex - 1);
  const showNext = () => onSelectedIndexChange(activeIndex === displayImages.length - 1 ? 0 : activeIndex + 1);

  return (
    <div className="space-y-4">
      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 p-2 dark:bg-black/40 sm:p-4">
        <img
          src={getImageUrl(displayImages[activeIndex])}
          alt={`Product variation ${activeIndex + 1}`}
          className="h-full w-full object-contain object-center"
        />

        {displayImages.length > 1 && (
          <>
            <span className="absolute bottom-3 left-3 rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/70 dark:text-white">
              {activeIndex + 1} / {displayImages.length}
            </span>
            <button
              type="button"
              aria-label="Previous variation"
              onClick={showPrevious}
              className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 text-neutral-900 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white dark:border-white/10 dark:bg-black/70 dark:text-white dark:hover:bg-black"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next variation"
              onClick={showNext}
              className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 text-neutral-900 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white dark:border-white/10 dark:bg-black/70 dark:text-white dark:hover:bg-black"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {displayImages.length > 1 && (
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-0.5 py-1">
          {displayImages.map((image, index) => (
            <button
              type="button"
              key={index}
              aria-label={`Select variation ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={cn(
                "relative h-20 w-24 flex-none snap-start cursor-pointer overflow-hidden rounded-xl border bg-neutral-100 p-1.5 transition-all dark:bg-black/30 sm:h-24 sm:w-28",
                activeIndex === index
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border opacity-70 hover:border-muted-foreground/50 hover:opacity-100"
              )}
              onClick={() => onSelectedIndexChange(index)}
            >
              <img
                src={getImageUrl(image)}
                alt={`Variation ${index + 1}`}
                className="h-full w-full object-contain object-center"
              />
              <span className={cn(
                "absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
                activeIndex === index ? "bg-primary text-primary-foreground" : "bg-black/65 text-white"
              )}>
                {index + 1}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
