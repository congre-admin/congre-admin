import { useState, useRef } from 'react';
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
  IconButton,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Badge,
  Menu,
  MenuItem,
  Popover
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  EventNote as EventNoteIcon,
  Campaign as CampaignIcon,
  Map as MapIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Menu as MenuIcon,
  Backup as BackupIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Home as HomeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useCongregacion } from '@/hooks/useCongregacion';
import ShareDialog from '../ShareDialog/ShareDialog';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

const menuItems = [
  { label: 'Dashboard', icon: DashboardIcon, path: '/admin' },
  { label: 'Personas', icon: PeopleIcon, path: '/admin/personas' },
  { label: 'Reuniones', icon: EventNoteIcon, path: '/admin/reuniones' },
  { label: 'Anuncios', icon: CampaignIcon, path: '/admin/anuncios' },
  { label: 'Predicación', icon: MapIcon, path: '/admin/predicacion' },
];

const settingsMenuItems = [
  { label: 'Respaldo', icon: BackupIcon, path: '/admin/backup' },
  { label: 'Modo Oscuro', icon: DarkModeIcon, action: 'toggleDarkMode' },
  { label: 'Compartir', icon: ShareIcon, action: 'share' },
];

const userMenuItems = [
  { label: 'Autenticación', icon: SecurityIcon, path: '/admin/settings/auth' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { data: congregacion } = useCongregacion();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState<null | HTMLElement>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoverAnchor, setHoverAnchor] = useState<null | HTMLElement>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationCount] = useState(3);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const congregationName = congregacion?.nombre || 'CongreAdmin';
  const currentWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;
  const adminSsId = localStorage.getItem('congre_admin_ss_id');
  const shareUrl = `${window.location.origin}/?ssid=${adminSsId || ''}`;

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = () => {
    setUserMenuAnchor(null);
    logout();
    navigate('/admin/login');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    setSettingsMenuAnchor(null);
  };

  const handleMouseEnter = (itemLabel: string, event: React.MouseEvent<HTMLElement>) => {
    if (collapsed && !isMobile) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredItem(itemLabel);
        setHoverAnchor(event.currentTarget);
      }, 300);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setTimeout(() => {
      setHoveredItem(null);
      setHoverAnchor(null);
    }, 200);
  };

  const desktopContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ 
        p: collapsed ? 1.5 : 3, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: collapsed ? 'center' : 'space-between'
      }}>
            {collapsed ? (
              <IconButton size="small" onClick={() => setCollapsed(false)}>
                <HomeIcon />
          </IconButton>
        ) : (
          <>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                {congregationName}
              </Typography>
              {congregacion?.numero && (
                <Typography variant="caption" color="text.secondary">
                  #{congregacion.numero}
                </Typography>
              )}
            </Box>
            <IconButton size="small" onClick={() => setCollapsed(true)}>
              <ChevronLeftIcon />
            </IconButton>
          </>
        )}
      </Box>
      <Divider />

      <List sx={{ flex: 1, px: collapsed ? 1 : 2, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem 
            key={item.path} 
            disablePadding 
            sx={{ mb: 0.5 }}
            onMouseEnter={(e) => handleMouseEnter(item.label, e)}
            onMouseLeave={handleMouseLeave}
          >
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                minHeight: 48,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1 : 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': { color: 'inherit' },
                  '&:hover': { bgcolor: 'primary.main' },
                },
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: collapsed ? 0 : 44, 
                justifyContent: 'center',
                color: location.pathname === item.path ? 'inherit' : 'text.primary'
              }}>
                <item.icon />
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.label} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Popover
        open={Boolean(hoveredItem && hoverAnchor)}
        anchorEl={hoverAnchor}
        onClose={() => setHoveredItem(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        sx={{ ml: 1 }}
      >
        <Typography variant="body2" sx={{ px: 2, py: 1, fontWeight: 500 }}>
          {hoveredItem}
        </Typography>
      </Popover>

      <Divider />

      <List sx={{ px: collapsed ? 1 : 2 }}>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => {}}
            sx={{ 
              borderRadius: 2,
              minHeight: 48,
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1 : 2,
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: collapsed ? 0 : 44, 
              justifyContent: 'center'
            }}>
              <Badge badgeContent={notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Notificaciones" />}
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            sx={{ 
              borderRadius: 2,
              minHeight: 48,
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1 : 2,
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: collapsed ? 0 : 44, 
              justifyContent: 'center'
            }}>
              <PersonIcon />
            </ListItemIcon>
            {!collapsed && <ListItemText primary={user?.username || 'Usuario'} />}
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}
            sx={{ 
              borderRadius: 2,
              minHeight: 48,
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1 : 2,
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: collapsed ? 0 : 44, 
              justifyContent: 'center'
            }}>
              <SettingsIcon />
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Configuración" />}
          </ListItemButton>
        </ListItem>
      </List>

      <Menu
        anchorEl={settingsMenuAnchor}
        open={Boolean(settingsMenuAnchor)}
        onClose={() => setSettingsMenuAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {settingsMenuItems.map((item) => (
          <MenuItem 
            key={item.label} 
            onClick={() => { 
              if (item.action === 'toggleDarkMode') {
                toggleDarkMode();
              } else if (item.action === 'share') {
                setSettingsMenuAnchor(null);
                setShareDialogOpen(true);
              } else {
                setSettingsMenuAnchor(null); 
                handleNavigation(item.path!);
              }
            }}
          >
            <ListItemIcon>
              {item.action === 'toggleDarkMode' 
                ? (darkMode ? <LightModeIcon /> : <DarkModeIcon />)
                : <item.icon fontSize="small" />
              }
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem disabled>
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={user?.username} />
        </MenuItem>
        {userMenuItems.map((item) => (
          <MenuItem key={item.path} onClick={() => { setUserMenuAnchor(null); handleNavigation(item.path); }}>
            <ListItemIcon><item.icon fontSize="small" /></ListItemIcon>
            <ListItemText primary={item.label} />
          </MenuItem>
        ))}
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Cerrar Sesión</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );

  if (isMobile) {
    return (
      <>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderBottom: 1,
            borderColor: 'divider',
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              {congregationName}
            </Typography>
            <IconButton color="inherit" onClick={() => setMobileOpen(true)}>
              <Badge badgeContent={notificationCount} color="error">
                <MenuIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          <List sx={{ flex: 1, px: 2, pt: 2 }}>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{ borderRadius: 2 }}
                >
                  <ListItemIcon sx={{ minWidth: 44 }}>
                    <item.icon />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider />

          <List sx={{ px: 2 }}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton sx={{ borderRadius: 2 }}>
                <ListItemIcon sx={{ minWidth: 44 }}>
                  <Badge badgeContent={notificationCount} color="error">
                    <NotificationsIcon />
                  </Badge>
                </ListItemIcon>
                <ListItemText primary="Notificaciones" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 44 }}>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary={user?.username || 'Usuario'} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 44 }}>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Configuración" />
              </ListItemButton>
            </ListItem>
          </List>

          <Menu
            anchorEl={settingsMenuAnchor}
            open={Boolean(settingsMenuAnchor)}
            onClose={() => setSettingsMenuAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {settingsMenuItems.map((item) => (
              <MenuItem 
                key={item.label} 
                onClick={() => { 
                  if (item.action === 'toggleDarkMode') {
                    toggleDarkMode();
                  } else if (item.action === 'share') {
                    setSettingsMenuAnchor(null);
                    setShareDialogOpen(true);
                  } else {
                    setSettingsMenuAnchor(null); 
                    handleNavigation(item.path!);
                  }
                }}
              >
                <ListItemIcon>
                  {item.action === 'toggleDarkMode' 
                    ? (darkMode ? <LightModeIcon /> : <DarkModeIcon />)
                    : <item.icon fontSize="small" />
                  }
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </MenuItem>
            ))}
          </Menu>

          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={() => setUserMenuAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary={user?.username} />
            </MenuItem>
            {userMenuItems.map((item) => (
              <MenuItem key={item.path} onClick={() => { setUserMenuAnchor(null); handleNavigation(item.path); }}>
                <ListItemIcon><item.icon fontSize="small" /></ListItemIcon>
                <ListItemText primary={item.label} />
              </MenuItem>
            ))}
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Cerrar Sesión</ListItemText>
            </MenuItem>
          </Menu>
        </Drawer>

        <Toolbar />
      </>
    );
  }

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: currentWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: currentWidth,
            boxSizing: 'border-box',
            borderRight: 1,
            borderColor: 'divider',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        {desktopContent}
      </Drawer>

      <ShareDialog 
        open={shareDialogOpen} 
        onClose={() => setShareDialogOpen(false)}
        shareUrl={shareUrl}
        title="Compartir Página Pública"
      />
    </>
  );
}
