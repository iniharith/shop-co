"use client";
import { Heart } from "lucide-react";
import { useCheckWishlist, useToggleWishlist } from "@/hooks/useWishlist";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export function WishlistButton({ productId, className = "" }: WishlistButtonProps) {
  const { data: session } = useSession();
  const { data: checkData } = useCheckWishlist(productId);
  const { mutate: toggleWishlist } = useToggleWishlist(productId);
  const isFavorited = checkData?.isFavorited || false;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      toast.error("Please login to add to wishlist");
      return;
    }
    toggleWishlist(isFavorited);
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full transition-all hover:bg-gray-100 ${className}`}
      title={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        size={20}
        className={isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"}
      />
    </button>
  );
}
