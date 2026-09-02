/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { Breadcrumbs } from "@/components/global/breadcrumb";
import ProductCard from "@/components/global/productCard";
import { PaginationDemo } from "@/components/global/pagination";
import { CgOptions } from "react-icons/cg";
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
import { useFilterProducts } from "@/hooks/useProducts";
import ProductCardSkeleton from "@/components/loading/ProductCardSkeleton";
import { motion } from "framer-motion";
import { container_variants, item_variants } from "@/constants/framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useFilterStore } from "@/store/filterStore";

const ITEMS_PER_PAGE = 8;

const ShopContent = () => {
  const { t } = useLanguage();
  const { serviceCategories, turnarounds, formats, materials, priceRange, resetFilters } = useFilterStore();
  const { data, isPending, aiSummary, aiEnabled } = useFilterProducts();
  const products = data?.products || [];
  const [sortBy, setSortBy] = useState("featured");
  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });
  
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));
  const requestedPage = pageParam ? parseInt(pageParam) : 1;
  const currentPage = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), totalPages) : 1;
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  return (
    <div
    
      className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-6 xl:px-8"
    >
      <Breadcrumbs />
      <div className="mt-5 grid w-full grid-cols-1 gap-6 md:mt-0 md:grid-cols-4">
        <div className="col-span-1 md:block hidden">
          <FilterSidebar />
        </div>
        <div className="md:col-span-3 flex flex-col gap-5 col-span-4">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-sans text-2xl font-semibold">{t("shop.title")}</h1>
              <p className="text-sm text-muted-foreground">
                {products?.length || 0}&nbsp;{t("shop.productsFound")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="product-sort" className="sr-only">{t("shop.sort")}</label>
              <select
                id="product-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="h-10 rounded-full border border-border bg-card px-4 text-sm font-medium outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                 <option value="featured">{t("shop.featured")}</option>
                 <option value="rating">{t("shop.topRated")}</option>
                 <option value="price-low">{t("shop.priceLow")}</option>
                 <option value="price-high">{t("shop.priceHigh")}</option>
                 <option value="name">{t("shop.nameAZ")}</option>
              </select>
              <Drawer>
                <DrawerTrigger aria-label={t("filters.title")} className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-input bg-muted transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:hidden">
                  <CgOptions aria-hidden="true" className="rotate-90" />
                </DrawerTrigger>
                <DrawerTitle className="hidden">Filters</DrawerTitle>
                <DrawerContent>
                  <ScrollArea className="h-[calc(100vh-10rem)]">
                    <FilterSidebar />
                  </ScrollArea>
                </DrawerContent>
              </Drawer>
           </div>
           {(serviceCategories.length || turnarounds.length || formats.length || materials.length || priceRange[0] > 0 || priceRange[1] < 1000) ? (
             <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
               {[...serviceCategories, ...turnarounds, ...formats, ...materials, ...(priceRange[0] > 0 || priceRange[1] < 1000 ? [`RM ${priceRange[0]} - RM ${priceRange[1]}`] : [])].map((filter) => (
                 <span key={filter} className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">{filter}</span>
               ))}
               <button type="button" onClick={resetFilters} className="rounded-full px-3 py-1 text-xs font-semibold text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{t("filters.clear")}</button>
             </div>
           ) : null}
          </div>
          {aiEnabled && aiSummary && (
            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 text-sm text-foreground">
              <span className="text-lg leading-none mt-0.5">🤖</span>
              <p className="leading-relaxed">{aiSummary}</p>
            </div>
          )}
          <motion.div
            variants={container_variants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4"
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
                <p className="text-muted-foreground">{t("shop.noProducts")}</p>
              </div>
            )}
          </motion.div>
          <div className="w-full border-t border-border pt-5">
             <PaginationDemo
               totalPages={totalPages}
               currentPage={currentPage}
               onPageChange={(page) => {
                 const params = new URLSearchParams(searchParams.toString());
                 params.set("page", String(page));
                 window.history.pushState(null, "", `/home/shop?${params.toString()}`);
               }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ShopPage = () => (
  <Suspense fallback={<div className="min-h-[50vh] p-8 text-muted-foreground">Loading...</div>}>
    <ShopContent />
  </Suspense>
);

export default ShopPage;
