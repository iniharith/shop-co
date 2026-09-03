/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import type { IProduct } from "@/types/IProduct";
import Image from "next/image";
import Link from "next/link";
import { getImageUrl } from "@/utils/getImageUrl";

interface ProductCardProps {
  product: IProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const imagePath = product.images?.[0] || "/placeholder.svg";
  const thumbnailPath = imagePath.startsWith("/images/catalog/") && imagePath.endsWith(".webp")
    ? imagePath.replace("/images/catalog/", "/images/catalog/thumbs/")
    : imagePath;
  const image = getImageUrl(thumbnailPath);
  const hasDiscount = product.discount > 0 && product.originalPrice > product.price;
  const availableStock = product.sizes?.reduce((total, size) => total + Number(size.stock || 0), 0) ?? 0;

  return (
    <Link
      href={`/home/shop/${product._id}`}
      aria-label={`View ${product.name}, starting at RM ${product.price}`}
      className="bg-card text-card-foreground border border-border shrink-0 hover:bg-muted/60 transition-colors cursor-pointer rounded-xl overflow-hidden h-full flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="relative w-full aspect-square overflow-hidden bg-muted/10 p-2">
        {product.images?.length > 1 && (
          <span className="absolute left-2 top-2 z-10 rounded-full border border-border bg-card/90 px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur">
            {product.images.length} designs
          </span>
        )}
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          placeholder="blur"
          blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' fill='%23e5e7eb'/%3E%3C/svg%3E"
          className="object-contain object-center p-2"
        />
        {product.images?.length > 1 && (
          <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 rounded-md bg-card/85 p-1 backdrop-blur" aria-label={`${product.images.length} design previews`}>
            {product.images.slice(0, 4).map((preview, index) => (
              <img key={`${preview}-${index}`} src={getImageUrl(preview)} alt="" loading="lazy" className="size-8 rounded border border-border bg-muted object-contain" />
            ))}
          </div>
        )}
      </div>
      <div className="w-full p-3 flex flex-1 flex-col">
        <h3 className="mb-2 font-sans text-sm font-semibold leading-snug sm:text-base md:text-lg">{product.name}</h3>
        <div className="mt-auto">
          {hasDiscount && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground line-through">
                RM {product.originalPrice}
              </span>
              <span className="text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">
                -{product.discount}%
              </span>
            </div>
          )}
          <div className="flex items-end justify-between gap-2">
            <div className="font-bold text-xl">RM {product.price}</div>
            <span className={`text-xs font-semibold ${availableStock > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {availableStock > 0 ? `${availableStock} available` : "Out of stock"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
