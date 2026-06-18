"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/utils/getImageUrl";

interface ProductGalleryProps {
  images: string[];
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div className="flex md:flex-row flex-col-reverse gap-4">
      <div className="flex gap-2 md:flex-col  overflow-x-auto py-1">
        {images.map((image, index) => (
          <button
            key={index}
            className={cn(
              "relative cursor-pointer aspect-square h-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all",
              selectedImage === index
                ? "border-primary"
                : "border-transparent hover:border-muted-foreground/30"
            )}
            onClick={() => setSelectedImage(index)}
          >
            <img
              src={getImageUrl(image)}
              alt={`Product thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-400/30">
        <img
          src={getImageUrl(images[selectedImage])}
          alt="Product image"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>
    </div>
  );
}
