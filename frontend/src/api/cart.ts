/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { CART_URL } from "@/constants/api";
import AxiosInstance from "@/utils/axios";
import { IProductConfiguration } from "@/types/ICart";

export interface CartLineInput {
    productId: string;
    size: string;
    quantity: number;
    artworkUrl?: string;
    configuration?: IProductConfiguration;
    configurationKey?: string;
    unitPrice?: number;
    fixedPrice?: number;
    lineTotal?: number;
    pricingVersion?: string;
}

export const addToCart = async (input: CartLineInput, token: string, replaceQuantity = false) => {
    const { productId, size, quantity, configurationKey } = input;
    const response = replaceQuantity
        ? await AxiosInstance(token).put(`${CART_URL}/update`, { productId, size, quantity, configurationKey })
        : await AxiosInstance(token).post(`${CART_URL}/add`, input);
    return response.data;
};

export const getCart = async (token: string) => {
    try {
        const response = await AxiosInstance(token).get(`${CART_URL}`);

        return response.data;
    } catch (e) {
        throw e;
    }
};

export const clearCart = async (token: string) => {
    try {
        const response = await AxiosInstance(token).delete(`${CART_URL}/clear`);
        return response.data;
    } catch (e) {
        throw e;
    }
};

export const removeFromCart = async (productId: string, size: string, token: string, configurationKey?: string) => {
    const response = await AxiosInstance(token).delete(`${CART_URL}/remove`, {
        data: {
            productId,
            size,
            configurationKey
        }
    });
    return response.data;
};
