import { useMemo } from 'react';
import type { Navigation } from '@toolpad/core/AppProvider';
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
  Notifications as NotificationsIcon,
  Extension as ExtensionIcon,
  Group as GroupIcon,
} from '@mui/icons-material';

export type MenuMode = 'public' | 'admin';

const PUBLIC_NAVIGATION: Navigation = [
  { segment: '', title: 'Inicio', icon: <HomeIcon /> },
  { segment: 'reuniones', title: 'Reuniones', icon: <EventNoteIcon /> },
  { segment: 'anuncios', title: 'Anuncios', icon: <CampaignIcon /> },
];

const ADMIN_NAVIGATION: Navigation = [
  { segment: 'admin', title: 'Tablero', icon: <DashboardIcon /> },
  { segment: 'admin/personas', title: 'Personas', icon: <PeopleIcon /> },
  { segment: 'admin/reuniones', title: 'Reuniones', icon: <EventNoteIcon /> },
  { segment: 'admin/anuncios', title: 'Anuncios', icon: <CampaignIcon /> },
  { segment: 'admin/predicacion', title: 'Predicación', icon: <MapIcon /> },
  { kind: 'divider' },
  {
    segment: 'admin/settings',
    title: 'Configuración',
    icon: <SettingsIcon />,
    children: [
      { segment: 'plugins', title: 'Módulos', icon: <ExtensionIcon /> },
      { segment: 'users', title: 'Usuarios', icon: <GroupIcon /> },
      { segment: 'congregation', title: 'Congregación', icon: <BusinessIcon /> },
      { segment: 'backup', title: 'Respaldo', icon: <BackupIcon /> },
    ],
  },
];

export function useMenuConfig(mode: MenuMode = 'admin'): Navigation {
  return useMemo(() => {
    return mode === 'public' ? PUBLIC_NAVIGATION : ADMIN_NAVIGATION;
  }, [mode]);
}
