/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/utils/getImageUrl";

interface ProductGalleryProps {
  images: string[];
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  const displayImages = images?.length > 0 ? images : ["/logo.png"];

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  }, []);

  return (
    <div className="flex md:flex-row flex-col-reverse gap-3">
      {/* Vertical thumbnail strip */}
      {displayImages.length > 1 && (
        <div className="flex md:flex-row flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible md:overflow-y-auto py-1 shrink-0">
          {displayImages.map((image, index) => (
            <button
              key={index}
              className={cn(
                "relative cursor-pointer aspect-square h-16 md:h-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200",
                selectedImage === index
                  ? "border-primary shadow-md"
                  : "border-transparent hover:border-muted-foreground/30 opacity-60 hover:opacity-100"
              )}
              onClick={() => setSelectedImage(index)}
            >
              <img
                src={getImageUrl(image)}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image with zoom */}
      <div className="relative flex-1">
        <div
          ref={imageRef}
          className="relative aspect-square w-full overflow-hidden rounded-xl bg-white cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsZooming(true)}
          onMouseLeave={() => setIsZooming(false)}
        >
          <img
            src={getImageUrl(displayImages[selectedImage])}
            alt="Product image"
            className={cn(
              "w-full h-full object-contain transition-transform duration-200",
              isZooming && "scale-150"
            )}
            style={
              isZooming
                ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }
                : undefined
            }
          />
        </div>

        {/* Image counter */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
            {selectedImage + 1} / {displayImages.length}
          </div>
        )}

        {/* Zoom hint */}
        {displayImages.length > 0 && (
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            Hover to zoom
          </div>
        )}
      </div>
    </div>
  );
}
