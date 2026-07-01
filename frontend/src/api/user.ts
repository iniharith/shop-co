/**
 * Coded by Harith
 * Kampungcetak ®
 */
import axios from "axios";

// ── User API calls bypass Next.js proxy and hit backend directly
// This solves the "not found api users" error caused by missing proxy routes.
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const userProxy = (token: string = "") =>
  axios.create({
    baseURL: BACKEND,
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

export const getProfile = async (token: string) => {
  const response = await userProxy(token).get("/api/user/profile");
  return response.data;
};

export const updateProfile = async (data: any, token: string) => {
  const response = await userProxy(token).put("/api/user/profile", data);
  return response.data;
};

export const getStaff = async (token: string) => {
  const response = await userProxy(token).get("/api/user/staff");
  return response.data;
};
