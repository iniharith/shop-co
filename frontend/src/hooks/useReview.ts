"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { submitReview, getOrderReview, getProductReviews } from "@/api/review";
import { toast } from "sonner";

export function useSubmitReview() {
  const { data: session } = useSession();
  const token = session?.user?.token || "";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { orderId: string; productId: string; rating: number; comment?: string }) =>
      submitReview(token, data),
    onSuccess: () => {
      toast.success("Thank you for your review!");
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to submit review");
    },
  });
}

export function useOrderReview(orderId: string) {
  const { data: session } = useSession();
  const token = session?.user?.token || "";

  return useQuery({
    queryKey: ["reviews", "order", orderId],
    queryFn: () => getOrderReview(token, orderId),
    enabled: !!token && !!orderId,
  });
}

export function useProductReviews(productId: string, page = 1) {
  return useQuery({
    queryKey: ["reviews", "product", productId, page],
    queryFn: () => getProductReviews(productId, page),
    enabled: !!productId,
  });
}
