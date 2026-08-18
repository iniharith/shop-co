/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { ORDER_URL } from "@/constants/api";
import AxiosInstance from "@/utils/axios";

export const createOrder = async (data: any, token: string) => {
    console.log("ajja")
    const { customerName, orderNotes, ...addressData } = data;
    const response = await AxiosInstance(token).post(ORDER_URL, {
        address: addressData,
        customerName,
        orderNotes
    });
    return response.data;
};

export const getOrders = async (token: string) => {
    const response = await AxiosInstance(token).get(ORDER_URL);
    return response.data;
};

export const getOrdersByUserId = async (token: string) => {
    const response = await AxiosInstance(token).get(ORDER_URL + "/user");
    return response.data;
};


export const getOrderById = async (token: string, id: string) => {
    const response = await AxiosInstance(token).get(ORDER_URL + "/" + id);
    return response.data;
};


export const getPreviousAddress = async (token: string) => {
    const response = await AxiosInstance(token).get(ORDER_URL + "/previous-address");
    return response.data;
};

export const getTracking = async (token: string, id: string) => {
    const response = await AxiosInstance(token).get(`${ORDER_URL}/${id}/tracking`);
    return response.data;
};

export const getShippingQuotations = async (token: string, data: {
    postalCode: string;
    state: string;
    country?: string;
    weight: number;
    width: number;
    length: number;
    height: number;
}, timeout?: number) => {
    const instance = AxiosInstance(token);
    const response = await instance.post(`${ORDER_URL}/shipping/quote`, data, timeout ? { timeout } : undefined);
    return response.data;
};

