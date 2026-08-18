"use client";
import { Star } from "lucide-react";
import { useProductReviews } from "@/hooks/useReview";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { data, isLoading } = useProductReviews(productId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Customer Reviews</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 animate-pulse h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const reviews = data?.reviews || [];
  const avgRating = data?.avgRating || 0;
  const count = data?.count || 0;

  if (count === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold">Customer Reviews</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={star <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-300"}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {avgRating.toFixed(1)} ({count} {count === 1 ? "review" : "reviews"})
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review: any) => (
          <div key={review._id} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {review.userName?.substring(0, 2).toUpperCase() || "CU"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{review.userName}</p>
                <p className="text-xs text-gray-400">{format(new Date(review.createdAt), "MMM d, yyyy")}</p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={12}
                    className={star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-300"}
                  />
                ))}
              </div>
            </div>
            {review.comment && (
              <p className="text-sm text-gray-600">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
