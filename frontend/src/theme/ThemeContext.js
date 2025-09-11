// src/theme/ThemeContext.js
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@theme/mode';

const lightTheme = {
  name: 'light',
  text: '#111827',
  mutedText: '#6b7280',
  bg: '#ffffff',
  cardBg: 'rgba(255,255,255,0.9)',
  cardBorder: 'rgba(0,0,0,0.08)',
  inputBg: '#ffffff',
  inputBorder: '#e5e7eb',
  ghostBg: 'rgba(255,255,255,0.75)',
  primary: '#111827',
  scrim: 'rgba(0,0,0,0.5)',
  homeBg: require('../../assets/background/home.png'),
  chipOn: '#111827',
  chipOff: 'rgba(0,0,0,0.04)',
  chipOnText: '#fff',
  chipOffText: '#111827',
};

const darkTheme = {
  name: 'dark',
  text: '#e5e7eb',
  mutedText: '#9ca3af',
  bg: '#0b0f1a',
  cardBg: 'rgba(17,24,39,0.9)',
  cardBorder: 'rgba(255,255,255,0.08)',
  inputBg: 'rgba(17,24,39,0.9)',
  inputBorder: 'rgba(255,255,255,0.15)',
  ghostBg: 'rgba(31,41,55,0.85)',
  primary: '#10b981',
  scrim: 'rgba(0,0,0,0.6)',
  homeBg: require('../../assets/background/home_dark.png'),
  chipOn: '#374151',
  chipOff: 'rgba(255,255,255,0.06)',
  chipOnText: '#e5e7eb',
  chipOffText: '#e5e7eb',
};

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const m = await AsyncStorage.getItem(THEME_KEY);
        if (m === 'dark') setIsDark(true);
        if (m === 'light') setIsDark(false);
      } catch {}
    })();
  }, []);

  const setMode = useCallback(async (mode) => {
    const v = mode === 'dark';
    setIsDark(v);
    try { await AsyncStorage.setItem(THEME_KEY, v ? 'dark' : 'light'); } catch {}
  }, []);

  const toggle = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light').catch(() => {});
      return next;
    });
  }, []);

  const theme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);

  // ✅ alias 포함(기존 toggleTheme/mode 사용처 호환)
  const value = useMemo(() => ({
    isDark,
    mode: isDark ? 'dark' : 'light',
    theme,
    toggle,
    toggleTheme: toggle,
    setMode,
  }), [isDark, theme, toggle, setMode]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeCtx);
  if (ctx) return ctx;
  // 안전 기본값
  return {
    isDark: false,
    mode: 'light',
    theme: lightTheme,
    toggle: () => {},
    toggleTheme: () => {},
    setMode: () => {},
  };
}
