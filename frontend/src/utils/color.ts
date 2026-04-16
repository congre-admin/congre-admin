import type { HarmonyMode, BgSetting } from '../types';

const NEUTRAL_BG = {
  light: { page: '#f5f5f5', panel: '#ffffff' },
  dark: { page: '#121212', panel: '#1e1e1e' },
};

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const toHex = (v: number) => {
    const hex = Math.round((v + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function adjustLightness(hex: string, delta: number): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, Math.min(100, l + delta)));
}

export function getRelativeLuminance(hex: string): number {
  const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)]
    .map(c => {
      const v = parseInt(c, 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getAutoTextColor(bgHex: string): '#ffffff' | '#000000' {
  return getRelativeLuminance(bgHex) > 0.4 ? '#000000' : '#ffffff';
}

export function getContrastingTextColor(bgHex: string): string {
  return getContrastRatio(bgHex, '#ffffff') >= 4.5 ? '#ffffff' : '#000000';
}

function getSecondaryHue(h: number, harmony: HarmonyMode): number {
  switch (harmony) {
    case 'complementary': return (h + 180) % 360;
    case 'analogous': return (h + 30) % 360;
    case 'triadic': return (h + 120) % 360;
    case 'split': return (h + 150) % 360;
    case 'monochromatic': return h;
  }
}

export interface ColorPalette {
  primary: { main: string; light: string; dark: string };
  secondary: { main: string; light: string; dark: string };
}

export function generatePalette(baseHex: string, harmony: HarmonyMode, manualSecondary?: string): ColorPalette {
  const { h, s, l } = hexToHsl(baseHex);
  const secH = getSecondaryHue(h, harmony);
  const secS = harmony === 'monochromatic' ? Math.max(0, s - 10) : s;
  const secL = harmony === 'monochromatic' ? Math.max(0, l - 10) : l;

  const secondaryColor = manualSecondary || hslToHex(secH, secS, secL);
  const { h: sh, s: ss, l: sl } = hexToHsl(secondaryColor);

  return {
    primary: {
      main: baseHex,
      light: hslToHex(h, s, Math.min(l + 15, 95)),
      dark: hslToHex(h, s, Math.max(l - 15, 10)),
    },
    secondary: {
      main: secondaryColor,
      light: hslToHex(sh, ss, Math.min(sl + 15, 95)),
      dark: hslToHex(sh, ss, Math.max(sl - 15, 10)),
    },
  };
}

export interface Backgrounds {
  light: { page: string; panel: string };
  dark: { page: string; panel: string };
}

export function generateBackgrounds(primaryHex: string): Backgrounds {
  const { h } = hexToHsl(primaryHex);
  return {
    light: {
      page: hslToHex(h, 8, 97),
      panel: hslToHex(h, 4, 99),
    },
    dark: {
      page: hslToHex(h, 4, 7),
      panel: hslToHex(h, 8, 12),
    },
  };
}

export function resolveBackground(setting: BgSetting, autoValue: string): string {
  switch (setting.mode) {
    case 'auto': return autoValue;
    case 'neutral': return '#f5f5f5';
    case 'custom': return setting.value || autoValue;
  }
}

export function resolveBackgroundDark(setting: BgSetting, autoValue: string): string {
  switch (setting.mode) {
    case 'auto': return autoValue;
    case 'neutral': return '#121212';
    case 'custom': return setting.value || autoValue;
  }
}
