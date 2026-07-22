/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { CART_URL } from "@/constants/api";
import AxiosInstance from "@/utils/axios";

// Helper to get local cart
const getLocalCart = () => {
    if (typeof window !== "undefined") {
        return JSON.parse(localStorage.getItem("mock_cart") || "[]");
    }
    return [];
};

const saveLocalCart = (cart: any[]) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("mock_cart", JSON.stringify(cart));
    }
};

export const addToCart = async (productId: string, size: string, quantity: number, token: string, artworkUrl?: string) => {
    // Intercept dummy products to bypass backend verification
    if (productId.startsWith("prod-")) {
        const { dummyProducts } = await import("@/constants/dummy-products");
        const product = dummyProducts.find(p => p._id === productId);
        if (product) {
            const cart = getLocalCart();
            const existing = cart.find((item: any) => item.product._id === productId && item.size === size);
            if (existing) {
                existing.quantity += quantity;
            } else {
                cart.push({ product, size, quantity, artworkUrl });
            }
            saveLocalCart(cart);
            return { success: true, cart };
        }
    }

    const response = await AxiosInstance(token).post(`${CART_URL}/add`, {
        productId,
        size,
        quantity,
        artworkUrl
    });
    return response.data;
};

export const getCart = async (token: string) => {
    try {
        const response = await AxiosInstance(token).get(`${CART_URL}`);
        
        // Merge real backend cart with local dummy cart
        const localCart = getLocalCart();
        if (response?.data?.cart?.items) {
            response.data.cart.items = [...response.data.cart.items, ...localCart];
        } else if (localCart.length > 0) {
            return { cart: { items: localCart } };
        }
        
        return response.data;
    } catch (e) {
        // If backend fails, return local cart anyway
        const localCart = getLocalCart();
        return { cart: { items: localCart } };
    }
};

export const clearCart = async (token: string) => {
    saveLocalCart([]);
    try {
        const response = await AxiosInstance(token).delete(`${CART_URL}/clear`);
        return response.data;
    } catch (e) {
        return { success: true };
    }
};

export const removeFromCart = async (productId: string, size: string, token: string) => {
    if (productId.startsWith("prod-")) {
        const cart = getLocalCart().filter((item: any) => !(item.product._id === productId && item.size === size));
        saveLocalCart(cart);
        return { success: true, cart };
    }

    const response = await AxiosInstance(token).delete(`${CART_URL}/remove`, {
        data: {
            productId,
            size
        }
    });
    return response.data;
};
