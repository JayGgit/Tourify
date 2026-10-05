import React, { createContext, useContext, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const lightTheme = {
  mode: 'light',
  background: '#F4F7FB',
  surface: '#FFFFFF',
  elevatedSurface: '#EEF4FF',
  text: '#152033',
  mutedText: '#475569',
  border: '#E5E7EB',
};

const darkTheme = {
  mode: 'dark',
  background: '#090B10',
  surface: '#151922',
  elevatedSurface: '#202631',
  text: '#F8FAFC',
  mutedText: '#CBD5E1',
  border: '#303846',
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? darkTheme : lightTheme;
  const value = useMemo(() => ({
    theme,
    isDark,
    toggleTheme: () => setIsDark((current) => !current),
  }), [isDark, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}