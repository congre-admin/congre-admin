import type { PluginManifest } from '@/types/plugin';

const manifest: PluginManifest = {
  id: 'publico',
  name: 'Página Pública',
  version: '1.0.0',
  auth: 'none', // No login required
  public: true, // Include in public navigation
  routes: [
    {
      path: '/',
      component: () => import('./views/PublicHome'),
    },
    {
      path: '/reuniones',
      component: () => import('./views/PublicReuniones'),
    },
    {
      path: '/anuncios',
      component: () => import('./views/PublicAnuncios'),
    },
  ],
  menu: {
    position: 'top',
    label: 'Inicio',
    icon: 'Home',
  },
};

export default manifest;
