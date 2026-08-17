/**
 * Coded by Harith
 * Kampungcetak ®
 * Orbea-faithful image carousel with thumbnail strip
 */
"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/utils/getImageUrl";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  step: string;
}

export function ProductGallery({ images, step }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  return (
    <div className="relative w-full h-full select-none overflow-hidden group/img">
      {/* ── Main image carousel (Orbea: swiper-slide with fade) ── */}
      <div className="relative w-full h-full">
        {displayImages.map((img, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-opacity duration-300 ease-in-out",
              index === currentIndex
                ? "opacity-100 z-10"
                : "opacity-0 z-0 pointer-events-none"
            )}
          >
            <img
              src={getImageUrl(img)}
              alt={`Product view ${index + 1}`}
              className="w-full h-full object-contain p-8 lg:p-12"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* ── Prev / Next arrows (Orbea: inside slider) ── */}
      {displayImages.length > 1 && (
        <>
          <button
            onClick={() => goTo(currentIndex - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 hover:bg-black/40"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => goTo(currentIndex + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 hover:bg-black/40"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* ── Pagination container (Orbea: absolute bottom, flex center) ── */}
      {displayImages.length > 1 && (
        <div className="absolute bottom-2.5 min-h-[0.625rem] flex items-center justify-center w-full z-[2] lg:bottom-5 lg:min-h-[42px]">
          {/* ── Mobile: dot indicators (Orbea: 1180:hidden) ── */}
          <div className="flex flex-wrap gap-2 lg:hidden">
            {displayImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === currentIndex
                    ? "w-6 bg-foreground"
                    : "w-1.5 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          {/* ── Desktop: thumbnail strip (Orbea: group with h-0→h-[58px] thumbs) ── */}
          <div className="group hidden lg:flex flex-wrap gap-2 h-[58px] items-end justify-center pb-[21px] relative">
            {displayImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "orbea-thumb",
                  currentIndex === index && "active"
                )}
              >
                <img
                  src={getImageUrl(img)}
                  alt={`Thumb ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
