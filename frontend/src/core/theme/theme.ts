import { createTheme, Theme } from '@mui/material/styles';
import type { ThemeConfig } from '../../types';
import { generatePalette, generateBackgrounds, resolveBackground, resolveBackgroundDark } from '../../utils/color';

const NEUTRAL_BG = {
  light: { page: '#f5f5f5', panel: '#ffffff' },
  dark: { page: '#121212', panel: '#1e1e1e' },
};

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  primary: '#1976d2',
  harmony: 'complementary',
  backgrounds: {
    lightPage: { mode: 'auto', value: null },
    lightPanel: { mode: 'auto', value: null },
    darkPage: { mode: 'auto', value: null },
    darkPanel: { mode: 'auto', value: null },
  },
};

export function createCongregacionTheme(config?: Partial<ThemeConfig>): { light: Theme; dark: Theme } {
  const fullConfig: ThemeConfig = { ...DEFAULT_THEME_CONFIG, ...config };
  const palette = generatePalette(fullConfig.primary, fullConfig.harmony);
  const autoBg = generateBackgrounds(fullConfig.primary);

  const lightBgPage = resolveBackground(fullConfig.backgrounds.lightPage, autoBg.light.page);
  const lightBgPanel = resolveBackground(fullConfig.backgrounds.lightPanel, autoBg.light.panel);
  const darkBgPage = resolveBackgroundDark(fullConfig.backgrounds.darkPage, autoBg.dark.page);
  const darkBgPanel = resolveBackgroundDark(fullConfig.backgrounds.darkPanel, autoBg.dark.panel);

  const light = createTheme({
    palette: {
      mode: 'light',
      primary: palette.primary,
      secondary: palette.secondary,
      success: { main: '#2e7d32' },
      warning: { main: '#ed6c02' },
      error: { main: '#d32f2f' },
      background: {
        default: lightBgPage,
        paper: lightBgPanel,
      },
    },
    typography: {
      fontFamily: '"Google Sans Flex", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontSize: '2.5rem', fontWeight: 500 },
      h2: { fontSize: '2rem', fontWeight: 500 },
      h3: { fontSize: '1.75rem', fontWeight: 500 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          body {
            font-family: 'Google Sans Flex', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            font-variation-settings: 'wdth' 85;
          }
          @media (min-width: 600px) {
            body { font-variation-settings: 'wdth' 92; }
          }
          @media (min-width: 1200px) {
            body { font-variation-settings: 'wdth' 100; }
          }
        `,
      },
      MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: 8 } } },
      MuiCard: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiTextField: { styleOverrides: { root: { borderRadius: 8 } } },
    },
  });

  const dark = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: palette.primary.main,
        light: palette.primary.light,
        dark: palette.primary.dark,
      },
      secondary: {
        main: palette.secondary.main,
        light: palette.secondary.light,
        dark: palette.secondary.dark,
      },
      success: { main: '#66bb6a' },
      warning: { main: '#ffa726' },
      error: { main: '#ef5350' },
      background: {
        default: darkBgPage,
        paper: darkBgPanel,
      },
    },
    typography: light.typography,
    components: light.components,
  });

  return { light, dark };
}

export const { light: theme, dark: darkTheme } = createCongregacionTheme();
