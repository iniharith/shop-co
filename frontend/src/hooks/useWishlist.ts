"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { addToWishlist, removeFromWishlist, getWishlist, checkWishlist } from "@/api/wishlist";
import { toast } from "sonner";

export function useWishlist() {
  const { data: session } = useSession();
  const token = session?.user?.token || "";

  return useQuery({
    queryKey: ["wishlist"],
    queryFn: () => getWishlist(token),
    enabled: !!token,
  });
}

export function useCheckWishlist(productId: string) {
  const { data: session } = useSession();
  const token = session?.user?.token || "";

  return useQuery({
    queryKey: ["wishlist", "check", productId],
    queryFn: () => checkWishlist(token, productId),
    enabled: !!token && !!productId,
  });
}

export function useToggleWishlist(productId: string) {
  const { data: session } = useSession();
  const token = session?.user?.token || "";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isFavorited: boolean) => {
      if (isFavorited) {
        return removeFromWishlist(token, productId);
      } else {
        return addToWishlist(token, productId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist", "check", productId] });
    },
    onError: () => {
      toast.error("Failed to update wishlist");
    },
  });
}
