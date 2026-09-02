/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { cn } from "@/lib/utils";
import { getImageUrl } from "@/utils/getImageUrl";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ProductGalleryProps {
  images: string[];
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}

export function ProductGallery({ images, selectedIndex, onSelectedIndexChange }: ProductGalleryProps) {
  const displayImages = images?.length > 0 ? images : ["/placeholder.svg"];
  const activeIndex = selectedIndex >= 0 && selectedIndex < displayImages.length ? selectedIndex : 0;
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const showPrevious = () => onSelectedIndexChange(activeIndex === 0 ? displayImages.length - 1 : activeIndex - 1);
  const showNext = () => onSelectedIndexChange(activeIndex === displayImages.length - 1 ? 0 : activeIndex + 1);

  useEffect(() => {
    if (!isZoomOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsZoomOpen(false);
      if (event.key === "ArrowLeft") {
        onSelectedIndexChange(activeIndex === 0 ? displayImages.length - 1 : activeIndex - 1);
      }
      if (event.key === "ArrowRight") {
        onSelectedIndexChange(activeIndex === displayImages.length - 1 ? 0 : activeIndex + 1);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isZoomOpen, activeIndex, displayImages.length, onSelectedIndexChange]);

  return (
    <div className="space-y-4">
      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 p-2 dark:bg-black/40 sm:p-4">
        <img
          src={getImageUrl(displayImages[activeIndex])}
          alt={`Product variation ${activeIndex + 1}`}
          loading="eager"
          decoding="async"
          draggable={false}
          className="h-full w-full object-contain object-center"
        />

        <button
          type="button"
          aria-label="Open fullscreen image"
          onClick={() => setIsZoomOpen(true)}
          className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-neutral-900 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white dark:border-white/10 dark:bg-black/70 dark:text-white dark:hover:bg-black"
        >
          <Maximize2 className="size-4" />
        </button>

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
              aria-label={`Preview design ${index + 1}`}
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
                loading="lazy"
                decoding="async"
                draggable={false}
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

      {isZoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Fullscreen product design ${activeIndex + 1}`}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-3 sm:p-8"
          onClick={() => setIsZoomOpen(false)}
        >
          <button
            type="button"
            aria-label="Close fullscreen image"
            onClick={() => setIsZoomOpen(false)}
            autoFocus
            className="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          >
            <X className="size-5" />
          </button>

          <img
            src={getImageUrl(displayImages[activeIndex])}
            alt={`Fullscreen product design ${activeIndex + 1}`}
            decoding="async"
            draggable={false}
            className="max-h-full max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />

          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous design"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevious();
                }}
                className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:left-6"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                aria-label="Next design"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:right-6"
              >
                <ChevronRight className="size-6" />
              </button>
              <span className="absolute bottom-5 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                {activeIndex + 1} / {displayImages.length}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
