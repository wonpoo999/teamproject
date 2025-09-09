// src/theme/ThemeContext.js
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Appearance } from 'react-native';

const ThemeCtx = createContext(null);
export const useThemeMode = () => useContext(ThemeCtx);

// 라이트 모드 색상 정의
const lightTheme = {
  mode: 'light',
  text: '#000000',
  bg: '#ffffff',
  inputBorder: '#cccccc',
  cardBg: '#f9f9f9',
  cardBorder: '#dddddd',
  ghostBg: 'rgba(0,0,0,0.04)',
  homeBg: '#ffffff', // ✅ 홈 배경 추가
};

// 다크 모드 색상 정의
const darkTheme = {
  mode: 'dark',
  text: '#ffffff',
  bg: '#000000',
  inputBorder: '#555555',
  cardBg: '#111111',
  cardBorder: '#333333',
  ghostBg: 'rgba(255,255,255,0.08)',
  homeBg: '#000000', // ✅ 홈 배경 추가
};

export function ThemeProvider({ children }) {
  // 시스템 모드 가져오기
  const systemScheme = Appearance.getColorScheme?.() || 'light';
  const [mode, setMode] = useState(systemScheme);

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(() => {
    const theme = mode === 'dark' ? darkTheme : lightTheme;
    return {
      mode,
      isDark: mode === 'dark',
      colors: theme,
      theme, // ✅ colors와 theme 둘 다 제공 (호환성)
      toggleTheme,
    };
  }, [mode, toggleTheme]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
