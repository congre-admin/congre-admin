import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  EventNote as EventNoteIcon,
  Campaign as CampaignIcon,
  Map as MapIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
  Backup as BackupIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 240;

const menuItems = [
  { label: 'Dashboard', icon: DashboardIcon, path: '/admin' },
  { label: 'Personas', icon: PeopleIcon, path: '/admin/personas' },
  { label: 'Reuniones', icon: EventNoteIcon, path: '/admin/reuniones' },
  { label: 'Anuncios', icon: CampaignIcon, path: '/admin/anuncios' },
  { label: 'Predicación', icon: MapIcon, path: '/admin/predicacion' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" noWrap>
          Congre-Admin
        </Typography>
        {isMobile && (
          <ChevronLeftIcon onClick={() => setMobileOpen(false)} sx={{ cursor: 'pointer' }} />
        )}
      </Box>
      
      <Divider />
      
      <List sx={{ flex: 1, px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.main',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <item.icon />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />
      
      <List sx={{ px: 1 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('settings/auth')} sx={{ borderRadius: 1 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SecurityIcon />
            </ListItemIcon>
            <ListItemText primary="Autenticación" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('backup')} sx={{ borderRadius: 1 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <BackupIcon />
            </ListItemIcon>
            <ListItemText primary="Respaldo" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Cerrar Sesión" />
          </ListItemButton>
        </ListItem>
      </List>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          {user?.username || 'Usuario'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile && (
        <MenuIcon
          onClick={() => setMobileOpen(true)}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1200,
            cursor: 'pointer',
            bgcolor: 'background.paper',
            p: 0.5,
            borderRadius: 1
          }}
        />
      )}
      
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}