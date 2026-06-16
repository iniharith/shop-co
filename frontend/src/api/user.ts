import { USER_URL } from "@/constants/api";
import AxiosInstance from "@/utils/axios";

export const getProfile = async (token: string) => {
    const response = await AxiosInstance(token).get(USER_URL + "/profile");
    return response.data;
};

export const updateProfile = async (data: any, token: string) => {
    const response = await AxiosInstance(token).put(USER_URL + "/profile", data);
    return response.data;
};
