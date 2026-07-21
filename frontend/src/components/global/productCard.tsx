/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { cn } from "@/lib/utils";
import type { IProduct } from "@/types/IProduct";
import { Star } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import { Button } from "@heroui/button";
import { MdOutlineShoppingBag } from "react-icons/md";
import { useAddtoCart } from "@/hooks/useCart";
import { getProductArtworkFallback } from "@/utils/productArtworkFallback";

interface ProductCardProps {
  product: IProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const router = useRouter();
  const image =
    product.images?.length && product.images[0].startsWith("/") && !product.images[0].startsWith("/images/") && !product.images[0].startsWith("/placeholder")
      ? process.env.NEXT_PUBLIC_BACKEND_URL + product.images[0]
      : product.images[0];
  const { mutate, isPending } = useAddtoCart();
  const handleAddToCart = () => {
    const firstSize = product.sizes?.[0] as unknown as string | { size: string };
    mutate({
      productId: product._id,
      size: typeof firstSize === "string" ? firstSize : firstSize?.size || "Standard",
      quantity: 1,
    });
  };

  return (
    <div
      onClick={() => router.push(`/home/shop/${product._id}`)}
      className="glass-panel group shrink-0 cursor-pointer rounded-3xl p-2 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-primary/30"
    >
      <div className="relative mb-3 w-full aspect-square overflow-hidden rounded-[1.25rem] bg-muted">
        <img
          src={image || "/placeholder.svg"}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = getProductArtworkFallback(product.name, product.category || "Print");
          }}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      <div className="w-full flex flex-1 flex-col p-2">
        <div className="flex-1">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{product.category?.replaceAll("-", " ")}</p>
          <h3 className="font-bold text-base md:text-lg mb-2 line-clamp-2">{product.name}</h3>
          <div className="flex items-center mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={cn(
                  "fill-current",
                  i < Math.floor(product.rating)
                    ? "text-yellow-400"
                    : i < product.rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300 dark:text-muted"
                )}
              />
            ))}
            <span className="text-sm text-gray-600 dark:text-muted-foreground ml-1">
              {product.rating}/5
            </span>
          </div>
          {product.category?.toLowerCase() !== "islamic khat" && (
            <div className="mt-auto flex items-center">
              <span className="font-bold text-lg">RM {product.price}</span>
              {product.discount > 0 && (
                <>
                  <span className="text-gray-400 dark:text-muted-foreground line-through ml-2">
                    RM {product.originalPrice}
                  </span>
                  <span className="ml-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">
                    -{product.discount}%
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center justify-end" onClick={(event) => event.stopPropagation()}>
          <Button
            onPress={handleAddToCart}
            isLoading={isPending}
            size="sm"
            aria-label={`Add ${product.name} to cart`}
            className="bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-all duration-300 active:scale-95 border border-white/10 rounded-full w-[2.75rem] h-[2.75rem] min-w-0"
          >
            <MdOutlineShoppingBag />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
