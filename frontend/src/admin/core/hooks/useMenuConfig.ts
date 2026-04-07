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

// Static placeholder menu config
// Later replaced by loading from Registro_Plugins + module manifests
const STATIC_TOP_MENU: MenuItem[] = [
  { label: 'Dashboard', icon: 'Dashboard', path: '/admin' },
  { label: 'Personas', icon: 'People', path: '/admin/personas' },
  { label: 'Reuniones', icon: 'EventNote', path: '/admin/reuniones' },
  { label: 'Anuncios', icon: 'Campaign', path: '/admin/anuncios' },
  { label: 'Predicación', icon: 'Map', path: '/admin/predicacion' },
];

const STATIC_BOTTOM_SECTIONS: MenuSection[] = [
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: 'Settings',
    children: [
      { label: 'Sitio', icon: 'Business', path: '/admin/settings/congregation' },
      { label: 'Respaldo', icon: 'Backup', path: '/admin/backup' },
      { label: 'Modo Oscuro', icon: 'DarkMode', action: 'toggleDarkMode' },
      { label: 'Compartir', icon: 'Share', action: 'share' },
    ],
  },
  {
    id: 'usuario',
    label: 'Usuario',
    icon: 'Person',
    children: [
      { label: 'Autenticación', icon: 'Security', path: '/admin/settings/auth' },
      { label: 'Cerrar Sesión', icon: 'Logout', action: 'logout' },
    ],
  },
];

/**
 * Hook that returns the menu configuration.
 * Currently returns static data — will later fetch from Registro_Plugins
 * and merge with each module's manifest navigation definitions.
 */
export function useMenuConfig(): { topMenu: MenuItem[]; bottomSections: MenuSection[] } {
  return useMemo(() => ({
    topMenu: STATIC_TOP_MENU,
    bottomSections: STATIC_BOTTOM_SECTIONS,
  }), []);
}
