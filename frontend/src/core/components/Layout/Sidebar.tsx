import { useState, useEffect } from 'react';
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
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
  AdminPanelSettings as AdminIcon,
  Backup as BackupIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 240;

const ADMIN_SS_ID_KEY = 'congre_admin_ss_id';

function useCongregacionName() {
  const [nombre, setNombre] = useState('CongreAdmin');
  
  useEffect(() => {
    const ssId = localStorage.getItem(ADMIN_SS_ID_KEY);
    if (!ssId) return;
    
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${ssId}/gviz/tq?tqx=out:json&sheet=Configuracion`;
    fetch(gvizUrl)
      .then(res => res.text())
      .then(text => {
        const match = text.match(/(\{.*\})/);
        if (match) {
          const data = JSON.parse(match[1]);
          const rows = data.table?.rows || [];
          for (const row of rows) {
            const clave = row.c?.[0]?.v;
            const valor = row.c?.[1]?.v;
            if (clave === 'nombre_mostrar' || clave === 'nombre_congregacion') {
              setNombre(valor || 'CongreAdmin');
              break;
            }
          }
        }
      })
      .catch(() => {});
  }, []);
  
  return nombre;
}

const menuItems = [
  { label: 'Dashboard', icon: DashboardIcon, path: '/' },
  { label: 'Personas', icon: PeopleIcon, path: '/personas' },
  { label: 'Reuniones', icon: EventNoteIcon, path: '/reuniones' },
  { label: 'Anuncios', icon: CampaignIcon, path: '/anuncios' },
  { label: 'Predicación', icon: MapIcon, path: '/predicacion' },
];

export default function Sidebar({ isAdmin }: { isAdmin?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const congregationName = useCongregacionName();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" noWrap>
          {congregationName}
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
          <ListItemButton onClick={() => navigate('/backup')} sx={{ borderRadius: 1 }}>
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