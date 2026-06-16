import axios from "axios";

// ── User API calls go through the Next.js proxy route (/api/user/profile)
// so they work regardless of how NEXT_PUBLIC_BACKEND_URL is configured.
const userProxy = (token: string = "") =>
  axios.create({
    // No baseURL → calls same origin (Next.js handles proxy to backend)
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
