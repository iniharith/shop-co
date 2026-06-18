"use client"
import { AUTH_URL } from "@/constants/api"
import AxiosInstance from "@/utils/axios"



export const login = async (data: { email: string, password: string }) => {
    const response = await AxiosInstance().post(`${AUTH_URL}/login`, {
        email: data.email,
        password: data.password
    });
    return response.data
}





export const signUp = async (data: any) => {
    const response = await AxiosInstance().post(`${AUTH_URL}/register`, data);
    return response.data
}

  





