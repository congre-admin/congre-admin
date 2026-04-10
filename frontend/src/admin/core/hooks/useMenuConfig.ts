import { useMemo } from 'react';
import {
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  EventNote as EventNoteIcon,
  Campaign as CampaignIcon,
  Map as MapIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Backup as BackupIcon,
  Brightness4 as DarkModeIcon,
  Share as ShareIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Logout as LogoutIcon,
  Folder as FolderIcon,
  Notifications as NotificationsIcon,
  Extension as ExtensionIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';

// Icon registry — exported for module manifests to reference
export const ICON_REGISTRY: Record<string, SvgIconComponent> = {
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
  Folder: FolderIcon,
  Notifications: NotificationsIcon,
  Extension: ExtensionIcon,
  Group: GroupIcon,
};

/**
 * Resolves an icon name string to its MUI icon component.
 * Falls back to FolderIcon if not found.
 */
export function resolveIcon(iconName: string): SvgIconComponent {
  return ICON_REGISTRY[iconName] || FolderIcon;
}

export interface MenuItem {
  label: string;
  icon: string;
  path?: string;
  action?: 'toggleDarkMode' | 'share' | 'logout';
}

export interface MenuSection {
  id: string;
  label: string;
  icon: string;
  children: MenuItem[];
}

export type MenuMode = 'public' | 'admin';

// Public menu - no auth required
const PUBLIC_TOP_MENU: MenuItem[] = [
  { label: 'Inicio', icon: 'Home', path: '/' },
  { label: 'Reuniones', icon: 'EventNote', path: '/reuniones' },
  { label: 'Anuncios', icon: 'Campaign', path: '/anuncios' },
  { label: 'Modo oscuro', icon: 'DarkMode', action: 'toggleDarkMode' },
  { label: 'Compartir', icon: 'Share', action: 'share' },
];

const PUBLIC_BOTTOM_SECTIONS: MenuSection[] = [
  {
    id: 'usuario',
    label: 'Usuario',
    icon: 'Person',
    children: [
      { label: 'Ingresar', icon: 'Security', action: 'admin' },
    ],
  },
];

// Admin menu - auth required
const ADMIN_TOP_MENU: MenuItem[] = [
  { label: 'Tablero', icon: 'Dashboard', path: '/admin' },
  { label: 'Personas', icon: 'People', path: '/admin/personas' },
  { label: 'Reuniones', icon: 'EventNote', path: '/admin/reuniones' },
  { label: 'Anuncios', icon: 'Campaign', path: '/admin/anuncios' },
  { label: 'Predicación', icon: 'Map', path: '/admin/predicacion' },
];

const ADMIN_BOTTOM_SECTIONS: MenuSection[] = [
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: 'Settings',
    children: [
      { label: 'Módulos', icon: 'Extension', path: '/admin/plugins' },
      { label: 'Usuarios', icon: 'Group', path: '/admin/users' },
      { label: 'Congregación', icon: 'Business', path: '/admin/settings/congregation' },
      { label: 'Respaldo', icon: 'Backup', path: '/admin/backup' },
      { label: 'Modo oscuro', icon: 'DarkMode', action: 'toggleDarkMode' },
      { label: 'Compartir', icon: 'Share', action: 'share' },
    ],
  },
  {
    id: 'usuario',
    label: 'Usuario',
    icon: 'Person',
    children: [
      { label: 'Autenticación', icon: 'Security', path: '/admin/settings/auth' },
      { label: 'Cerrar sesión', icon: 'Logout', action: 'logout' },
    ],
  },
];

/**
 * Hook that returns the menu configuration based on mode.
 * Currently returns static data — will later fetch from Registro_Plugins
 * and merge with each module's manifest navigation definitions.
 */
export function useMenuConfig(mode: MenuMode = 'admin'): { topMenu: MenuItem[]; bottomSections: MenuSection[] } {
  return useMemo(() => {
    if (mode === 'public') {
      return {
        topMenu: PUBLIC_TOP_MENU,
        bottomSections: PUBLIC_BOTTOM_SECTIONS,
      };
    }
    return {
      topMenu: ADMIN_TOP_MENU,
      bottomSections: ADMIN_BOTTOM_SECTIONS,
    };
  }, [mode]);
}
