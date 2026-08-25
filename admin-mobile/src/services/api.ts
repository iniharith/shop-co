import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = 'https://shop-co-production.up.railway.app';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config as typeof error.config & { _authRetry?: boolean; _networkRetry?: boolean };

    if (error.response?.status === 401 && config && !config._authRetry) {
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      if (storedRefreshToken) {
        config._authRetry = true;
        refreshPromise ??= axios
          .post(`${API_URL}/api/auth/refresh`, { refreshToken: storedRefreshToken }, { timeout: 30000 })
          .then(async response => {
            const accessToken = response.data?.accessToken;
            if (!accessToken) throw new Error('Refresh response did not include an access token');
            await AsyncStorage.setItem('token', accessToken);
            if (response.data?.refreshToken) await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
            return accessToken;
          })
          .finally(() => { refreshPromise = null; });
        try {
          const accessToken = await refreshPromise;
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${accessToken}`;
          return api.request(config);
        } catch {
          await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
        }
      }
    }

    const transient = !error.response || error.code === 'ECONNABORTED' || error.response?.status >= 500;
    if (config?.method?.toLowerCase() === 'get' && transient && !config._networkRetry) {
      config._networkRetry = true;
      await new Promise(resolve => setTimeout(resolve, 500));
      return api.request(config);
    }

    return Promise.reject(error);
  },
);

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (config.headers) {
    config.headers['Bypass-Tunnel-Reminder'] = 'true';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
