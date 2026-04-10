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
  Share as ShareIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext } from '@/core/context/ThemeContext';
import { getCachedSettings } from '@/utils/settingsCache';
import { useMenuConfig, type MenuItem as MenuItemType, type MenuSection } from '@/admin/core/hooks/useMenuConfig';
import ShareDialog from '../ShareDialog/ShareDialog';

const DRAWER_WIDTH = 260;
const MINI_DRAWER_WIDTH = 72;

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
  Share: ShareIcon,
  Person: PersonIcon,
  Security: SecurityIcon,
  Logout: LogoutIcon,
  Notifications: NotificationsIcon,
};

function resolveMuiIcon(iconName: string) {
  return iconMap[iconName] || SettingsIcon;
}

function SidebarContent({ onNavigate, congregationName, congregationIcon: CongregationIcon, collapsed }: { onNavigate: (path: string) => void; congregationName: string; congregationIcon: React.ComponentType<{ size?: number }>; collapsed: boolean }) {
  const { topMenu, bottomSections } = useMenuConfig();
  const location = useLocation();
  const theme = useTheme();

  const isActive = (path?: string) => location.pathname === path;
  const isParentActive = (section: MenuSection) => 
    section.children.some(child => child.path === location.pathname);

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
    },
    subMenuContent: {
      backgroundColor: 'transparent !important',
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
              onClick={() => item.path && onNavigate(item.path)}
              icon={<IconComponent fontSize="small" />}
            >
              {item.label}
            </MenuItem>
          );
        })}
      </Menu>

      <Divider sx={{ mx: 1 }} />

      {/* Notifications */}
      <Menu menuItemStyles={menuItemStyles}>
        <MenuItem icon={<NotificationsIcon fontSize="small" />}>
          Notificaciones
        </MenuItem>
      </Menu>

      {/* Bottom sections */}
      <Divider sx={{ mx: 1 }} />
      <Menu menuItemStyles={menuItemStyles}>
        {bottomSections.map(section => {
          const IconComponent = resolveMuiIcon(section.icon);
          const isSectionActive = isParentActive(section);
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
  const { logout } = useAuth();
  const { toggleDarkMode: toggleThemeMode } = useThemeContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const cached = getCachedSettings();
  const congregationName = cached?.data.nombre_mostrar || cached?.data.nombre_congregacion || 'CongreAdmin';
  const adminSsId = localStorage.getItem('congre_admin_ss_id');
  const shareUrl = `${window.location.origin}/?ssid=${adminSsId || ''}`;

  let iconPreviewUrl: string | null = null;
  try {
    const iconConfig = cached?.data.icon_config ? JSON.parse(cached.data.icon_config) : null;
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
    <SidebarContent onNavigate={handleNavigate} congregationName={congregationName} congregationIcon={CongregationIcon} collapsed={collapsed} />
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
