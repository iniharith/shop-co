import AxiosInstance from "@/utils/axios";
import { ADMIN_URL } from "@/constants/api";


export const getUsers = async (token: string) => {
    const response = await AxiosInstance(token).get(`${ADMIN_URL}/users`);
    return response.data;
}


export const deleteUser = async (token: string, id: string) => {
    const response = await AxiosInstance(token).delete(`${ADMIN_URL}/users/${id}`);
    return response.data;
}

export const createUser = async (token: string, data: any) => {
    const response = await AxiosInstance(token).post(`${ADMIN_URL}/users`, data);
    return response.data;
}

export const updateUser = async (token: string, id: string, data: any) => {
    const response = await AxiosInstance(token).put(`${ADMIN_URL}/users/${id}`, data);
    return response.data;
}

export const seedTestData = async (token: string) => {
    const response = await AxiosInstance(token).post(`${ADMIN_URL}/seed-test-data`);
    return response.data;
}

export const clearTestData = async (token: string) => {
    const response = await AxiosInstance(token).delete(`${ADMIN_URL}/clear-test-data`);
    return response.data;
}

export const uploadUserAvatar = async (token: string, id: string, file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await AxiosInstance(token).post(`${ADMIN_URL}/users/${id}/avatar`, formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response.data;
}
