"use client";
import { useWishlist } from "@/hooks/useWishlist";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getImageUrl } from "@/utils/getImageUrl";

export default function WishlistPage() {
  const { data, isLoading } = useWishlist();
  const items = data?.data || [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <h1 className="text-2xl font-bold">Wishlist</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 animate-pulse h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-3">
        <Heart size={24} className="text-red-500 fill-red-500" />
        <h1 className="text-2xl font-bold">My Wishlist</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Your wishlist is empty</p>
          <Link
            href="/home/shop"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item: any) => (
            <Link
              key={item._id}
              href={`/home/shop/${item.productId}`}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all group"
            >
              <div className="aspect-square bg-gray-100 overflow-hidden">
                <img
                  src={getImageUrl(item.productId)}
                  alt="Product"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.png";
                  }}
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{item.productId}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
