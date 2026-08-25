import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES } from '../constants/theme';

type ThemeType = 'dark' | 'light';

interface ThemeContextData {
  theme: ThemeType;
  colors: typeof THEMES.dark | typeof THEMES.light;
  customBackground: string | null;
  hasImageBackground: boolean;
  toggleTheme: () => void;
  setTheme: (t: ThemeType) => void;
  setCustomBackground: (bg: string | null) => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('dark');
  const [customBackground, setCustomBgState] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('app_theme').then(savedTheme => {
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeState(savedTheme as ThemeType);
      }
    });
    AsyncStorage.getItem('app_background').then(savedBg => {
      if (savedBg) setCustomBgState(savedBg);
    });
  }, []);

  const colors = THEMES[theme] || THEMES.dark;
  const hasImageBackground = isBackgroundImage(customBackground);

  const toggleTheme = () => {
    setThemeState(prev => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem('app_theme', nextTheme);
      return nextTheme;
    });
  };

  const setTheme = (t: ThemeType) => {
    setThemeState(t);
    AsyncStorage.setItem('app_theme', t);
  }

  const setCustomBackground = (bg: string | null) => {
    setCustomBgState(bg);
    if (bg) {
      AsyncStorage.setItem('app_background', bg);
    } else {
      AsyncStorage.removeItem('app_background');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, colors, customBackground, hasImageBackground, toggleTheme, setTheme, setCustomBackground }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

export function isBackgroundImage(background: string | null) {
  if (!background || /^#[0-9a-f]{3,8}$/i.test(background)) return false;
  return /^(file|content|ph|https?|data|blob):/i.test(background);
}
