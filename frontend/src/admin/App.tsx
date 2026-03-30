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

export default function App() {
  return (
    <Routes>
      <Route path="/admin/setup" element={<SetupWizard />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/setup-totp" element={<SetupTOTP />} />
      <Route path="/admin/setup-passkey" element={<SetupPasskey />} />
      
      <Route element={
        <ProtectedRoute>
          <Shell />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="backup" element={<BackupExport />} />
        <Route path="settings/auth" element={<AuthSettings />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
