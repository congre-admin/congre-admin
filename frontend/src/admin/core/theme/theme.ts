import { createTheme } from '@mui/material/styles';

const DEFAULT_PRIMARY = '#1976d2';
const DEFAULT_SECONDARY = '#dc004e';

function getCSSVariable(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(key).trim();
  return value || fallback;
}

function createThemeWithColors(
  mode: 'light' | 'dark',
  primaryColor?: string,
  secondaryColor?: string
) {
  const primary = primaryColor || getCSSVariable('--theme-primary', DEFAULT_PRIMARY);
  const secondary = secondaryColor || getCSSVariable('--theme-secondary', DEFAULT_SECONDARY);
  
  if (mode === 'light') {
    return createTheme({
      palette: {
        mode: 'light',
        primary: {
          main: primary,
          light: primary,
          dark: primary,
        },
        secondary: {
          main: secondary,
          light: secondary,
          dark: secondary,
        },
        success: { main: '#2e7d32' },
        warning: { main: '#ed6c02' },
        error: { main: '#d32f2f' },
        background: {
          default: '#ffffff',
          paper: '#f5f5f5',
        },
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 8,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: { borderRadius: 12 },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: { borderRadius: 8 },
          },
        },
      },
    });
  }
  
  return createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: primary,
        light: primary,
        dark: primary,
      },
      secondary: {
        main: secondary,
        light: secondary,
        dark: secondary,
      },
      success: { main: '#2e7d32' },
      warning: { main: '#ed6c02' },
      error: { main: '#d32f2f' },
      background: {
        default: '#121212',
        paper: '#1e1e1e',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },
    },
  });
}

export const theme = createThemeWithColors('light');
export const darkTheme = createThemeWithColors('dark');

export function getDynamicTheme(mode: 'light' | 'dark', primaryColor?: string, secondaryColor?: string) {
  return createThemeWithColors(mode, primaryColor, secondaryColor);
}