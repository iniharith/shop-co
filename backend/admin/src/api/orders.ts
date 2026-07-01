/**
 * Coded by Harith
 * Kampungcetak ®
 */
import AxiosInstance from "@/utils/axios";
import { ADMIN_URL, ORDER_URL } from "@/constants/api";


export const getOrders = async (token: string) => {
    const response = await AxiosInstance(token).get(`${ADMIN_URL}/orders`);
    return response.data;
}




export const updateOrderStatus = async (token: string, orderId: string, status: string) => {
    const response = await AxiosInstance(token).put(`${ORDER_URL}/${orderId}`, { status });
    return response.data;
}

export const archiveOrder = async (token: string, orderId: string, isArchived: boolean) => {
    const response = await AxiosInstance(token).put(`${ORDER_URL}/${orderId}/archive`, { isArchived });
    return response.data;
}

export const createManualOrder = async (token: string, data: any) => {
    const response = await AxiosInstance(token).post(`${ADMIN_URL}/orders/manual`, data);
    return response.data;
}

export const deleteOrder = async (token: string, orderId: string) => {
    const response = await AxiosInstance(token).delete(`${ADMIN_URL}/orders/${orderId}`);
    return response.data;
}

export const bulkDeleteOrders = async (token: string, orderIds: string[]) => {
    const response = await AxiosInstance(token).post(`${ADMIN_URL}/orders/bulk-delete`, { orderIds });
    return response.data;
}




