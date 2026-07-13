/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client"
import axios from 'axios';


const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL ;

const AxiosInstance = (token: string="") => {
    return axios.create({
        baseURL: baseURL,
        withCredentials: true,
        timeout: 60000,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
}
export default AxiosInstance;