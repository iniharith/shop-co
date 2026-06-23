"use client"
import { ICategoryResponse, IProductByIdResponse, IProductResponse } from "@/types/api";
import { useQueryData } from "./useQueryData"
import { getProductByCategory, getProductById, getProducts, getAvailableCategories, searchProducts, filterProducts } from "@/api/product";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFilterStore } from "@/store/filterStore";
import { useSearchParams } from "next/navigation";

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
    const { data, isPending } = useQueryData(["searchProducts", query], () => searchProducts(query));
    // Force search mock
    const filtered = dummyProducts.filter(p => p?.name?.toLowerCase().includes(query.toLowerCase()) || p?.description?.toLowerCase().includes(query.toLowerCase()));
    return { data: { products: filtered }, isPending: false };
    return { data, isPending };
}

export const useGetProductByCategory = (category: string) => {
    const { data, isPending } = useQueryData(["getProductByCategory", category], () => getProductByCategory(category));
    // Force category mock
    const filtered = dummyProducts.filter(p => p?.category === category);
    return { data: { products: filtered.length > 0 ? filtered : dummyProducts.filter(p=>p) }, isPending: false };
    return { data, isPending };
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
    const { data, isPending, refetch } = useQueryData(["filterProducts", serviceCategories, turnarounds, formats, materials, priceRange], () => filterProducts({ 
        category: serviceCategories, 
        minPrice: priceRange[0], 
        maxPrice: priceRange[1], 
        size: formats 
    }));
    
    useEffect(() => {
        refetch();
    }, [serviceCategories, turnarounds, formats, materials, priceRange]);
    
    // FORCE return the new printing products, simulating frontend filtering
    let filtered = [...dummyProducts.filter(p=>p)];
    
    if (searchQuery) {
        filtered = filtered.filter(p => p?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p?.description?.toLowerCase().includes(searchQuery.toLowerCase()));
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
    
    return { data: { products: filtered }, isPending: false, refetch };

    const response = data as IProductResponse;
    return { data: response, isPending, refetch };
}







