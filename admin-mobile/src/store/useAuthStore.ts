import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: any | null;
  setAuth: (token: string, user: any, refreshToken?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  setAuth: async (token, user, refreshToken = null) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    if (refreshToken) await AsyncStorage.setItem('refreshToken', refreshToken);
    set({ token, user, refreshToken });
  },
  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    set({ token: null, refreshToken: null, user: null });
  },
  checkAuth: async () => {
    const token = await AsyncStorage.getItem('token');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const userStr = await AsyncStorage.getItem('user');
    if (token && userStr) {
      set({ token, refreshToken, user: JSON.parse(userStr) });
    }
  },
}));
