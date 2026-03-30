import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './core/context/AuthContext';
import SetupWizard from './modules/setup/views/SetupWizard';
import Login from './modules/setup/views/Login';
import SetupTOTP from './modules/setup/views/SetupTOTP';
import SetupPasskey from './modules/setup/views/SetupPasskey';
import Shell from './core/shell/Shell';
import Dashboard from './modules/dashboard/views/Dashboard';
import BackupExport from './modules/admin/views/BackupExport';
import AuthSettings from './modules/settings/views/AuthSettings';

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div style={{ padding: 20 }}>Cargando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Login />;
  }
  
  return (
    <Shell>
      {children}
    </Shell>
  );
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div style={{ padding: 20 }}>Cargando...</div>;
  }
  
  if (isAuthenticated) {
    return <Navigate to="" replace />;
  }
  
  return <>{children}</>;
}

export default function AdminApp() {
  return (
    <Routes>
      <Route path="setup" element={<SetupWizard />} />
      
      <Route path="login" element={
        <AuthRoute>
          <Login />
        </AuthRoute>
      } />
      
      <Route path="setup-totp" element={<SetupTOTP />} />
      
      <Route path="setup-passkey" element={<SetupPasskey />} />
      
      <Route path="" element={
        <ProtectedShell>
          <Dashboard />
        </ProtectedShell>
      } />
      
      <Route path="backup" element={
        <ProtectedShell>
          <BackupExport />
        </ProtectedShell>
      } />
      
      <Route path="settings/auth" element={
        <ProtectedShell>
          <AuthSettings />
        </ProtectedShell>
      } />
      
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
}
