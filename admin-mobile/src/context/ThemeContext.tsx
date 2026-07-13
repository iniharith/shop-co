import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES } from '../constants/theme';

type ThemeType = 'dark' | 'light' | 'navy';

interface ThemeContextData {
  theme: ThemeType;
  colors: typeof THEMES.dark | typeof THEMES.light | typeof THEMES.navy;
  toggleTheme: () => void;
  setTheme: (t: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('dark'); // Default to dark (pure black)

  useEffect(() => {
    AsyncStorage.getItem('app_theme').then(savedTheme => {
      if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'navy')) {
        setThemeState(savedTheme as ThemeType);
      }
    });
  }, []);

  const colors = THEMES[theme] || THEMES.dark;

  const toggleTheme = () => {
    // Cycle through: dark (black) -> navy -> light -> dark
    setThemeState(prev => {
      const nextTheme = prev === 'dark' ? 'navy' : prev === 'navy' ? 'light' : 'dark';
      AsyncStorage.setItem('app_theme', nextTheme);
      return nextTheme;
    });
  };

  const setTheme = (t: ThemeType) => {
    setThemeState(t);
    AsyncStorage.setItem('app_theme', t);
  }

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
