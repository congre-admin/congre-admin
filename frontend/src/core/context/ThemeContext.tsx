import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Theme } from '@mui/material/styles';
import type { ThemeConfig } from '../../types';
import { createCongregacionTheme } from '../theme/theme';
import { getCachedSettings, setCachedSettings, getConfig, setConfig, getAllConfigs } from '../../utils/settingsCache';

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
  // First try core config, then fall back to public config
  const coreConfigs = getAllConfigs(false);
  if (coreConfigs.theme_config) {
    try { return JSON.parse(coreConfigs.theme_config); } catch { /* ignore */ }
  }
  const publicConfigs = getAllConfigs(true);
  if (publicConfigs.theme_config) {
    try { return JSON.parse(publicConfigs.theme_config); } catch { /* ignore */ }
  }
  return DEFAULT_THEME_CONFIG;
}

/**
 * Check if settings exist in localStorage (core or public)
 */
function hasSettingsInStorage(): boolean {
  const coreConfigs = getAllConfigs(false);
  const publicConfigs = getAllConfigs(true);
  return Object.keys(coreConfigs).length > 0 || Object.keys(publicConfigs).length > 0;
}

/**
 * Extract primary color from theme_config and set CSS variable
 */
function setThemeColorsFromConfig(config: ThemeConfig): void {
  const root = document.documentElement;
  if (config.primary) {
    root.style.setProperty('--theme-primary', config.primary);
  }
  if (config.harmony) {
    // Could compute harmony colors here if needed
  }
}

const DARK_MODE_KEY = 'congre_dark_mode';
const ADMIN_SS_ID_KEY = 'congre_admin_ss_id';
const PUBLIC_SS_ID_KEY = 'congre_public_ss_publico';

/**
 * Migrate old localStorage keys to new naming convention
 */
function migrateLegacyKeys(): void {
  // Migrate congre_public_ss_id -> congre_public_ss_publico
  const oldPublicKey = 'congre_public_ss_id';
  const newPublicKey = 'congre_public_ss_publico';
  const oldValue = localStorage.getItem(oldPublicKey);
  if (oldValue && !localStorage.getItem(newPublicKey)) {
    localStorage.setItem(newPublicKey, oldValue);
    localStorage.removeItem(oldPublicKey);
  }
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

function loadCachedMode(): 'light' | 'dark' {
  return (localStorage.getItem(DARK_MODE_KEY) as 'light' | 'dark') || 'light';
}

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  // Migrate any legacy localStorage keys on startup
  useEffect(() => {
    migrateLegacyKeys();
  }, []);

  const [mode, setModeState] = useState<'light' | 'dark'>(loadCachedMode);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(loadThemeConfigFromCache);
  const [isLoading, setIsLoading] = useState(true);

  // Poll for config changes in localStorage (handles async loading from API)
  useEffect(() => {
    const checkForConfigUpdates = () => {
      const freshConfig = loadThemeConfigFromCache();
      // Check if localStorage actually has theme_config stored
      const coreConfigs = getAllConfigs(false);
      const publicConfigs = getAllConfigs(true);
      const hasStoredConfig = !!coreConfigs.theme_config || !!publicConfigs.theme_config;
      
      // Update if we have stored config and it's different from current
      if (hasStoredConfig) {
        setThemeConfig(freshConfig);
      }
    };

    // Check immediately after mount (in case localStorage was populated synchronously)
    checkForConfigUpdates();

    // Also poll for a short period to catch async updates
    const interval = setInterval(checkForConfigUpdates, 500);
    setTimeout(() => clearInterval(interval), 3000); // Stop polling after 3 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Apply theme colors to CSS variables whenever config changes
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
    setCachedSettings({ ...getCachedSettings()?.data, theme_config: JSON.stringify(config) });
    // Also set as individual keys so getConfig() works
    setConfig('theme_config', JSON.stringify(config), false);
    setConfig('theme_config', JSON.stringify(config), true);
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
