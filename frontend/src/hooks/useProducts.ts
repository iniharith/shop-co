"use client"
import { ICategoryResponse, IProductByIdResponse, IProductResponse } from "@/types/api";
import { useQueryData } from "./useQueryData"
import { getProductByCategory, getProductById, getProducts, getAvailableCategories, searchProducts, filterProducts } from "@/api/product";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFilterStore } from "@/store/filterStore";

import { dummyProducts } from "@/constants/dummy-products";

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

    // FORCE return the new printing products, completely ignoring the old clothing items in the DB
    if (!id) {
        return { data: { ...response, products: dummyProducts }, isPending: false };
    }

    // Fallback for single product if it's a dummy id
    if (id?.startsWith('prod-')) {
        const dummy = dummyProducts.find(d => d._id === id);
        return { data: { ...response, product: dummy }, isPending: false };
    }

    return { data: response, isPending };
}


export const useSearchProducts = (query: string) => {
    const { data, isPending } = useQueryData(["searchProducts", query], () => searchProducts(query));
    // Force search mock
    const filtered = dummyProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.description.toLowerCase().includes(query.toLowerCase()));
    return { data: { products: filtered }, isPending: false };
    return { data, isPending };
}

export const useGetProductByCategory = (category: string) => {
    const { data, isPending } = useQueryData(["getProductByCategory", category], () => getProductByCategory(category));
    // Force category mock
    const filtered = dummyProducts.filter(p => p.category === category);
    return { data: { products: filtered.length > 0 ? filtered : dummyProducts }, isPending: false };
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
    
    // FORCE return the new printing products, simulating frontend filtering
    let filtered = [...dummyProducts];
    if (categories && categories.length > 0) {
          filtered = filtered.filter(p => categories.includes(p.category));
    }
    return { data: { products: filtered }, isPending: false, refetch };

    const response = data as IProductResponse;
    return { data: response, isPending, refetch };
}







