import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Theme } from '@mui/material/styles';
import type { ThemeConfig } from '../../types';
import { createCongregacionTheme } from '../theme/theme';
import { getCachedSettings, setCachedSettings } from '../../utils/settingsCache';

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  primary: '#1976d2',
  harmony: 'complementary',
  backgrounds: {
    lightPage: { mode: 'auto' as const, value: null },
    lightPanel: { mode: 'auto' as const, value: null },
    darkPage: { mode: 'auto' as const, value: null },
    darkPanel: { mode: 'auto' as const, value: null },
  },
};

function loadThemeConfigFromCache(): ThemeConfig {
  const cached = getCachedSettings();
  if (cached?.data.theme_config) {
    try { return JSON.parse(cached.data.theme_config); } catch { /* ignore */ }
  }
  return DEFAULT_THEME_CONFIG;
}

const DARK_MODE_KEY = 'congre_dark_mode';
const ADMIN_SS_ID_KEY = 'congre_admin_ss_id';
const PUBLIC_SS_ID_KEY = 'congre_public_ss_id';

interface ThemeContextType {
  theme: Theme;
  themeConfig: ThemeConfig;
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
  toggleDarkMode: () => void;
  updateThemeConfig: (config: ThemeConfig) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function loadCachedMode(): 'light' | 'dark' {
  return (localStorage.getItem(DARK_MODE_KEY) as 'light' | 'dark') || 'light';
}

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<'light' | 'dark'>(loadCachedMode);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(loadThemeConfigFromCache);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Theme config is always cached by AuthContext on mount/login.
    // Just check if cache is populated; if not, use defaults (already set in state).
    setIsLoading(false);
  }, []);

  const themes = createCongregacionTheme(themeConfig);
  const theme = mode === 'light' ? themes.light : themes.dark;

  const setMode = useCallback((newMode: 'light' | 'dark') => {
    setModeState(newMode);
    localStorage.setItem(DARK_MODE_KEY, newMode);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(DARK_MODE_KEY, next);
      return next;
    });
  }, []);

  const updateThemeConfig = useCallback((config: ThemeConfig) => {
    setThemeConfig(config);
    const existing = getCachedSettings();
    setCachedSettings({ ...existing?.data, theme_config: JSON.stringify(config) });
  }, []);

  return (
    <ThemeContext.Provider value={{
      theme,
      themeConfig,
      mode,
      setMode,
      toggleDarkMode,
      updateThemeConfig,
      isLoading,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeContextProvider');
  }
  return context;
}
