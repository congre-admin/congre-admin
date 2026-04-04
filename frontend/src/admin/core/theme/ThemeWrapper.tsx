import { ThemeProvider } from '@mui/material';
import { ReactNode, useState, useEffect } from 'react';
import { getDynamicTheme } from './theme';
import { useCongregacion } from '@/hooks/useCongregacion';

interface ThemeWrapperProps {
  children: ReactNode;
}

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { data: congregacion, isLoading } = useCongregacion();
  const [theme, setTheme] = useState(() => getDynamicTheme('light'));
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const primary = congregacion?.temaColor;
    const secondary = congregacion?.temaColorSecundario;
    setTheme(getDynamicTheme(darkMode ? 'dark' : 'light', primary, secondary));
  }, [congregacion?.temaColor, congregacion?.temaColorSecundario, darkMode]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setDarkMode(isDark);
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
}