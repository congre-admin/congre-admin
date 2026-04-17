import { lazy, Suspense, useState, useEffect, useMemo, Fragment } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Stack, Tooltip, Badge, Divider } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import LogoutIcon from '@mui/icons-material/Logout';
import SecurityIcon from '@mui/icons-material/Security';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DarkModeIcon from '@mui/icons-material/Brightness4';
import LightModeIcon from '@mui/icons-material/Brightness7';

import { useAuth } from '../core/context/AuthContext';
import { useThemeContext } from '../core/context/ThemeContext';
import { useMenuConfig } from './core/hooks/useMenuConfig';
import { getSys, setSys, getConfig } from '../utils/settingsCache';

import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';

import ShareDialog from './core/components/ShareDialog/ShareDialog';

// components
import SetupWizard from './modules/setup/views/SetupWizard';
import Login from './modules/setup/views/Login';
import SetupTOTP from './modules/setup/views/SetupTOTP';
import SetupPasskey from './modules/setup/views/SetupPasskey';
import PublicSSIDModal from './core/components/PublicSSIDModal/PublicSSIDModal';

// lazy loaded
const PublicHome = lazy(() => import('./modules/publico/views/PublicHome'));
const PublicReuniones = lazy(() => import('./modules/publico/views/PublicReuniones'));
const PublicAnuncios = lazy(() => import('./modules/publico/views/PublicAnuncios'));

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

function CustomToolbarActions() {
  const { isAuthenticated, logout } = useAuth();
  const { mode, toggleDarkMode } = useThemeContext();
  const navigate = useNavigate();
  
  const [shareOpen, setShareOpen] = useState(false);
  const publicSsId = getSys('public_ss_id') || getConfig('ss_publico');
  const shareUrl = `${window.location.origin}/?ssid=${publicSsId || ''}`;
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotifOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };
  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const stubNotifications = [
    { id: 1, text: "Nueva reunión programada para el viernes", isRead: false },
    { id: 2, text: "Actualización de módulos completada", isRead: true },
    { id: 3, text: "Bienvenido al nuevo sistema", isRead: true },
  ];
  const unreadCount = stubNotifications.filter((n) => !n.isRead).length;

  return (
    <Stack direction="row" gap={1} alignItems="center">
      <Tooltip title="Notificaciones">
        <IconButton color="inherit" onClick={handleNotifOpen}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
        <Menu
          anchorEl={notifAnchorEl}
          open={Boolean(notifAnchorEl)}
          onClose={handleNotifClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ style: { maxWidth: 300, minWidth: 250 } }}
        >
          <MenuItem disabled>
            <ListItemText primary="Notificaciones" primaryTypographyProps={{ fontWeight: 'bold', color: 'text.primary' }} />
          </MenuItem>
          <Divider />
          {stubNotifications.map((notif) => (
            <MenuItem key={notif.id} onClick={handleNotifClose} sx={{ py: 1.5, whiteSpace: 'normal' }}>
              <ListItemText 
                 primary={notif.text} 
                 primaryTypographyProps={{ variant: 'body2', fontWeight: notif.isRead ? 'normal' : 'bold' }} 
              />
            </MenuItem>
          ))}
          <Divider />
          <MenuItem onClick={() => { handleNotifClose(); navigate('/notificaciones'); }}>
            <ListItemText primary="Ver todas" primaryTypographyProps={{ color: 'primary', align: 'center', variant: 'body2' }} />
          </MenuItem>
        </Menu>
      
      <Tooltip title="Cambiar tema">
        <IconButton color="inherit" onClick={toggleDarkMode}>
          {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Compartir">
        <IconButton color="inherit" onClick={() => setShareOpen(true)}>
          <LinkIcon />
        </IconButton>
      </Tooltip>
      
      {isAuthenticated ? (
        <Fragment>
          <Tooltip title="Usuario">
            <IconButton color="inherit" onClick={handleMenuOpen}>
              <PersonIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => { handleMenuClose(); navigate('/admin/settings/auth'); }}>
              <ListItemIcon><SecurityIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Autenticación</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); logout(); }}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Cerrar sesión</ListItemText>
            </MenuItem>
          </Menu>
        </Fragment>
      ) : (
        <Tooltip title="Iniciar sesión">
          <IconButton color="inherit" onClick={() => navigate('/admin/login')}>
            <LoginIcon />
          </IconButton>
        </Tooltip>
      )}

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} shareUrl={shareUrl} title="Compartir Página Pública" />
    </Stack>
  );
}

function ToolpadShellWrapper() {
  return (
    <DashboardLayout slots={{ toolbarActions: CustomToolbarActions }}>
      <Outlet />
    </DashboardLayout>
  );
}

function AuthenticatedRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />; 

  return (
    <Routes>
      <Route path="" element={<Dashboard />} />
      <Route path="settings/plugins" element={<AdminPlugins />} />
      <Route path="settings/users" element={<AdminUsers />} />
      <Route path="settings/congregation" element={<CongregationSettings />} />
      <Route path="settings/backup" element={<BackupExport />} />
      <Route path="settings/auth" element={<AuthSettings />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
}

function PublicAppRoutes() {
  const navigate = useNavigate();
  const [showSSIDModal, setShowSSIDModal] = useState(false);
  const [ssidFromUrl, setSsidFromUrl] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSsId = params.get('ssid');
    if (urlSsId) {
      setSys('public_ss_id', urlSsId);
      window.history.replaceState({}, '', window.location.pathname);
      setSsidFromUrl(urlSsId);
    }
  }, []);

  useEffect(() => {
    const storedSsId = getSys('public_ss_id');
    if (!storedSsId && !ssidFromUrl) {
      setShowSSIDModal(true);
    }
  }, [ssidFromUrl]);

  return (
    <Fragment>
      <Routes>
        <Route path="/*" element={<PublicHome />} />
        <Route path="reuniones/*" element={<PublicReuniones />} />
        <Route path="anuncios/*" element={<PublicAnuncios />} />
      </Routes>
      <PublicSSIDModal 
        open={showSSIDModal} 
        onClose={() => setShowSSIDModal(false)}
        onSetupWizard={() => { setShowSSIDModal(false); navigate('/admin/setup'); }}
      />
    </Fragment>
  );
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingFallback />;
  if (isAuthenticated) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

export default function AdminApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { theme } = useThemeContext();
  
  const navigationConfig = useMenuConfig(isAuthenticated ? 'admin' : 'public');
  
  const router = useMemo(() => ({
    pathname: location.pathname,
    searchParams: new URLSearchParams(location.search),
    navigate: (path: string | URL) => {
      navigate(String(path));
    },
  }), [location, navigate]);

  const congregationName = getConfig('nombre_mostrar') || getConfig('nombre_congregacion') || 'CongreAdmin';
  
  const iconConfigStr = getConfig('icon_config');
  let logoUrl = '';
  try {
    const iconConfig = iconConfigStr ? JSON.parse(iconConfigStr) : null;
    logoUrl = iconConfig?.sizes?.['32'] || iconConfig?.sizes?.['48'] || '';
  } catch { /* ignore */ }
  
  const FaviconSync = () => {
    useEffect(() => {
      const updateFavicon = () => {
        try {
          const iconConfigStr = getConfig('icon_config');
          if (!iconConfigStr) return;
          const iconConfig = JSON.parse(iconConfigStr);
          const sizes = iconConfig?.sizes || {};
          
          const ico = sizes['ico'];
          const p32 = sizes['32'];
          const p192 = sizes['192'];

          if (ico) {
            let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
            if (!link) {
              link = document.createElement('link');
              link.rel = 'shortcut icon';
              document.head.appendChild(link);
            }
            link.href = ico;
          }

          if (p192) {
            let apple = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
            if (!apple) {
              apple = document.createElement('link');
              apple.rel = 'apple-touch-icon';
              document.head.appendChild(apple);
            }
            apple.href = p192;
          }
        } catch { /* ignore */ }
      };

      updateFavicon();
      // Listen for cache updates (from CongregationSettings)
      window.addEventListener('storage', updateFavicon);
      return () => window.removeEventListener('storage', updateFavicon);
    }, []);

    return null;
  };

  return (
    <AppProvider
      theme={theme}
      navigation={navigationConfig}
      router={router}
      branding={{
        title: congregationName,
        logo: logoUrl ? <img src={logoUrl} alt="Logo" /> : undefined
      }}
    >
      <FaviconSync />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/admin/setup/*" element={<SetupWizard />} />
          <Route path="/admin/setup" element={<SetupWizard />} />
          <Route path="/admin/setup-totp" element={<SetupTOTP />} />
          <Route path="/admin/setup-passkey" element={<SetupPasskey />} />
          
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/admin/login" element={<AuthRoute><Login /></AuthRoute>} />
          
          <Route element={<ToolpadShellWrapper />}>
             <Route path="/admin/*" element={<AuthenticatedRoutes />} />
             <Route path="/*" element={<PublicAppRoutes />} />
          </Route>
        </Routes>
      </Suspense>
    </AppProvider>
  );
}
