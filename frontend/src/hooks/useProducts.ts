/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client"
import { ICategoryResponse, IProductByIdResponse, IProductResponse } from "@/types/api";
import { useQueryData } from "./useQueryData"
import { getProductByCategory, getProductById, getProducts, getAvailableCategories, filterProducts } from "@/api/product";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFilterStore } from "@/store/filterStore";
import { useSearchParams } from "next/navigation";

import { dummyProducts } from "@/constants/dummy-products";

const searchAliases: Record<string, string> = {
    "cetakan digital": "digital printing",
    "item pameran": "display item",
    "offset digital": "digital offset",
    "hadiah premium": "premium gift",
    pakaian: "apparel",
    bingkai: "frame",
    "produk perkahwinan": "wedding",
    "pembungkusan makanan": "food packaging",
    "khat islamik": "islamic khat",
};

const getSearchTerms = (query: string) => {
    const normalized = query.trim().toLowerCase();
    return [normalized, searchAliases[normalized]].filter(Boolean) as string[];
};

const matchesSearch = (product: any, terms: string[]) => terms.some((term) =>
    product?.name?.toLowerCase().includes(term) ||
    product?.description?.toLowerCase().includes(term) ||
    product?.category?.toLowerCase().includes(term)
);

export const useProducts = (id?: string) => {
    const client = useQueryClient()
    const apiFn = !id ? getProducts : getProductById;
    const queryKey = !id ? "products" : "product";
    const shouldFetch = Boolean(id && !id.startsWith('prod-'));
    const { data, isPending } = useQueryData([queryKey, id], () => apiFn(id as string), { enabled: shouldFetch, staleTime: 5 * 60_000 });
    type type = IProductResponse & IProductByIdResponse;
    const response = data as type;

    // FORCE return the new printing products, completely ignoring the old clothing items in the DB
    if (!id) {
        return { data: { ...response, products: dummyProducts }, isPending: false };
    }

    // Fallback for single product if it's a dummy id
    
    if (response?.product?.name) {
        const dummy = dummyProducts.find(d => d.name === response.product.name);
        if (dummy && dummy.matrixPricing?.enabled) {
            return { data: { ...response, product: { ...response.product, matrixPricing: dummy.matrixPricing, printingOptions: dummy.printingOptions } }, isPending: false };
        }
    }

    if (id?.startsWith('prod-')) {

        const dummy = dummyProducts.find(d => d?._id === id);
        return { data: { ...response, product: dummy }, isPending: false };
    }

    return { data: response, isPending };
}


export const useSearchProducts = (query: string) => {
    const terms = getSearchTerms(query);
    const filtered = terms[0]?.length < 2 ? [] : dummyProducts.filter((product) => matchesSearch(product, terms));
    return { data: { products: filtered }, isPending: false };
}

export const useGetProductByCategory = (category: string) => {
    // Force category mock
    const filtered = dummyProducts.filter(p => p?.category === category);
    return { data: { products: filtered.length > 0 ? filtered : dummyProducts.filter(p=>p) }, isPending: false };
}


export const useGetAvailableCategories = () => {
    const { data, isPending } = useQueryData(["getAvailableCategories"], () => getAvailableCategories());
    type type = ICategoryResponse;
    const response = data as type;
    return { data: response, isPending };
}


export const useFilterProducts = () => {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
    
    const { serviceCategories, turnarounds, formats, materials, priceRange } = useFilterStore();
    // FORCE return the new printing products, simulating frontend filtering
    let filtered = [...dummyProducts.filter(p=>p)];
    
    if (searchQuery) {
        const terms = getSearchTerms(searchQuery);
        filtered = filtered.filter((product) => matchesSearch(product, terms));
    }
    
    if (priceRange) {
        filtered = filtered.filter(p => p?.price >= priceRange[0] && p?.price <= priceRange[1]);
    }
    
    if (serviceCategories && serviceCategories.length > 0) {
        // Mock matching top-level category label with dummy products nested categories by keyword
        filtered = filtered.filter(p => {
             const lowerP = p?.category?.toLowerCase().replace('-', ' ') || '';
             return serviceCategories.some(c => lowerP.includes(c.toLowerCase().split(' ')[1] || c.toLowerCase().split(' ')[0]));
        });
    }
    
    if (formats && formats.length > 0) {
        filtered = filtered.filter(p => p?.sizes && p.sizes.some((s: any) => formats.includes(s)));
    }
    
    return { data: { products: filtered }, isPending: false, refetch: () => Promise.resolve() };
}



