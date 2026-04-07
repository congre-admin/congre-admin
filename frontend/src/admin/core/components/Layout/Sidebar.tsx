import { useState, useEffect, useRef } from 'react';
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
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  ChevronLeft as ChevronLeftIcon,
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext } from '@/core/context/ThemeContext';
import { getCachedSettings } from '@/utils/settingsCache';
import { useMenuConfig, resolveIcon, type MenuItem, type MenuSection } from '@/admin/core/hooks/useMenuConfig';
import ShareDialog from '../ShareDialog/ShareDialog';

const DRAWER_WIDTH = 260;
const MINI_DRAWER_WIDTH = 60;
const COLLAPSE_DELAY = 200;
const ICON_COL_WIDTH = 40;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleDarkMode: toggleThemeMode } = useThemeContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { topMenu, bottomSections } = useMenuConfig();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cached = getCachedSettings();
  const congregationName = cached?.data.nombre_mostrar || cached?.data.nombre_congregacion || 'CongreAdmin';
  const adminSsId = localStorage.getItem('congre_admin_ss_id');
  const shareUrl = `${window.location.origin}/?ssid=${adminSsId || ''}`;

  let iconPreviewUrl: string | null = null;
  try {
    const iconConfig = cached?.data.icon_config ? JSON.parse(cached.data.icon_config) : null;
    iconPreviewUrl = iconConfig?.sizes?.['32'] || iconConfig?.sizes?.['48'] || null;
  } catch { /* ignore */ }

  const isExpanded = hoverExpanded;

  const handleDrawerEnter = () => {
    if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
    setHoverExpanded(true);
  };

  const handleDrawerLeave = () => {
    collapseTimeoutRef.current = setTimeout(() => {
      setHoverExpanded(false);
      setExpandedSection(null);
    }, COLLAPSE_DELAY);
  };

  useEffect(() => {
    const currentSection = bottomSections.find((section: MenuSection) =>
      section.children.some((child: MenuItem) => child.path === location.pathname)
    );
    if (currentSection && isExpanded) {
      setExpandedSection(currentSection.id);
    }
  }, [location.pathname, isExpanded, bottomSections]);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleChildAction = (child: MenuItem) => {
    if (child.action === 'toggleDarkMode') {
      toggleThemeMode();
    } else if (child.action === 'share') {
      setShareDialogOpen(true);
    } else if (child.action === 'logout') {
      logout();
      navigate('/admin/login');
    } else if (child.path) {
      handleNavigation(child.path);
    }
  };

  const glassSx = {
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    bgcolor: alpha(theme.palette.primary.main, 0.08),
  };

  const CongregationIcon = ({ size = 24, borderRadius = 1 }: { size?: number; borderRadius?: number }) => (
    iconPreviewUrl ? (
      <Box
        component="img"
        src={iconPreviewUrl}
        alt=""
        sx={{ width: size, height: size, borderRadius, flexShrink: 0 }}
      />
    ) : (
      <BusinessIcon sx={{ flexShrink: 0, color: 'primary.main', fontSize: size }} />
    )
  );

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{
        px: 0,
        display: 'flex',
        alignItems: 'center',
        minHeight: 56,
      }}>
        <Box sx={{ width: isExpanded ? ICON_COL_WIDTH : '100%', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <CongregationIcon size={24} borderRadius={1} />
        </Box>
        {isExpanded && (
          <>
            <Typography variant="h6" noWrap sx={{ fontWeight: 600, flex: 1, px: 1.5 }}>
              {congregationName}
            </Typography>
            <IconButton size="small" onClick={() => setHoverExpanded(false)} sx={{ mr: 1.5 }}>
              <ChevronLeftIcon />
            </IconButton>
          </>
        )}
      </Box>
      <Divider />

      {/* Top Menu Items */}
      <List sx={{ px: 0, py: 1 }}>
        {topMenu.map(item => {
          const IconComponent = resolveIcon(item.icon);
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path!)}
                sx={{
                  borderRadius: 2,
                  minHeight: 48,
                  px: isExpanded ? 1.5 : 0,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': { color: 'inherit' },
                    '&:hover': { bgcolor: 'primary.main' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: isExpanded ? ICON_COL_WIDTH : 'unset', width: isExpanded ? ICON_COL_WIDTH : '100%', justifyContent: 'center' }}>
                  <IconComponent />
                </ListItemIcon>
                {isExpanded && <ListItemText primary={item.label} sx={{ pr: 1.5 }} />}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Spacer */}
      <Box sx={{ flex: 1 }} />

      {/* Bottom: Notifications, Configuración, Usuario */}
      <Divider />
      <List sx={{ px: 0, py: 0.5 }}>
        {/* Notifications */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            sx={{
              borderRadius: 2,
              minHeight: 48,
              px: isExpanded ? 1.5 : 0,
            }}
          >
            <ListItemIcon sx={{ minWidth: isExpanded ? ICON_COL_WIDTH : 'unset', width: isExpanded ? ICON_COL_WIDTH : '100%', justifyContent: 'center' }}>
              <Badge badgeContent={0} color="error">
                <NotificationsIcon />
              </Badge>
            </ListItemIcon>
            {isExpanded && <ListItemText primary="Notificaciones" sx={{ pr: 1.5 }} />}
          </ListItemButton>
        </ListItem>

        {/* Configuración & Usuario accordions */}
        {bottomSections.map(section => {
          const IconComponent = resolveIcon(section.icon);
          return (
            <Accordion
              key={section.id}
              expanded={isExpanded && expandedSection === section.id}
              onChange={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              disableGutters
              sx={{
                boxShadow: 'none',
                '&:before': { display: 'none' },
                bgcolor: 'transparent',
                mb: 0.5,
              }}
            >
              <AccordionSummary
                expandIcon={isExpanded ? <ExpandMoreIcon /> : null}
                sx={{ px: isExpanded ? 1.5 : 0, minHeight: 48, '& .MuiAccordionSummary-content': { my: 0 } }}
              >
                <ListItemIcon sx={{ minWidth: isExpanded ? ICON_COL_WIDTH : 'unset', width: isExpanded ? ICON_COL_WIDTH : '100%', justifyContent: 'center' }}>
                  <IconComponent />
                </ListItemIcon>
                {isExpanded && (
                  <ListItemText primary={section.label} primaryTypographyProps={{ fontWeight: 500 }} sx={{ pr: 1.5 }} />
                )}
              </AccordionSummary>
              {isExpanded && (
                <AccordionDetails sx={{ py: 0, px: 0 }}>
                  {section.children.map(child => {
                    const ChildIcon = resolveIcon(child.icon);
                    return (
                      <ListItemButton
                        key={child.label}
                        selected={location.pathname === child.path}
                        onClick={() => handleChildAction(child)}
                        sx={{
                          borderRadius: 1.5,
                          minHeight: 40,
                          px: 0,
                          mb: 0.25,
                          '&.Mui-selected': {
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            '& .MuiListItemIcon-root': { color: 'inherit' },
                            '&:hover': { bgcolor: 'primary.main' },
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: ICON_COL_WIDTH, width: '100%', justifyContent: 'center' }}>
                          <ChildIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={child.label}
                          primaryTypographyProps={{ fontSize: '0.875rem' }}
                          sx={{ pr: 1.5 }}
                        />
                      </ListItemButton>
                    );
                  })}
                </AccordionDetails>
              )}
            </Accordion>
          );
        })}
      </List>
    </Box>
  );

  // Mobile: AppBar + temporary drawer
  if (isMobile) {
    return (
      <>
        <Box
          component="nav"
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            ...glassSx,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', px: 2, minHeight: 56 }}>
            <CongregationIcon size={24} borderRadius={1} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, ml: 1.5 }}>
              {congregationName}
            </Typography>
            <IconButton color="inherit" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          </Box>
        </Box>

        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: Math.min(300, window.innerWidth),
              boxSizing: 'border-box',
              ...glassSx,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        <Box sx={{ minHeight: 56 }} />
      </>
    );
  }

  // Desktop: persistent overlay drawer with hover expand
  return (
    <>
      <Box
        onMouseEnter={handleDrawerEnter}
        onMouseLeave={handleDrawerLeave}
        sx={{
          width: MINI_DRAWER_WIDTH,
          flexShrink: 0,
          position: 'relative',
          zIndex: theme.zIndex.appBar + 1,
        }}
      >
        <Drawer
          variant="persistent"
          open={true}
          sx={{
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: isExpanded ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
              boxSizing: 'border-box',
              height: '100vh',
              position: 'absolute',
              left: 0,
              borderRight: isExpanded ? 1 : 0,
              borderColor: 'divider',
              boxShadow: isExpanded ? '4px 0 24px rgba(0,0,0,0.12)' : 'none',
              ...glassSx,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: 300,
              }),
              overflowX: 'hidden',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        shareUrl={shareUrl}
        title="Compartir Página Pública"
      />
    </>
  );
}
