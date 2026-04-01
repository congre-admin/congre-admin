import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import PublicApp from './public/App';
import AdminApp from './admin/AdminApp';
import { AuthProvider } from './admin/core/context/AuthContext';
import { theme } from './core/theme/theme';
import { cacheService } from './cache/cacheService';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'congre_query_cache',
  maxAge: 1000 * 60 * 60 * 24,
});

cacheService.initialize().catch(console.error);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/admin/*" element={
              <AuthProvider>
                <AdminApp />
              </AuthProvider>
            } />
            <Route path="/*" element={<PublicApp />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </PersistQueryClientProvider>
  </React.StrictMode>
);
