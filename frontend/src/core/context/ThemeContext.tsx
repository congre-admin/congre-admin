import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Theme } from '@mui/material/styles';
import type { ThemeConfig } from '../../types';
import { createCongregacionTheme } from '../theme/theme';
import { getAllConfigs, setConfig } from '../../utils/settingsCache';

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
  const allConfigs = getAllConfigs();
  if (allConfigs.theme_config) {
    try { return JSON.parse(allConfigs.theme_config); } catch { /* ignore */ }
  }
  return DEFAULT_THEME_CONFIG;
}

function setThemeColorsFromConfig(config: ThemeConfig): void {
  const root = document.documentElement;
  if (config.primary) {
    root.style.setProperty('--theme-primary', config.primary);
  }
}

const DARK_MODE_KEY = 'congre_dark_mode';

function loadCachedMode(): 'light' | 'dark' {
  return (localStorage.getItem(DARK_MODE_KEY) as 'light' | 'dark') || 'light';
}

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

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<'light' | 'dark'>(loadCachedMode);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(loadThemeConfigFromCache);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkForConfigUpdates = () => {
      const freshConfig = loadThemeConfigFromCache();
      const allConfigs = getAllConfigs();
      const hasStoredConfig = !!allConfigs.theme_config;
      
      if (hasStoredConfig) {
        setThemeConfig(freshConfig);
      }
    };

    checkForConfigUpdates();

    const interval = setInterval(checkForConfigUpdates, 500);
    setTimeout(() => clearInterval(interval), 3000); 

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setThemeColorsFromConfig(themeConfig);
    setIsLoading(false);
  }, [themeConfig]);

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
    setConfig('theme_config', JSON.stringify(config));
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
