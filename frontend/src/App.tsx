import { Routes, Route } from 'react-router-dom';
import { RequireAdmin } from './core/context/AuthContext';
import SetupWizard from './modules/setup/views/SetupWizard';
import Login from './modules/setup/views/Login';
import SetupPasskey from './modules/setup/views/SetupPasskey';
import SetupTOTP from './modules/setup/views/SetupTOTP';
import AdminShell from './core/shell/AdminShell';
import PublicShell from './core/shell/PublicShell';
import Dashboard from './modules/dashboard/views/Dashboard';
import AuthSettings from './modules/settings/views/AuthSettings';
import BackupExport from './modules/admin/views/BackupExport';

function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/setup" element={<SetupWizard />} />
      <Route path="/admin/setup-passkey" element={<SetupPasskey />} />
      <Route path="/admin/setup-totp" element={<SetupTOTP />} />
      
      <Route path="/admin" element={
        <RequireAdmin>
          <AdminShell />
        </RequireAdmin>
      }>
        <Route index element={<Dashboard />} />
        <Route path="config/auth" element={<AuthSettings />} />
        <Route path="config/backup" element={<BackupExport />} />
      </Route>
      
      <Route path="/" element={<PublicShell />}>
        <Route index element={<div>Dashboard Público - Coming Soon</div>} />
      </Route>
    </Routes>
  );
}

export default App;
