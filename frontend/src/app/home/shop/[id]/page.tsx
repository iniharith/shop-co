/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import Link from "next/link";
import { ProductDetails } from "@/components/page-sections/shop/product-details";
import { ProductGallery } from "@/components/page-sections/shop/product-gallery";
import ProductSctions from "@/components/page-sections/home/productSctions";
import { mockProduct, products } from "@/constants/data";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useParams } from "next/navigation";
import ProductDetailSkeleton from "@/components/loading/ProductDetailSkeleton";
import { IProduct } from "@/types/IProduct";
import { ProductReviews } from "@/components/global/ProductReviews";
import { WishlistButton } from "@/components/global/WishlistButton";
const page = () => {
  const { id } = useParams();
  const { data, isPending } = useProducts(id as string);
  const { data: productsData, isPending: isProductsPending } = useProducts();
  const [relatedProducts, setRelatedProducts] = useState<IProduct[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState<number | null>(null);
  const [selectedSizeImages, setSelectedSizeImages] = useState<string[] | null>(null);
  const activeSizeImagesRef = useRef<string[] | null>(null);
  const product = data?.product as IProduct;
  const products = productsData?.products || [];
   const dimensions = Array.from(new Set(product?.name?.match(/\d+\s*[xX]\s*\d+/g) || []));

  const handleSelectedSizeImagesChange = useCallback((images: string[] | null) => {
    const active = images?.length ? images : null;
    if (active !== activeSizeImagesRef.current) {
      activeSizeImagesRef.current = active;
      setSelectedImageIndex(0);
    }
    setSelectedSizeImages(active);
  }, []);

  useEffect(() => {
    setSelectedImageIndex(0);
    setSelectedVariationIndex(null);
    setSelectedSizeImages(null);
    activeSizeImagesRef.current = null;
  }, [id]);

  useEffect(() => {
    setRelatedProducts(products.filter((product) => product._id !== id).reverse().slice(0, 6));
  }, [products, id]);



    
  return (
    <div className="mx-auto w-full max-w-[1480px] px-3 py-4 sm:px-6 sm:py-6 xl:px-8">
      {/* Custom Dynamic Breadcrumbs */}
      <nav className="mb-5 flex items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-border px-1 pb-3 text-xs text-muted-foreground sm:mb-7 sm:text-sm" aria-label="Breadcrumb">
         <Link href="/" className="transition-colors hover:text-primary">Home</Link>
         <span className="text-border">/</span>
         <Link href="/home/shop" className="transition-colors hover:text-primary">Shop</Link>
         {product && (
           <>
              <span className="text-border">/</span>
              <Link href={`/home/shop?category=${product.category}`} className="capitalize transition-colors hover:text-primary">
                {product.category.replace(/-/g, ' ')}
              </Link>
              <span className="text-border">/</span>
              <span className="font-semibold text-foreground">
                {product.name}
              </span>
           </>
         )}
      </nav>
      {isPending && <ProductDetailSkeleton />}
      {!isPending && product && (
        <div className="grid grid-cols-1 items-start gap-5 border-b border-border pb-10 lg:grid-cols-12 xl:gap-8">
          {/* ── LEFT COLUMN: IMAGES & DESCRIPTION ── */}
          <div className="w-full space-y-5 lg:col-span-7 sm:space-y-6">
            <div className="relative rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-sm sm:rounded-3xl sm:p-5">
              <div className="absolute right-5 top-5 z-20">
                {product && <WishlistButton productId={product._id} />}
              </div>
              <ProductGallery
                images={selectedSizeImages?.length ? selectedSizeImages : product.images}
                productName={product.name}
                selectedIndex={selectedImageIndex}
                onSelectedIndexChange={setSelectedImageIndex}
              />
            </div>
            
            <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:rounded-3xl sm:p-6">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Product details</span>
              <h2 className="font-sans text-xl font-semibold tracking-tight text-foreground">Product information</h2>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                 {product.description || "Product details will be confirmed by our team."}
              </p>
              <dl className="grid gap-2 pt-2 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-muted/25 p-3">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Category</dt>
                  <dd className="mt-1 text-sm font-semibold capitalize">{product.category.replace(/-/g, " ")}</dd>
                </div>
                <div className="rounded-xl border border-border bg-muted/25 p-3">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Dimensions</dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {dimensions.length > 0 ? dimensions.map((value) => value.toUpperCase().replace("X", " × ")).join(", ") : "Standard format"}
                  </dd>
                </div>
                <div className="rounded-xl border border-border bg-muted/25 p-3">
<dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Available designs</dt>
                  <dd className="mt-1 text-sm font-semibold">{product.variations?.length ?? product.images.length}</dd>
                </div>
              </dl>
              {(product.specifications || product.packageContents?.length || product.productionTurnaround || product.warrantyInfo || product.installationInstructions) && (
                <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                  {product.specifications && (
                    <section aria-labelledby="product-specifications">
                      <h3 id="product-specifications" className="font-semibold text-foreground">Specifications</h3>
                      <dl className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {Object.entries(product.specifications).filter(([key, value]) => key !== "customFields" && value).map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-3 border-b border-border/50 py-1">
                            <dt className="capitalize">{key}</dt><dd className="text-right font-medium text-foreground">{String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  )}
                  {product.packageContents?.length ? (
                    <section aria-labelledby="package-contents">
                      <h3 id="package-contents" className="font-semibold text-foreground">Included</h3>
                      <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                        {product.packageContents.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </section>
                  ) : null}
                  {product.productionTurnaround && (
                    <section aria-labelledby="production-time">
                      <h3 id="production-time" className="font-semibold text-foreground">Production time</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {product.productionTurnaround.standardDays ? `Standard: ${product.productionTurnaround.standardDays} days` : ""}
                        {product.productionTurnaround.expressDays ? ` | Express: ${product.productionTurnaround.expressDays} days` : ""}
                      </p>
                      {product.productionTurnaround.notes && <p className="text-sm text-muted-foreground">{product.productionTurnaround.notes}</p>}
                    </section>
                  )}
                  {product.warrantyInfo && (
                    <section aria-labelledby="warranty-information">
                      <h3 id="warranty-information" className="font-semibold text-foreground">Warranty</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{product.warrantyInfo}</p>
                    </section>
                  )}
                  {product.installationInstructions && (
                    <section aria-labelledby="installation-instructions" className="sm:col-span-2">
                      <h3 id="installation-instructions" className="font-semibold text-foreground">Installation instructions</h3>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{product.installationInstructions}</p>
                    </section>
                  )}
                </div>
              )}
              {product.customerPhotos?.length ? (
                <section aria-labelledby="customer-photos" className="border-t border-border pt-4">
                  <h3 id="customer-photos" className="font-semibold text-foreground">Customer photos</h3>
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {product.customerPhotos.map((photo) => <img key={photo} src={photo} alt="Customer example" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />)}
                  </div>
                </section>
              ) : null}
            </div>
            
            <div id="flyer-pricing-portal"></div>

            {/* ── REVIEWS (inside left column) ── */}
            {product && (
              <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:rounded-3xl sm:p-6">
                <ProductReviews productId={product._id} />
              </div>
            )}
          </div>
          
          {/* ── RIGHT COLUMN: CONFIGURATOR (Sticky) ── */}
          <div className="w-full lg:col-span-5 relative h-full">
            <ProductDetails
              product={product}
              selectedVariationIndex={selectedVariationIndex}
              onSelectedImageChange={setSelectedImageIndex}
              onSelectedSizeImagesChange={handleSelectedSizeImagesChange}
              onSelectedVariationChange={(index) => {
                setSelectedVariationIndex(index);
                setSelectedImageIndex(index);
              }}
            />
          </div>
        </div>
      )}

      <ProductSctions isLoading={isProductsPending} title="Related Products" products={relatedProducts} />
    </div>
  );
};

export default page;
