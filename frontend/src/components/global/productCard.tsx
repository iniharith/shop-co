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

  return (
    <Link
      href={`/home/shop/${product.slug || product._id}`}
      aria-label={`View ${product.name}, starting at RM ${product.price}`}
      className="group flex h-full shrink-0 cursor-pointer flex-col overflow-hidden rounded-[1.1rem] border border-border/80 bg-card text-card-foreground shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_18px_45px_-28px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/35">
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
          className="object-contain object-center p-4 transition-transform duration-500 ease-out group-hover:scale-[1.035]"
        />
        {product.images?.length > 1 && (
          <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 rounded-md bg-card/85 p-1 backdrop-blur" aria-label={`${product.images.length} design previews`}>
            {product.images.slice(0, 4).map((preview, index) => (
              <img key={`${preview}-${index}`} src={getImageUrl(preview)} alt="" loading="lazy" className="size-8 rounded border border-border bg-muted object-contain" />
            ))}
          </div>
        )}
      </div>
      <div className="flex w-full flex-1 flex-col p-4 sm:p-5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Made to order</p>
        <h3 className="mb-4 line-clamp-2 font-sans text-sm font-semibold leading-snug sm:text-base">{product.name}</h3>
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
          <div className="flex items-end justify-between gap-3"><div><span className="text-xs text-muted-foreground">From</span><div className="text-lg font-semibold tracking-tight">RM {product.price}</div></div><span className="text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5">View product →</span></div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
