import AxiosInstance from "@/utils/axios";

export const getTasks = async (token: string, filters?: any) => {
    let url = `/api/tasks`;
    if (filters) {
        const queryParams = new URLSearchParams(filters).toString();
        url += `?${queryParams}`;
    }
    const response = await AxiosInstance(token).get(url);
    return response.data;
}

export const createTask = async (token: string, data: any) => {
    const response = await AxiosInstance(token).post(`/api/tasks`, data);
    return response.data;
}

export const updateTask = async (token: string, id: string, data: any) => {
    const response = await AxiosInstance(token).put(`/api/tasks/${id}`, data);
    return response.data;
}

export const deleteTask = async (token: string, id: string) => {
    const response = await AxiosInstance(token).delete(`/api/tasks/${id}`);
    return response.data;
}

export const addTaskComment = async (token: string, id: string, text: string) => {
    const response = await AxiosInstance(token).post(`/api/tasks/${id}/comments`, { text });
    return response.data;
}

export const uploadTaskFile = async (token: string, taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await AxiosInstance(token).post(`/api/tasks/${taskId}/files`, formData);
    return response.data;
}

export const deleteTaskFile = async (token: string, taskId: string, fileId: string) => {
    const response = await AxiosInstance(token).delete(`/api/tasks/${taskId}/files/${fileId}`);
    return response.data;
}