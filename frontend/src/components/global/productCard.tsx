/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import type { IProduct } from "@/types/IProduct";
import Image from "next/image";
import { useRouter } from "nextjs-toploader/app";

interface ProductCardProps {
  product: IProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const router = useRouter();
  const image =
    product.images?.length && product.images[0].startsWith("/") && !product.images[0].startsWith("/images/") && !product.images[0].startsWith("/placeholder")
      ? process.env.NEXT_PUBLIC_BACKEND_URL + product.images[0]
      : product.images[0];
  const hasDiscount = product.discount > 0 && product.originalPrice > product.price;

  return (
    <div
      onClick={() => router.push(`/home/shop/${product._id}`)}
      className="bg-card text-card-foreground border border-border shrink-0 hover:bg-muted/60 transition-colors cursor-pointer rounded-lg overflow-hidden h-full flex flex-col"
    >
      <div className="relative w-full aspect-square overflow-hidden bg-muted/10 p-2">
        {product.images?.length > 1 && (
          <span className="absolute left-2 top-2 z-10 rounded-full border border-border bg-card/90 px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur">
            {product.images.length} designs
          </span>
        )}
        <Image
          src={image || "/placeholder.svg"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain object-center p-2"
        />
      </div>
      <div className="w-full p-3 flex flex-1 flex-col">
        <h3 className="mb-2 font-sans text-sm font-semibold leading-snug sm:text-base md:text-lg">{product.name}</h3>
        <div className="mt-auto">
          {hasDiscount && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground line-through">
                RM {product.originalPrice}
              </span>
              <span className="text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">
                -{product.discount}%
              </span>
            </div>
          )}
          <div className="font-bold text-xl">RM {product.price}</div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
