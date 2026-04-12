import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Business as BusinessIcon,
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  EventNote as EventNoteIcon,
  Campaign as CampaignIcon,
  Map as MapIcon,
  Settings as SettingsIcon,
  Backup as BackupIcon,
  Brightness4 as DarkModeIcon,
  Link as LinkIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext } from '@/core/context/ThemeContext';
import { getCachedSettings } from '@/utils/settingsCache';
import { useMenuConfig, type MenuItem as MenuItemType, type MenuSection, type MenuMode } from '@/admin/core/hooks/useMenuConfig';
import ShareDialog from '../ShareDialog/ShareDialog';

const DRAWER_WIDTH = 260;
const MINI_DRAWER_WIDTH = 72;
const PUBLIC_SS_ID_KEY = 'congre_public_ss_id';

// Icon resolver
const iconMap: Record<string, React.ComponentType<{ fontSize?: string }>> = {
  Home: HomeIcon,
  Dashboard: DashboardIcon,
  People: PeopleIcon,
  EventNote: EventNoteIcon,
  Campaign: CampaignIcon,
  Map: MapIcon,
  Settings: SettingsIcon,
  Business: BusinessIcon,
  Backup: BackupIcon,
  DarkMode: DarkModeIcon,
  Link: LinkIcon,
  Person: PersonIcon,
  Security: SecurityIcon,
  Logout: LogoutIcon,
  Notifications: NotificationsIcon,
};

function resolveMuiIcon(iconName: string) {
  return iconMap[iconName] || SettingsIcon;
}

function SidebarContent({ onNavigate, congregationName, congregationIcon: CongregationIcon, collapsed, mode }: { onNavigate: (path: string) => void; congregationName: string; congregationIcon: React.ComponentType<{ size?: number }>; collapsed: boolean; mode: MenuMode }) {
  const { topMenu, bottomSections } = useMenuConfig(mode);
  const location = useLocation();
  const theme = useTheme();

  const isActive = (path?: string) => location.pathname === path;
  const isParentActive = (section: MenuSection) => 
    section.path === location.pathname || 
    (section.children?.some(child => child.path === location.pathname) ?? false);

  const handleAction = (item: MenuItemType) => {
    if (item.action === 'toggleDarkMode') {
      onNavigate('toggleDarkMode');
    } else if (item.action === 'share') {
      onNavigate('share');
    } else if (item.action === 'logout') {
      onNavigate('logout');
    } else if (item.path) {
      onNavigate(item.path);
    }
  };

  const menuItemStyles = {
    root: {
      '& .pro-menu-item': {
        backgroundColor: 'transparent !important',
      },
      '& .pro-inner-item': {
        backgroundColor: 'transparent !important',
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.08) + ' !important',
        },
        '&.active, &.ps-menu-item-selected': {
          backgroundColor: alpha(theme.palette.primary.main, 0.15) + ' !important',
          color: theme.palette.primary.main + ' !important',
        },
      },
      '& .ps-menu-icon': {
        opacity: '1 !important',
        display: 'flex !important',
        visibility: 'visible !important',
      },
      '& .ps-menu-label': {
        opacity: '1 !important',
      },
      '& .ps-submenu-content': {
        backgroundColor: 'transparent !important',
        '& .pro-menu-item': {
          backgroundColor: 'transparent !important',
        },
        '& .pro-inner-item': {
          backgroundColor: 'transparent !important',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08) + ' !important',
          },
          '&.active, &.ps-menu-item-selected': {
            backgroundColor: alpha(theme.palette.primary.main, 0.15) + ' !important',
            color: theme.palette.primary.main + ' !important',
          },
        },
      },
    },
    button: {
      borderRadius: 0,
      backgroundColor: 'transparent !important',
      '&.active, &.ps-menu-item-selected': {
        backgroundColor: alpha(theme.palette.primary.main, 0.15) + ' !important',
        color: theme.palette.primary.main,
      },
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08) + ' !important',
      },
      '& .ps-menu-icon': {
        opacity: '1 !important',
        display: 'flex !important',
        visibility: 'visible !important',
      },
    },
    subMenuContent: {
      backgroundColor: 'transparent !important',
      '& .ps-menu-icon': {
        opacity: '1 !important',
        display: 'flex !important',
        visibility: 'visible !important',
      },
    },
    icon: {
      opacity: '1 !important',
      display: 'flex !important',
      visibility: 'visible !important',
    },
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header as MenuItem - matches other items exactly */}
      <Menu menuItemStyles={menuItemStyles}>
        <MenuItem 
          icon={<CongregationIcon size={20} />}
          style={{ fontWeight: 600, fontSize: '1.25em' }}
        >
          {congregationName}
        </MenuItem>
      </Menu>

      {/* Top Menu Items */}
      <Menu menuItemStyles={menuItemStyles}>
        {topMenu.map(item => {
          const IconComponent = resolveMuiIcon(item.icon);
          return (
            <MenuItem
              key={item.label}
              active={isActive(item.path)}
              onClick={() => item.path ? onNavigate(item.path) : item.action && handleAction(item)}
              icon={<IconComponent fontSize="small" sx={{ opacity: 1, display: 'flex', visibility: 'visible' }} />}
            >
              {item.label}
            </MenuItem>
          );
        })}
      </Menu>

      <Divider sx={{ mx: 1 }} />

      {/* Bottom sections */}
      <Menu menuItemStyles={menuItemStyles}>
        {bottomSections.map(section => {
          const IconComponent = resolveMuiIcon(section.icon);
          const isSectionActive = isParentActive(section);
          
          // If no children, render as direct MenuItem (opens on click)
          if (!section.children || section.children.length === 0) {
            return (
              <MenuItem
                key={section.id}
                active={isSectionActive}
                onClick={() => section.path ? onNavigate(section.path) : section.action && onNavigate(section.action)}
                icon={<IconComponent fontSize="small" />}
              >
                {section.label}
              </MenuItem>
            );
          }
          
          // Otherwise, render as SubMenu
          return (
            <SubMenu
              key={section.id}
              label={section.label}
              icon={<IconComponent fontSize="small" />}
              active={isSectionActive}
              defaultOpen={isSectionActive}
              style={{
                backgroundColor: isSectionActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
              }}
            >
              {section.children.map(child => {
                const ChildIcon = resolveMuiIcon(child.icon);
                // When collapsed, only highlight parent, not children
                const isChildActive = collapsed ? false : isActive(child.path);
                return (
                  <MenuItem
                    key={child.label}
                    active={isChildActive}
                    onClick={() => handleAction(child)}
                    icon={<ChildIcon fontSize="small" />}
                  >
                    {child.label}
                  </MenuItem>
                );
              })}
            </SubMenu>
          );
        })}
      </Menu>
    </Box>
  );
}

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAuthenticated } = useAuth();
  const { toggleDarkMode: toggleThemeMode } = useThemeContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Determine menu mode based on auth state (public menu for non-authenticated users)
  // This shows simplified menu: Inicio + module stubs → divider → Notificaciones → "Más"
  const mode: MenuMode = isAuthenticated ? 'admin' : 'public';

  // Get congregation name from appropriate config based on mode
  let congregationName = 'CongreAdmin';
  if (mode === 'public') {
    congregationName = localStorage.getItem('congre_public_nombre_mostrar') || 'CongreAdmin';
  } else {
    const cached = getCachedSettings();
    congregationName = cached?.data.nombre_mostrar || cached?.data.nombre_congregacion || 'CongreAdmin';
  }
  const publicSsId = localStorage.getItem(PUBLIC_SS_ID_KEY);
  const shareUrl = `${window.location.origin}/?ssid=${publicSsId || ''}`;

  // Get icon from appropriate config based on mode
  let iconPreviewUrl: string | null = null;
  try {
    let iconConfigStr: string | null = null;
    if (mode === 'public') {
      iconConfigStr = localStorage.getItem('congre_public_icon_config');
    } else {
      iconConfigStr = cached?.data.icon_config;
    }
    const iconConfig = iconConfigStr ? JSON.parse(iconConfigStr) : null;
    iconPreviewUrl = iconConfig?.sizes?.['32'] || iconConfig?.sizes?.['48'] || null;
  } catch { /* ignore */ }

  const handleNavigate = (pathOrAction: string) => {
    if (pathOrAction === 'toggleDarkMode') {
      toggleThemeMode();
    } else if (pathOrAction === 'share') {
      setShareDialogOpen(true);
    } else if (pathOrAction === 'logout') {
      logout();
      navigate('/admin/login');
    } else if (pathOrAction === 'admin') {
      navigate('/admin');
    } else if (pathOrAction.startsWith('/')) {
      navigate(pathOrAction);
      if (isMobile) setMobileOpen(false);
    }
  };

  const CongregationIcon = ({ size = 24 }: { size?: number }) => (
    iconPreviewUrl ? (
      <Box
        component="img"
        src={iconPreviewUrl}
        alt=""
        sx={{ width: size, height: size, borderRadius: 1, flexShrink: 0 }}
      />
    ) : (
      <BusinessIcon sx={{ flexShrink: 0, color: 'primary.main', fontSize: size }} />
    )
  );

  const sidebarContent = (
    <SidebarContent onNavigate={handleNavigate} congregationName={congregationName} congregationIcon={CongregationIcon} collapsed={collapsed} mode={mode} />
  );

  const glassSx = {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    backdropFilter: 'blur(12px)',
  };

  // Mobile
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
            <CongregationIcon size={24} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, ml: 1.5 }}>
              {congregationName}
            </Typography>
            <IconButton color="inherit" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Mobile sidebar - shows when open */}
        <Box
          sx={{
            position: 'fixed',
            left: 0,
            top: 0,
            height: '100vh',
            width: mobileOpen ? DRAWER_WIDTH : 0,
            zIndex: theme.zIndex.appBar - 1,
            overflow: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.easeInOut,
              duration: 200,
            }),
          }}
        >
          <Sidebar collapsed={false}>
            <Box
              sx={{
                height: '100vh',
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                backdropFilter: 'blur(12px)',
              }}
            >
              {sidebarContent}
            </Box>
          </Sidebar>
        </Box>

        {/* Mobile overlay - click to close */}
        {mobileOpen && (
          <Box
            onClick={() => setMobileOpen(false)}
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: theme.zIndex.appBar - 2,
            }}
          />
        )}

        <Box sx={{ minHeight: 56 }} />
      </>
    );
  }

  // Desktop: single sidebar with hover expand
  return (
    <>
      <Box
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        sx={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          width: collapsed ? MINI_DRAWER_WIDTH : DRAWER_WIDTH,
          zIndex: theme.zIndex.appBar + 1,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.easeInOut,
            duration: 200,
          }),
        }}
      >
        <Sidebar collapsed={collapsed}>
          <Box
            sx={{
              height: '100vh',
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              backdropFilter: 'blur(12px)',
              borderRight: `1px solid ${theme.palette.divider}`,
              overflow: 'hidden',
            }}
          >
            {sidebarContent}
          </Box>
        </Sidebar>
      </Box>

      {/* Spacer - always collapsed width */}
      <Box sx={{ width: MINI_DRAWER_WIDTH, flexShrink: 0 }} />

      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        shareUrl={shareUrl}
        title="Compartir Página Pública"
      />
    </>
  );
}
