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
        <h2 className="font-sans text-xl font-semibold">Customer reviews</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const reviews = data?.reviews || [];
  const avgRating = data?.avgRating || 0;
  const count = data?.count || 0;

  if (count === 0) {
    return (
      <div className="space-y-2 py-2">
        <h2 className="font-sans text-xl font-semibold">Customer reviews</h2>
        <p className="text-sm text-muted-foreground">No reviews yet. Be the first customer to review this product.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <h2 className="font-sans text-xl font-semibold">Customer reviews</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={star <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-border"}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {avgRating.toFixed(1)} ({count} {count === 1 ? "review" : "reviews"})
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review: any) => (
          <div key={review._id} className="space-y-3 rounded-xl border border-border bg-muted/10 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {review.userName?.substring(0, 2).toUpperCase() || "CU"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{review.userName}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(review.createdAt), "MMM d, yyyy")}</p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={12}
                    className={star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-border"}
                  />
                ))}
              </div>
            </div>
            {review.comment && (
              <p className="text-sm leading-6 text-muted-foreground">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
