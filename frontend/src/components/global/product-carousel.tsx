"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ProductCard from "./productCard";
import { IProduct } from "@/types";
import ProductCardSkeleton from "../loading/ProductCardSkeleton";
import { useRouter } from "nextjs-toploader/app";

interface ProductCarouselProps {
  products: IProduct[];
  isLoading: boolean;
}

export default function ProductCarousel({
  products,
  isLoading,
}: ProductCarouselProps) {
  const router = useRouter();

  return (
    <div className="relative w-full">
      <Carousel
        className="w-full"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {!isLoading &&
            products.map((product) => (
              <CarouselItem
                key={product._id}
                // 1 card on xs, 2 on sm, 3 on md, 4 on lg
                className="pl-2 md:pl-4 basis-full xs:basis-1/2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <ProductCard product={product} />
              </CarouselItem>
            ))}

          {isLoading &&
            Array.from({ length: 8 }).map((_, index) => (
              <CarouselItem
                key={index}
                className="pl-2 md:pl-4 basis-full xs:basis-1/2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <ProductCardSkeleton />
              </CarouselItem>
            ))}
        </CarouselContent>

        {/* Navigation arrows — positioned outside content area */}
        <CarouselPrevious className="-left-4 md:-left-6" />
        <CarouselNext className="-right-4 md:-right-6" />
      </Carousel>

      <div className="mt-8 flex justify-center">
        <Button
          onClick={() => router.push("/home/shop")}
          variant="outline"
          className="rounded-full px-8 active:scale-95 transition-all duration-300"
        >
          View All
        </Button>
      </div>
    </div>
  );
}
