/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client"
import axios from 'axios';
import { getSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { refreshAuth } from "@/api/auth";
import { markSigningOut } from "@/components/layout/liveSessionMonitor";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Single shared axios instance so the 401 interceptor is registered once.
const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
});

// Registered by LiveSessionMonitor (which holds the NextAuth `update` fn).
// Returns the new access token after a successful refresh, or null.
type RefreshHandler = (tokens: { accessToken: string; refreshToken?: string }) => Promise<void>;
let _sessionRefreshHandler: RefreshHandler | null = null;
export const registerSessionRefresh = (handler: RefreshHandler | null) => {
  _sessionRefreshHandler = handler;
};

let _refreshing: Promise<string | null> | null = null;
let _latestAccessToken: string | null = null;
let _isLoggingOut = false;

const triggerForceLogout = () => {
  if (_isLoggingOut) return;
  _isLoggingOut = true;
  markSigningOut();
  if (typeof document !== "undefined") {
    document.cookie = 'fallback_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = '__Secure-next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
  if (typeof window !== "undefined") {
    try { toast.error("Session expired, please login again"); } catch {}
    signOut({ callbackUrl: '/auth/login', redirect: false }).catch(() => {});
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 300);
  }
};

const attemptRefresh = async (): Promise<string | null> => {
  if (_refreshing) return _refreshing;
  _refreshing = (async () => {
    try {
      const session = await getSession();
      const refreshToken = (session?.user as any)?.refreshToken;
      if (!refreshToken) {
        triggerForceLogout();
        return null;
      }
      const res = await refreshAuth(refreshToken);
      if (res?.success && res?.accessToken) {
        const newToken = res.accessToken;
        _latestAccessToken = newToken;
        if (_sessionRefreshHandler) await _sessionRefreshHandler({ accessToken: newToken, refreshToken: res.refreshToken });
        return newToken;
      }
      triggerForceLogout();
      return null;
    } catch {
      triggerForceLogout();
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

api.interceptors.request.use((config) => {
  if (_latestAccessToken && !config.url?.includes('/api/auth/')) {
    config.headers.Authorization = `Bearer ${_latestAccessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = String(originalRequest?.url || '').includes('/api/auth/');
    if (error?.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
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
  if (token && !_latestAccessToken) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else if (_latestAccessToken) {
    api.defaults.headers.common.Authorization = `Bearer ${_latestAccessToken}`;
  }
  return api;
};

export default AxiosInstance;
