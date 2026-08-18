"use client";
import AxiosInstance from "@/utils/axios";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export const submitReview = async (
  token: string,
  data: { orderId: string; productId: string; rating: number; comment?: string }
) => {
  const response = await AxiosInstance(token).post(`${API}/api/reviews`, data);
  return response.data;
};

export const getOrderReview = async (token: string, orderId: string) => {
  const response = await AxiosInstance(token).get(`${API}/api/reviews/order/${orderId}`);
  return response.data;
};

export const getProductReviews = async (productId: string, page = 1, limit = 10) => {
  const response = await AxiosInstance().get(`${API}/api/reviews/product/${productId}?page=${page}&limit=${limit}`);
  return response.data;
};
