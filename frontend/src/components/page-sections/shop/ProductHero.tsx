/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { getImageUrl } from "@/utils/getImageUrl";
import { cn } from "@/lib/utils";

interface ProductHeroProps {
  images: string[];
  alt: string;
}

export default function ProductHero({ images, alt }: ProductHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const displayImages = images?.length > 0 ? images : ["/placeholder.svg"];

  const cycleImage = useCallback(() => {
    if (displayImages.length <= 1 || isPaused) return;

    setIsFlashing(true);
    setTimeout(() => {
      setCurrentIndex((prev) => {
        let next;
        do {
          next = Math.floor(Math.random() * displayImages.length);
        } while (next === prev && displayImages.length > 1);
        return next;
      });
      setTimeout(() => setIsFlashing(false), 200);
    }, 120);
  }, [displayImages.length, isPaused]);

  useEffect(() => {
    if (displayImages.length <= 1 || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(cycleImage, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cycleImage, displayImages.length, isPaused]);

  return (
    <div
      className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-2xl bg-muted"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {displayImages.map((img, index) => (
        <div
          key={index}
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            index === currentIndex ? "opacity-100" : "opacity-0"
          )}
        >
          <Image
            src={getImageUrl(img)}
            alt={`${alt} ${index + 1}`}
            fill
            className="object-contain p-4"
            sizes="100vw"
            priority={index === 0}
          />
        </div>
      ))}

      {/* White flash overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-white pointer-events-none z-10 transition-opacity",
          isFlashing ? "animate-[ph-flash_0.4s_ease-out]" : "opacity-0"
        )}
      />

      {/* Image counter */}
      {displayImages.length > 1 && (
        <div className="absolute bottom-4 right-4 z-20 bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {displayImages.length}
        </div>
      )}

      {/* Pause indicator */}
      {isPaused && displayImages.length > 1 && (
        <div className="absolute top-4 right-4 z-20 bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
          Paused
        </div>
      )}
    </div>
  );
}
