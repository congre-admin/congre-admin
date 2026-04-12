// @ts-expect-error - suppress React Router v6 deprecation warnings in dev
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import AdminApp from './admin/AdminApp';
import { AuthProvider } from './admin/core/context/AuthContext';
import { ThemeContextProvider, useThemeContext } from './core/context/ThemeContext';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
});

persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: 1000 * 60 * 30,
});

function AppShell() {
  const { theme, isLoading } = useThemeContext();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Setup routes - no auth */}
          <Route path="/setup" element={<AdminApp />} />
          <Route path="/setup/*" element={<AdminApp />} />
          <Route path="/setup-totp" element={<AdminApp />} />
          <Route path="/setup-passkey" element={<AdminApp />} />
          
          {/* Public routes - no auth required */}
          <Route path="/*" element={<AdminApp />} />
          
          {/* Admin routes - auth required */}
          <Route path="/admin/*" element={
            <AuthProvider>
              <AdminApp />
            </AuthProvider>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <AppShell />
      </ThemeContextProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
