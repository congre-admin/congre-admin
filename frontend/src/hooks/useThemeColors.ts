import { useEffect } from 'react';

const DEFAULT_PRIMARY = '#1976d2';
const DEFAULT_SECONDARY = '#dc004e';

export function useThemeColors(primaryColor?: string, secondaryColor?: string) {
  useEffect(() => {
    const root = document.documentElement;
    
    if (primaryColor) {
      root.style.setProperty('--theme-primary', primaryColor);
    } else {
      root.style.setProperty('--theme-primary', DEFAULT_PRIMARY);
    }
    
    if (secondaryColor) {
      root.style.setProperty('--theme-secondary', secondaryColor);
    } else {
      root.style.setProperty('--theme-secondary', DEFAULT_SECONDARY);
    }
  }, [primaryColor, secondaryColor]);
}