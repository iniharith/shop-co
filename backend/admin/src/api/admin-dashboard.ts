import AxiosInstance from "@/utils/axios";
import { PARCELS_URL, FILES_URL } from "@/constants/api";

export const getParcelStats = async (token: string) => {
    const response = await AxiosInstance(token).get(`${PARCELS_URL}/stats`);
    return response.data;
}

export const getParcels = async (token: string) => {
    const response = await AxiosInstance(token).get(`${PARCELS_URL}`);
    return response.data;
}

export const syncParcelTracking = async (token: string, id: string) => {
    const response = await AxiosInstance(token).put(`${PARCELS_URL}/${id}/track`);
    return response.data;
}

export const updateParcel = async (token: string, id: string, updateData: any) => {
    const response = await AxiosInstance(token).put(`${PARCELS_URL}/${id}`, updateData);
    return response.data;
}

export const sendWhatsAppNotification = async (token: string, id: string) => {
    const response = await AxiosInstance(token).post(`${PARCELS_URL}/${id}/whatsapp`);
    return response.data;
}

export const getFileStats = async (token: string) => {
    const response = await AxiosInstance(token).get(`${FILES_URL}/stats`);
    return response.data;
}

export const getGroupedFiles = async (token: string) => {
    const response = await AxiosInstance(token).get(`${FILES_URL}/grouped`);
    return response.data;
}

export const getAllFiles = async (token: string) => {
    const response = await AxiosInstance(token).get(`${FILES_URL}`);
    return response.data;
}

export const reviewFile = async (token: string, id: string, reviewed: boolean, notes?: string) => {
    const response = await AxiosInstance(token).put(`${FILES_URL}/${id}/review`, { reviewed, notes });
    return response.data;
}

export const deleteFile = async (token: string, id: string) => {
    const response = await AxiosInstance(token).delete(`${FILES_URL}/${id}`);
    return response.data;
}
