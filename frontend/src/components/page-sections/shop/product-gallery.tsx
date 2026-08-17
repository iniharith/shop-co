/**
 * Coded by Harith
 * Kampungcetak ®
 * Orbea-faithful image carousel with floating controls & thumbnail strip
 */
"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/utils/getImageUrl";
import { ChevronLeft, ChevronRight, Bookmark, Share2, Download, Maximize2, Sparkles, List } from "lucide-react";
import { toast } from "sonner";

interface ProductGalleryProps {
  images: string[];
  step: string;
}

export function ProductGallery({ images, step }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const displayImages = images?.length > 0 ? images : ["/logo.png"];

  const goTo = useCallback(
    (idx: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      if (idx < 0) setCurrentIndex(displayImages.length - 1);
      else if (idx >= displayImages.length) setCurrentIndex(0);
      else setCurrentIndex(idx);
      setTimeout(() => setIsTransitioning(false), 300);
    },
    [displayImages.length, isTransitioning]
  );

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goTo(currentIndex - 1);
      if (e.key === "ArrowRight") goTo(currentIndex + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, goTo]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "Kampung Cetak", url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden group/img bg-[#f6f6f8] dark:bg-neutral-950 flex items-center justify-center">
      {/* ── Main image carousel (Orbea: swiper-slide with fade) ── */}
      <div className="relative w-full h-full flex items-center justify-center">
        {displayImages.map((img, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 flex items-center justify-center p-6 lg:p-12 transition-opacity duration-300 ease-in-out",
              index === currentIndex
                ? "opacity-100 z-10"
                : "opacity-0 z-0 pointer-events-none"
            )}
          >
            <img
              src={getImageUrl(img)}
              alt={`Product view ${index + 1}`}
              className="w-full h-full max-h-full object-contain object-center drop-shadow-xl"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* ── Top-Left Floating Controls (Orbea Style: View mode / Spec list) ── */}
      <div className="absolute top-4 left-4 z-20 hidden sm:flex items-center gap-2">
        <button
          type="button"
          title="3D Preview"
          className="size-10 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-md border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center text-foreground hover:scale-105 transition-all duration-150 backdrop-blur-xs"
        >
          <Sparkles className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Specifications"
          className="size-10 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-md border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center text-foreground hover:scale-105 transition-all duration-150 backdrop-blur-xs"
        >
          <List className="w-4 h-4" />
        </button>
      </div>

      {/* ── Top-Right Floating Control: Expand / Fullscreen ── */}
      <div className="absolute top-4 right-4 lg:right-[430px] xl:right-[460px] z-20 hidden sm:flex items-center">
        <button
          type="button"
          onClick={() => {
            const currentImg = displayImages[currentIndex];
            if (currentImg) window.open(getImageUrl(currentImg), "_blank");
          }}
          title="Expand View"
          className="size-10 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-md border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center text-foreground hover:scale-105 transition-all duration-150 backdrop-blur-xs"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* ── Bottom-Left Floating Actions (Orbea: Bookmark, Share, Download) ── */}
      <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setIsBookmarked(!isBookmarked);
            toast.success(isBookmarked ? "Removed from saved" : "Saved to wishlist");
          }}
          title="Save Product"
          className={cn(
            "size-10 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-md border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center hover:scale-105 transition-all duration-150 backdrop-blur-xs",
            isBookmarked ? "text-primary fill-primary" : "text-foreground"
          )}
        >
          <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
        </button>
        <button
          type="button"
          onClick={handleShare}
          title="Share"
          className="size-10 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-md border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center text-foreground hover:scale-105 transition-all duration-150 backdrop-blur-xs"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            const currentImg = displayImages[currentIndex];
            if (currentImg) {
              const a = document.createElement("a");
              a.href = getImageUrl(currentImg);
              a.download = `product-view-${currentIndex + 1}.jpg`;
              a.target = "_blank";
              a.click();
            }
          }}
          title="Download Image"
          className="size-10 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-md border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center text-foreground hover:scale-105 transition-all duration-150 backdrop-blur-xs"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* ── Prev / Next arrows (Orbea style) ── */}
      {displayImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(currentIndex - 1)}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-md border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center text-foreground opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 hover:scale-105 backdrop-blur-xs"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo(currentIndex + 1)}
            aria-label="Next image"
            className="absolute right-4 lg:right-[430px] xl:right-[460px] top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-md border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center text-foreground opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 hover:scale-105 backdrop-blur-xs"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* ── Pagination container: Orbea-style bottom dashes / thumbs ── */}
      {displayImages.length > 1 && (
        <div className="absolute bottom-5 left-0 right-0 lg:right-[420px] xl:right-[450px] flex items-center justify-center z-20 pointer-events-auto">
          {/* Dash line indicators */}
          <div className="flex items-center gap-2 bg-white/80 dark:bg-neutral-900/80 px-4 py-2 rounded-full border border-neutral-200/60 dark:border-neutral-800 backdrop-blur-xs shadow-xs">
            {displayImages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Slide ${index + 1}`}
                className={cn(
                  "h-1 rounded-full transition-all duration-300 cursor-pointer",
                  index === currentIndex
                    ? "w-8 bg-neutral-950 dark:bg-white"
                    : "w-4 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400"
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

