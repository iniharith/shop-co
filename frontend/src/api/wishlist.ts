"use client";
import AxiosInstance from "@/utils/axios";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export const addToWishlist = async (token: string, productId: string) => {
  const response = await AxiosInstance(token).post(`${API}/api/wishlist/${productId}`);
  return response.data;
};

export const removeFromWishlist = async (token: string, productId: string) => {
  const response = await AxiosInstance(token).delete(`${API}/api/wishlist/${productId}`);
  return response.data;
};

export const getWishlist = async (token: string) => {
  const response = await AxiosInstance(token).get(`${API}/api/wishlist`);
  return response.data;
};

export const checkWishlist = async (token: string, productId: string) => {
  const response = await AxiosInstance(token).get(`${API}/api/wishlist/check/${productId}`);
  return response.data;
};
