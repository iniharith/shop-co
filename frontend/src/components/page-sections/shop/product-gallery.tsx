/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { cn } from "@/lib/utils";
import { getImageUrl } from "@/utils/getImageUrl";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}

export function ProductGallery({ images, productName, selectedIndex, onSelectedIndexChange }: ProductGalleryProps) {
  const displayImages = images?.length > 0 ? images : ["/placeholder.svg"];
  const activeIndex = selectedIndex >= 0 && selectedIndex < displayImages.length ? selectedIndex : 0;
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const showPrevious = () => onSelectedIndexChange(activeIndex === 0 ? displayImages.length - 1 : activeIndex - 1);
  const showNext = () => onSelectedIndexChange(activeIndex === displayImages.length - 1 ? 0 : activeIndex + 1);

  useEffect(() => {
    if (!isZoomOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : openButtonRef.current;
    const focusFrame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLButtonElement>("[data-dialog-close]")?.focus();
    });
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsZoomOpen(false);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        const index = activeIndexRef.current;
        onSelectedIndexChange(index === 0 ? displayImages.length - 1 : index - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        const index = activeIndexRef.current;
        onSelectedIndexChange(index === displayImages.length - 1 ? 0 : index + 1);
      }
      if (event.key === "Tab") {
        const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) || []);
        if (!controls.length) {
          event.preventDefault();
          dialogRef.current?.focus();
          return;
        }
        const first = controls[0];
        const last = controls[controls.length - 1];
        const focusIsOutside = !dialogRef.current?.contains(document.activeElement);
        if (focusIsOutside || document.activeElement === dialogRef.current) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleDialogKeys);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleDialogKeys);
      previouslyFocused?.focus();
    };
  }, [isZoomOpen, displayImages.length, onSelectedIndexChange]);

  return (
    <div className="space-y-4">
      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 p-2 dark:bg-black/40 sm:p-4">
        <Image
          src={getImageUrl(displayImages[activeIndex])}
          alt={`${productName}, image ${activeIndex + 1} of ${displayImages.length}`}
          loading="eager"
          decoding="async"
          draggable={false}
          fill
          sizes="(max-width: 1024px) 100vw, 58vw"
          priority
          placeholder="blur"
          blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' fill='%23e5e7eb'/%3E%3C/svg%3E"
          className="h-full w-full object-contain object-center"
        />

        <button
          type="button"
          ref={openButtonRef}
          aria-label="Open fullscreen image"
          onClick={() => setIsZoomOpen(true)}
          className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-neutral-900 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-white/10 dark:bg-black/70 dark:text-white dark:hover:bg-black"
        >
          <Maximize2 aria-hidden="true" className="size-4" />
        </button>

        {displayImages.length > 1 && (
          <>
            <span aria-live="polite" className="absolute bottom-3 left-3 rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/70 dark:text-white">
              {activeIndex + 1} / {displayImages.length}
            </span>
            <button
              type="button"
              aria-label="Previous variation"
              onClick={showPrevious}
              className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 text-neutral-900 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-white/10 dark:bg-black/70 dark:text-white dark:hover:bg-black"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next variation"
              onClick={showNext}
              className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 text-neutral-900 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-white/10 dark:bg-black/70 dark:text-white dark:hover:bg-black"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </>
        )}
      </div>

      {displayImages.length > 1 && (
        <div aria-label="Product image thumbnails" className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-0.5 py-2">
          {displayImages.map((image, index) => (
            <button
              type="button"
              key={index}
              aria-label={`Show ${productName} image ${index + 1} of ${displayImages.length}`}
              aria-pressed={activeIndex === index}
              className={cn(
                "relative h-20 w-24 flex-none snap-start cursor-pointer overflow-hidden rounded-xl border bg-neutral-100 p-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:bg-black/30 sm:h-24 sm:w-28",
                activeIndex === index
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border opacity-70 hover:border-muted-foreground/50 hover:opacity-100"
              )}
              onClick={() => onSelectedIndexChange(index)}
            >
              <Image
                src={getImageUrl(image)}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                fill
                sizes="112px"
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
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-gallery-dialog-title"
          aria-describedby="product-gallery-dialog-help"
          tabIndex={-1}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-3 sm:p-8"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsZoomOpen(false);
          }}
        >
          <h2 id="product-gallery-dialog-title" className="sr-only">{productName} fullscreen gallery</h2>
          <p id="product-gallery-dialog-help" className="sr-only">Use Left and Right Arrow keys to change images. Press Escape to close.</p>
          <button
            type="button"
            data-dialog-close
            aria-label="Close fullscreen image"
            onClick={() => setIsZoomOpen(false)}
            className="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <X aria-hidden="true" className="size-5" />
          </button>

          <div className="relative h-full w-full">
            <Image
              src={getImageUrl(displayImages[activeIndex])}
              alt={`${productName}, fullscreen image ${activeIndex + 1} of ${displayImages.length}`}
              fill
              sizes="100vw"
              draggable={false}
              className="object-contain"
              onClick={(event) => event.stopPropagation()}
            />
          </div>

          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous design"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevious();
                }}
                className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:left-6"
              >
                <ChevronLeft aria-hidden="true" className="size-6" />
              </button>
              <button
                type="button"
                aria-label="Next design"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:right-6"
              >
                <ChevronRight aria-hidden="true" className="size-6" />
              </button>
              <span aria-live="polite" className="absolute bottom-5 rounded-full border border-white/30 bg-black/70 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                {activeIndex + 1} / {displayImages.length}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
