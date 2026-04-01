import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Alert,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Badge,
  Menu,
  MenuItem,
  Popover
} from '@mui/material';
import {
  Home as HomeIcon,
  AdminPanelSettings as AdminIcon,
  Event as EventIcon,
  Campaign as CampaignIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import ShareDialog from '@/admin/core/components/ShareDialog/ShareDialog';

const PUBLIC_SS_ID_KEY = 'congre_public_ss_id';
const ADMIN_SS_ID_KEY = 'congre_admin_ss_id';
const ADMIN_API_URL_KEY = 'congre_admin_api_url';
const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

const publicMenuItems = [
  { label: 'Inicio', icon: HomeIcon, path: '/' },
  { label: 'Reuniones', icon: EventIcon, path: '/reuniones' },
  { label: 'Anuncios', icon: CampaignIcon, path: '/anuncios' },
];

const settingsMenuItems = [
  { label: 'Modo Oscuro', icon: DarkModeIcon, action: 'toggleDarkMode' },
  { label: 'Instalar', icon: SettingsIcon, action: 'install' },
  { label: 'Compartir', icon: ShareIcon, action: 'share' },
];

const userMenuItems = [
  { label: 'Acceso Admin', icon: AdminIcon, action: 'admin' },
  { label: 'Instalar', icon: SettingsIcon, action: 'install' },
];

const mobileBottomItems = [
  { label: 'Notificaciones', icon: NotificationsIcon, badge: true },
  { label: 'Configuración', icon: SettingsIcon, path: '/admin/settings' },
];

export default function PublicApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [ssIdInput, setSsIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [congregacion, setCongregacion] = useState<{ nombre?: string; numero?: string } | null>(null);
  const [publicData, setPublicData] = useState<any[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState<null | HTMLElement>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoverAnchor, setHoverAnchor] = useState<null | HTMLElement>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationCount] = useState(0);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const congregationName = congregacion?.nombre || 'CongreAdmin';
  const currentWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;
  const publicShareUrl = `${window.location.origin}${window.location.pathname}?ssid=${localStorage.getItem(PUBLIC_SS_ID_KEY) || ''}`;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ssidParam = urlParams.get('ssid');
    if (ssidParam) {
      localStorage.setItem(PUBLIC_SS_ID_KEY, ssidParam);
      loadPublicData(ssidParam);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const storedSsId = localStorage.getItem(PUBLIC_SS_ID_KEY);
    if (storedSsId) {
      loadPublicData(storedSsId);
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get('ssid')) {
        setShowSetupDialog(true);
      }
    }
  }, []);

  const loadPublicData = async (ssId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      try {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${ssId}/gviz/tq?tqx=out:json&sheet=Configuracion`;
        const configResponse = await fetch(gvizUrl);
        const configText = await configResponse.text();
        const configMatch = configText.match(/(\{.*\})/);
        
        if (configMatch) {
          const configData = JSON.parse(configMatch[1]);
          const rows = configData.table?.rows || [];
          
          for (const row of rows) {
            const values = row.c?.map((c: any) => c?.v).filter(Boolean) || [];
            if (values[0] === 'linked_admin_ss') {
              const linkedData = JSON.parse(values[1]);
              if (linkedData.ssId && linkedData.gasUrl) {
                localStorage.setItem(ADMIN_SS_ID_KEY, linkedData.ssId);
                localStorage.setItem(ADMIN_API_URL_KEY, linkedData.gasUrl);
              }
              break;
            }
          }
        }
      } catch (configErr) {
        console.warn('Could not resolve linked Admin SSID:', configErr);
      }
      
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${ssId}/gviz/tq?tqx=out:json&sheet=Publico`;
      const response = await fetch(gvizUrl);
      const text = await response.text();
      
      const jsonMatch = text.match(/(\{.*\})/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1]);
        if (data.table) {
          setPublicData(data.table.rows || []);
        }
      }
      
      setCongregacion({ nombre: 'Congregación' });
    } catch (err) {
      setError('Error al cargar datos públicos. Verifique el ID de la hoja de cálculo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSsId = () => {
    if (!ssIdInput.trim()) {
      setError('Ingrese un ID de hoja de cálculo');
      return;
    }
    localStorage.setItem(PUBLIC_SS_ID_KEY, ssIdInput.trim());
    setShowSetupDialog(false);
    loadPublicData(ssIdInput.trim());
  };

  const handleAccessAdmin = () => {
    window.location.href = '/admin';
  };

  const handleInstall = () => {
    window.location.href = '/admin/setup';
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleSettingsAction = (action: string) => {
    setSettingsMenuAnchor(null);
    if (action === 'toggleDarkMode') {
      toggleDarkMode();
    } else if (action === 'install') {
      handleInstall();
    } else if (action === 'share') {
      setShareDialogOpen(true);
    }
  };

  const handleUserAction = (action: string) => {
    setUserMenuAnchor(null);
    if (action === 'admin') {
      handleAccessAdmin();
    } else if (action === 'install') {
      handleInstall();
    }
  };

  const handleMouseEnter = (itemLabel: string, event: React.MouseEvent<HTMLElement>) => {
    if (collapsed && !isMobile) {
      setTimeout(() => {
        setHoveredItem(itemLabel);
        setHoverAnchor(event.currentTarget);
      }, 300);
    }
  };

  const handleMouseLeave = () => {
    setTimeout(() => {
      setHoveredItem(null);
      setHoverAnchor(null);
    }, 200);
  };

  if (isMobile) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
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
            },
          }}
        >
          <List sx={{ flex: 1, px: 2, pt: 2 }}>
            {publicMenuItems.map((item) => (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
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
                <ListItemText primary="Visitante" />
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
                onClick={() => handleSettingsAction(item.action!)}
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
            {userMenuItems.map((item) => (
              <MenuItem 
                key={item.label} 
                onClick={() => handleUserAction(item.action!)}
              >
                <ListItemIcon><item.icon fontSize="small" /></ListItemIcon>
                <ListItemText primary={item.label} />
              </MenuItem>
            ))}
          </Menu>
        </Drawer>

        <Toolbar />

        <Container maxWidth="md" sx={{ py: 3 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <>
              <Typography variant="h4" gutterBottom>
                Bienvenidos
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Información pública de la congregación
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <EventIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">Reuniones</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Horarios de reuniones de la congregación
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CampaignIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">Anuncios</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Anuncios y actualizaciones recientes
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </Container>

        <Dialog open={showSetupDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Configurar Acceso Público</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Ingrese el ID de la hoja de cálculo pública de su congregación.
            </Typography>
            <TextField
              fullWidth
              label="ID de Hoja de Cálculo"
              placeholder="1abc123..."
              value={ssIdInput}
              onChange={(e) => setSsIdInput(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Alert severity="info" sx={{ mb: 2 }}>
              El ID se encuentra en la URL de su hoja de cálculo:
              docs.google.com/spreadsheets/d/<b>ID_AQUI</b>/edit
            </Alert>
            <Button fullWidth variant="contained" onClick={handleSaveSsId}>
              Guardar y Cargar
            </Button>
          </DialogContent>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
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
            {publicMenuItems.map((item) => (
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
                {!collapsed && <ListItemText primary="Visitante" />}
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
                onClick={() => handleSettingsAction(item.action!)}
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
            {userMenuItems.map((item) => (
              <MenuItem 
                key={item.label} 
                onClick={() => handleUserAction(item.action!)}
              >
                <ListItemIcon><item.icon fontSize="small" /></ListItemIcon>
                <ListItemText primary={item.label} />
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flex: 1, p: 3, overflow: 'auto', minHeight: '100vh' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <>
            <Typography variant="h4" gutterBottom>
              Bienvenidos
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Información pública de la congregación
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <EventIcon sx={{ mr: 1 }} />
                      <Typography variant="h6">Reuniones</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Horarios de reuniones de la congregación
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CampaignIcon sx={{ mr: 1 }} />
                      <Typography variant="h6">Anuncios</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Anuncios y actualizaciones recientes
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>

      <Dialog open={showSetupDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Configurar Acceso Público</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ingrese el ID de la hoja de cálculo pública de su congregación.
          </Typography>
          <TextField
            fullWidth
            label="ID de Hoja de Cálculo"
            placeholder="1abc123..."
            value={ssIdInput}
            onChange={(e) => setSsIdInput(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Alert severity="info" sx={{ mb: 2 }}>
            El ID se encuentra en la URL de su hoja de cálculo:
            docs.google.com/spreadsheets/d/<b>ID_AQUI</b>/edit
          </Alert>
          <Button fullWidth variant="contained" onClick={handleSaveSsId}>
            Guardar y Cargar
          </Button>
        </DialogContent>
      </Dialog>

      <ShareDialog 
        open={shareDialogOpen} 
        onClose={() => setShareDialogOpen(false)}
        shareUrl={publicShareUrl}
        title="Compartir Página Pública"
      />
    </Box>
  );
}
