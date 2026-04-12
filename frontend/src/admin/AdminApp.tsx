import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { CssBaseline, Button } from '@mui/material';
import { useAuth } from './core/context/AuthContext';
import SetupWizard from './modules/setup/views/SetupWizard';
import Login from './modules/setup/views/Login';
import SetupTOTP from './modules/setup/views/SetupTOTP';
import SetupPasskey from './modules/setup/views/SetupPasskey';
import Shell from './core/shell/Shell';
import PublicSSIDModal from './core/components/PublicSSIDModal/PublicSSIDModal';

// Public plugin routes (no auth required)
const PublicHome = lazy(() => import('./modules/publico/views/PublicHome'));
const PublicReuniones = lazy(() => import('./modules/publico/views/PublicReuniones'));
const PublicAnuncios = lazy(() => import('./modules/publico/views/PublicAnuncios'));

// Admin views (lazy-loaded individually)
const Dashboard = lazy(() => import('./modules/dashboard/views/Dashboard'));
const BackupExport = lazy(() => import('./modules/admin/views/BackupExport'));
const AdminPlugins = lazy(() => import('./modules/admin/views/AdminPlugins'));
const AdminUsers = lazy(() => import('./modules/admin/views/AdminUsers'));
const AuthSettings = lazy(() => import('./modules/settings/views/AuthSettings'));
const CongregationSettings = lazy(() => import('./modules/settings/views/CongregationSettings'));

function LoadingFallback() {
  return (
    <div style={{ padding: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <span>Cargando...</span>
    </div>
  );
}

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

function AuthenticatedApp() {
  return (
    <Routes>
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
      
      <Route path="plugins" element={
        <ProtectedShell>
          <AdminPlugins />
        </ProtectedShell>
      } />
      
      <Route path="users" element={
        <ProtectedShell>
          <AdminUsers />
        </ProtectedShell>
      } />
      
      <Route path="settings/auth" element={
        <ProtectedShell>
          <AuthSettings />
        </ProtectedShell>
      } />
      
      <Route path="settings/congregation" element={
        <ProtectedShell>
          <CongregationSettings />
        </ProtectedShell>
      } />
      
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
}

const PUBLIC_SS_ID_KEY = 'congre_public_ss_id';

// Public routes - no auth required, wrapped in Shell
function PublicAppRoutes() {
  const navigate = useNavigate();
  const [showSSIDModal, setShowSSIDModal] = useState(false);
  const [ssidFromUrl, setSsidFromUrl] = useState<string | null>(null);

  // Check for SSID in URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSsId = params.get('ssid');
    if (urlSsId) {
      localStorage.setItem(PUBLIC_SS_ID_KEY, urlSsId);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      setSsidFromUrl(urlSsId);
    }
  }, []);

  // Check if SSID is configured
  useEffect(() => {
    const storedSsId = localStorage.getItem(PUBLIC_SS_ID_KEY);
    if (!storedSsId && !ssidFromUrl) {
      setShowSSIDModal(true);
    }
  }, [ssidFromUrl]);

  const handleSetupWizard = () => {
    setShowSSIDModal(false);
    navigate('/setup');
  };

  return (
    <>
      <Shell>
        <Routes>
          <Route path="/*" element={<PublicHome />} />
          <Route path="reuniones/*" element={<PublicReuniones />} />
          <Route path="anuncios/*" element={<PublicAnuncios />} />
        </Routes>
      </Shell>
      <PublicSSIDModal 
        open={showSSIDModal} 
        onClose={() => setShowSSIDModal(false)}
        onSetupWizard={handleSetupWizard}
      />
    </>
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
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="setup" element={<SetupWizard />} />
        <Route path="setup/*" element={<SetupWizard />} />
        
        <Route path="login" element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        } />
        
        <Route path="setup-totp" element={<SetupTOTP />} />
        
        <Route path="setup-passkey" element={<SetupPasskey />} />
        
        {/* Public routes - no auth, shared Shell */}
        <Route path="/*" element={<PublicAppRoutes />} />
        
        <Route path="*" element={<AuthenticatedApp />} />
      </Routes>
    </Suspense>
  );
}
