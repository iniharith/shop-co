"use client"
import { ICategoryResponse, IProductByIdResponse, IProductResponse } from "@/types/api";
import { useQueryData } from "./useQueryData"
import { getProductByCategory, getProductById, getProducts, getAvailableCategories, searchProducts, filterProducts } from "@/api/product";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFilterStore } from "@/store/filterStore";

const dummyProducts = Array(10).fill(null).map((_, i) => ({
    _id: `dummy-${i}`,
    name: `Premium Print Product ${i + 1}`,
    description: "High quality printing with premium finish.",
    price: 50 + i * 10,
    originalPrice: 100 + i * 20,
    discount: 50,
    rating: 5,
    reviews: [],
    category: "DIGITAL PRINTING",
    images: ["https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=600"],
    colors: ["#000000", "#FFFFFF"],
    sizes: ["A4", "A3"],
    tags: ["print", "premium"],
    sales: 100 + i * 5,
    stock: 1000
}));

export const useProducts = (id?: string) => {
    const client = useQueryClient()
    const apiFn = !id ? getProducts : getProductById;
    const queryKey = !id ? "products" : "product";
    const { data, isPending } = useQueryData([queryKey], () => apiFn(id as string));
    type type = IProductResponse & IProductByIdResponse;
    const response = data as type;

    useEffect(() => {
        if (id) client.invalidateQueries({ queryKey: [queryKey], exact: true })
    }, [id]);

    // Fallback to dummy products if DB is empty
    if (!id && !isPending && (!response?.products || response.products.length === 0)) {
        return { data: { ...response, products: dummyProducts }, isPending: false };
    }

    // Fallback for single product if it's a dummy id
    if (id?.startsWith('dummy-')) {
        const dummy = dummyProducts.find(d => d._id === id);
        return { data: { product: dummy }, isPending: false };
    }

    return { data: response, isPending };
}


export const useSearchProducts = (query: string) => {
    const { data, isPending } = useQueryData(["searchProducts", query], () => searchProducts(query));
    return { data, isPending };
}

export const useGetProductByCategory = (category: string) => {
    const { data, isPending } = useQueryData(["getProductByCategory", category], () => getProductByCategory(category));
    return { data, isPending };
}


export const useGetAvailableCategories = () => {
    const { data, isPending } = useQueryData(["getAvailableCategories"], () => getAvailableCategories());
    type type = ICategoryResponse;
    const response = data as type;
    return { data: response, isPending };
}


export const useFilterProducts = () => {
    const { categories, priceRange, sizes } = useFilterStore();
    const { data, isPending, refetch } = useQueryData(["filterProducts", categories, priceRange, sizes], () => filterProducts({ category: categories, minPrice: priceRange[0], maxPrice: priceRange[1], size: sizes }));
    useEffect(() => {
        refetch();
    }, [categories, priceRange, sizes]);
    const response = data as IProductResponse;
    return { data: response, isPending, refetch };
}







