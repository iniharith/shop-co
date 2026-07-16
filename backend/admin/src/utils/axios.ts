/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client"
import axios from 'axios';
import { getSession } from "next-auth/react";
import { refreshAuth } from "@/api/auth";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Single shared axios instance so the 401 interceptor is registered once.
const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 60000,
});

// Registered by LiveSessionMonitor (which holds the NextAuth `update` fn).
// Returns the new access token after a successful refresh, or null.
type RefreshHandler = () => Promise<string | null>;
let _sessionRefreshHandler: RefreshHandler | null = null;
export const registerSessionRefresh = (handler: RefreshHandler | null) => {
  _sessionRefreshHandler = handler;
};

let _refreshing: Promise<string | null> | null = null;

const attemptRefresh = async (): Promise<string | null> => {
  if (_refreshing) return _refreshing;
  _refreshing = (async () => {
    try {
      const session = await getSession();
      const refreshToken = (session?.user as any)?.refreshToken;
      if (!refreshToken) return null;
      const res = await refreshAuth(refreshToken);
      if (res?.success && res?.accessToken) {
        const newToken = res.accessToken;
        // Persist new tokens back into the NextAuth session if a handler is registered.
        if (_sessionRefreshHandler) {
          const persisted = await _sessionRefreshHandler();
          if (persisted) return persisted;
        }
        return newToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      _refreshing = null;
    }
  })();
  return _refreshing;
};

// Public helper used by LiveSessionMonitor to refresh + persist the session token.
export const refreshSessionToken = async (): Promise<boolean> => {
  const token = await attemptRefresh();
  return !!token;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await attemptRefresh();
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

const AxiosInstance = (token: string = "") => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
  return api;
};

export default AxiosInstance;
