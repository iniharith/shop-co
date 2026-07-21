/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { Breadcrumbs } from "@/components/global/breadcrumb";
import { products } from "@/constants/data";
import ProductCard from "@/components/global/productCard";
import { PaginationDemo } from "@/components/global/pagination";
import { CgOptions } from "react-icons/cg";
import { Button } from "@heroui/button";
import FilterSidebar from "@/components/page-sections/shop/filterSidbar";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useFilterProducts, useProducts } from "@/hooks/useProducts";
import ProductCardSkeleton from "@/components/loading/ProductCardSkeleton";
import { motion } from "framer-motion";
import { container_variants, item_variants } from "@/constants/framer-motion";

const ITEMS_PER_PAGE = 8;

const ShopContent = () => {
  const { data, isPending } = useFilterProducts();
  const products = data?.products || [];
  
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam) : 1;
  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE));
  const paginatedProducts = products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  return (
    <div
    
      className="page-shell py-8"
    >
      <Breadcrumbs />
      <div className="w-full grid gap-6 md:mt-0 mt-5 grid-cols-1 md:grid-cols-4">
        <div className="col-span-1 md:block hidden">
          <FilterSidebar />
        </div>
        <div className="md:col-span-3 flex flex-col gap-5 col-span-4">
          <div className="glass-subtle w-full flex justify-between items-center rounded-2xl px-5 py-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Print catalog</p><h1 className="text-2xl font-bold">All Products</h1></div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">
                {products?.length || 0}&nbsp;products&nbsp;found
              </p>
              <Drawer>
                <DrawerTrigger className="bg-gray-300/30 md:hidden flex cursor-pointer rounded-full hover:scale-105 transition-all duration-300 border-input border-1 p-1">
                  <CgOptions className="rotate-90" />
                </DrawerTrigger>
                <DrawerTitle className="hidden">Filters</DrawerTitle>
                <DrawerContent>
                  <ScrollArea className="h-[calc(100vh-10rem)]">
                    <FilterSidebar />
                  </ScrollArea>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
          <motion.div
            variants={container_variants}
            initial="hidden"
            animate="visible"
            className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-2 gap-3 md:gap-5"
          >
            {!isPending &&
              paginatedProducts.length > 0 &&
              paginatedProducts.map((product: any, index: number) => (
                <motion.div
                  variants={item_variants}
                  key={product._id + "product"}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            {isPending &&
              Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index + "skeleton"} />
              ))}
            {products.length === 0 && !isPending && (
              <div className="col-span-4 md:h-[90vh] flex flex-col justify-center items-center ">
                <div className="md:w-[30rem] overflow-hidden">
                  <img
                    src="/noData.png"
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </div>
                <p className="text-gray-500">No products found</p>
              </div>
            )}
          </motion.div>
          <div className="w-full border-t border-border pt-5">
            <Suspense fallback={<div>Loading...</div>}>
              <PaginationDemo
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={(page) => {}}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShopPage = () => (
  <Suspense fallback={<div className="page-shell py-8"><ProductCardSkeleton /></div>}>
    <ShopContent />
  </Suspense>
);

export default ShopPage;
