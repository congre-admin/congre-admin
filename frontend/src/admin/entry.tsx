import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './core/theme/theme';
import { AuthProvider } from './core/context/AuthContext';
import SetupWizard from './modules/setup/views/SetupWizard';
import Login from './modules/setup/views/Login';
import SetupTOTP from './modules/setup/views/SetupTOTP';
import Shell from './core/shell/Shell';
import Dashboard from './modules/dashboard/views/Dashboard';
import BackupExport from './modules/admin/views/BackupExport';
import '../index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Cargando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
}

function AdminApp() {
  return (
    <Routes>
      <Route path="/admin/setup" element={<SetupWizard />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/setup-totp" element={<SetupTOTP />} />
      
      <Route element={
        <ProtectedRoute>
          <Shell />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="backup" element={<BackupExport />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <AdminApp />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
