/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/utils/getImageUrl";

interface ProductGalleryProps {
  images: string[];
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  const displayImages = images?.length > 0 ? images : ["/logo.png"];

  return (
    <div className="flex md:flex-row flex-col-reverse gap-4">
      {displayImages.length > 1 && (
        <div className="flex gap-2 md:flex-col overflow-x-auto py-1">
          {displayImages.map((image, index) => (
            <button
              key={index}
              className={cn(
                "relative cursor-pointer aspect-square h-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all bg-muted",
                selectedImage === index
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/30"
              )}
              onClick={() => setSelectedImage(index)}
            >
              <img
                src={images?.length > 0 ? getImageUrl(image) : image}
                alt={`Product thumbnail ${index + 1}`}
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
      <div className="relative flex items-center justify-center aspect-square w-full overflow-hidden rounded-[1.5rem] bg-muted">
        <img
          src={images?.length > 0 ? getImageUrl(displayImages[selectedImage]) : displayImages[0]}
          alt="Product image"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
