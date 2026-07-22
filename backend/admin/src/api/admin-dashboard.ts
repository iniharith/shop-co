/**
 * Coded by Harith
 * Kampungcetak ®
 */
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

export const getCustomerUpdateSettings = async (token: string) => {
    const response = await AxiosInstance(token).get(`${PARCELS_URL}/customer-update-settings`);
    return response.data;
}

export const updateCustomerUpdateSettings = async (token: string, enabled: boolean) => {
    const response = await AxiosInstance(token).put(`${PARCELS_URL}/customer-update-settings`, { enabled });
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

// Slim, unwindowed listing (name/count fields only) used to render the
// folder list fast on the Artworks/Production/Packaging pages.
export const getFileIndex = async (token: string) => {
    const response = await AxiosInstance(token).get(`${FILES_URL}/index`);
    return response.data;
}

// Full file details for one folder, fetched only once that folder is opened.
export const getFilesByFolder = async (token: string, params: { taskId?: string; orderId?: string; userId?: string }) => {
    const query = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => !!v)) as Record<string, string>
    ).toString();
    const response = await AxiosInstance(token).get(`${FILES_URL}/by-folder?${query}`);
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

export const bulkDeleteFiles = async (token: string, fileIds: string[]) => {
    const response = await AxiosInstance(token).post(`${FILES_URL}/bulk-delete`, { fileIds });
    return response.data;
}

export const createShareLink = async (token: string, data: { folderName: string; taskId?: string; orderId?: string; userId?: string; folderId?: string }) => {
    const response = await AxiosInstance(token).post(`${FILES_URL}/share-link`, data);
    return response.data;
}

export const getFolders = async (token: string) => {
    const response = await AxiosInstance(token).get(`/api/folders`);
    return response.data;
}

export const createFolder = async (token: string, data: { name: string; taskId?: string; userId?: string }) => {
    const response = await AxiosInstance(token).post(`/api/folders`, data);
    return response.data;
}

export const renameFolder = async (token: string, id: string, name: string) => {
    const response = await AxiosInstance(token).put(`/api/folders/${id}`, { name });
    return response.data;
}

export const deleteFolder = async (token: string, id: string) => {
    const response = await AxiosInstance(token).delete(`/api/folders/${id}`);
    return response.data;
}

export const moveFile = async (token: string, fileId: string, folderId: string | null) => {
    const response = await AxiosInstance(token).put(`/api/files/${fileId}/move`, { folderId });
    return response.data;
}

// Single combined call for the dashboard overview screen — replaces the
// 5 separate parallel requests (orders/parcels/files/tasks/folders, plus
// online-users) that used to fire on every page open.
export const getDashboardSummary = async (token: string) => {
    const response = await AxiosInstance(token).get(`/api/sysadmin/dashboard-summary`);
    return response.data;
}
