/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client"
import { ICategoryResponse, IProductByIdResponse, IProductResponse } from "@/types/api";
import { useQueryData } from "./useQueryData"
import { getProductByCategory, getProductById, getProducts, getAvailableCategories, filterProducts, searchProducts } from "@/api/product";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFilterStore } from "@/store/filterStore";
import { useSearchParams } from "next/navigation";
import { AI_SEARCH_ENABLED, aiSemanticSearch } from "@/utils/aiSearch";


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

const categorySections: Record<string, string> = {
    "Digital Printing": "DIGITAL PRINTING",
    "Display Item": "DISPLAY ITEM",
    "Digital Offset": "DIGITAL OFFSET",
    "Premium Gift": "PREMIUM GIFT",
    Apparel: "APPAREL/SUBLIMATION",
    "Wedding Product": "WEDDING PRODUCT",
    "Food Packaging": "FOOD PACKAGING",
    "Islamic Khat": "ISLAMIC KHAT",
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
    const { data, isPending } = useQueryData([queryKey, id], () => apiFn(id as string), { enabled: true, staleTime: 5 * 60_000 });
    type type = IProductResponse & IProductByIdResponse;
    const response = data as type;

    return { data: response, isPending };
}


export const useSearchProducts = (query: string) => {
    const terms = getSearchTerms(query);
    const { data: response, isPending } = useQueryData(["product-search", query], () => searchProducts(query), { enabled: terms[0]?.length >= 2, staleTime: 60_000 });
    const keywordResults = (response as IProductResponse | undefined)?.products || [];
    const [ai, setAi] = useState<{ products: any[]; summary: string | null } | null>(null);

    useEffect(() => {
        let active = true;
        setAi(null);
        if (!AI_SEARCH_ENABLED || query.trim().length < 2) return;
        const timer = window.setTimeout(async () => {
            const res = await aiSemanticSearch(query, { collections: ["products"], limit: 20 });
            if (!active || !res?.groups?.products?.length) return;
            const nameIndex = new Map(keywordResults.map((p) => [String(p?.name || "").toLowerCase(), p]));
            const ranked: any[] = [];
            const seen = new Set<string>();
            for (const hit of res.groups.products) {
                const meta = hit.metadata || {};
                const match = nameIndex.get(String(meta.name || hit.title || "").toLowerCase());
                if (!match) continue;
                const key = String(match._id);
                if (seen.has(key)) continue;
                seen.add(key);
                ranked.push({ ...match, score: hit.score });
            }
            setAi({ products: ranked, summary: res.summary || null });
        }, 250);
        return () => { active = false; window.clearTimeout(timer); };
    }, [query]);

    const merged = ai?.products?.length
        ? [...ai.products, ...keywordResults.filter((p) => !ai.products.some((ap) => String(ap._id) === String(p._id)))].slice(0, 20)
        : keywordResults;

    return { data: { products: merged }, isPending, aiSummary: ai?.summary || null, aiEnabled: AI_SEARCH_ENABLED };
}

export const useGetProductByCategory = (category: string) => {
    const { data, isPending } = useQueryData(["products-category", category], () => getProductByCategory(category));
    return { data: data as IProductResponse, isPending };
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
    const { data: response, isPending } = useQueryData(
        ["products-filter", searchQuery, serviceCategories, turnarounds, formats, materials, priceRange],
        () => filterProducts({ minPrice: priceRange[0], maxPrice: priceRange[1], category: serviceCategories.map((category) => categorySections[category] || category.toUpperCase()), size: formats, limit: 1000, page: 1 }),
        { staleTime: 60_000 }
    );
    let filtered = [...((response as IProductResponse | undefined)?.products || [])];

    const [aiRanked, setAiRanked] = useState<string[] | null>(null);
    const [aiSummary, setAiSummary] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setAiRanked(null);
        setAiSummary(null);
        if (!AI_SEARCH_ENABLED || searchQuery.trim().length < 2) return;
        const timer = window.setTimeout(async () => {
            const res = await aiSemanticSearch(searchQuery, { collections: ["products"], limit: 20 });
            if (!active || !res?.groups?.products?.length) return;
            const order: string[] = [];
            for (const hit of res.groups.products) {
                const meta = hit.metadata || {};
                const match = filtered.find((p) => String(p?.name || "").toLowerCase() === String(meta.name || hit.title || "").toLowerCase());
                if (match) order.push(String(match._id));
            }
            setAiRanked(order);
            setAiSummary(res.summary || null);
        }, 250);
        return () => { active = false; window.clearTimeout(timer); };
    }, [searchQuery]);
    
    if (searchQuery) {
        const terms = getSearchTerms(searchQuery);
        filtered = filtered.filter((product) => matchesSearch(product, terms));
    }

    if (aiRanked && aiRanked.length > 0) {
        const rankIndex = new Map(aiRanked.map((id, i) => [id, i]));
        filtered = [...filtered].sort((a, b) =>
            (rankIndex.get(String(a._id)) ?? 999) - (rankIndex.get(String(b._id)) ?? 999)
        );
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
        filtered = filtered.filter(p => p?.sizes && p.sizes.some((s: any) => formats.includes(typeof s === "string" ? s : s.size)));
    }

    if (turnarounds.length > 0) {
        filtered = filtered.filter(p => turnarounds.some(value => value.startsWith("Express") ? (p.productionTurnaround?.expressDays ?? 0) > 0 : (p.productionTurnaround?.standardDays ?? 0) > 0));
    }

    if (materials.length > 0) {
        filtered = filtered.filter(p => materials.some(value => p.specifications?.material?.toLowerCase().includes(value.toLowerCase()) || p.printingOptions?.some(option => option.name.toLowerCase().includes(value.toLowerCase()))));
    }

    return { data: { products: filtered }, isPending, refetch: () => Promise.resolve(), aiSummary, aiEnabled: AI_SEARCH_ENABLED };
}
