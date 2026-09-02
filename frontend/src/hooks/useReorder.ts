"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/api/cart";
import { IOrder } from "@/types/IOrder";
import { toast } from "sonner";

export function useReorder() {
  const { data: session } = useSession();
  const token = session?.user?.token || "";
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (order: IOrder) => {
      for (const item of order.products) {
        await addToCart({
          productId: item.product._id,
          size: item.size,
          quantity: item.quantity,
          configuration: item.configuration,
          configurationKey: item.configurationKey,
        }, token);
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Items added to cart!");
      router.push("/home/cart");
    },
    onError: () => {
      toast.error("Failed to add items to cart");
    },
  });
}
