"use client"
import axios from 'axios';

const AxiosInstance = (token: string="") => {
    return axios.create({
        baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
        withCredentials: true,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
}
export default AxiosInstance;