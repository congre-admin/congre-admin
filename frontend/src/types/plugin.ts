/**
 * Plugin Manifest Schema
 * 
 * Each plugin module should export a manifest defining its metadata,
 * authentication requirements, and routing configuration.
 */

export interface PluginManifest {
  /** Unique plugin identifier */
  id: string;
  
  /** Human-readable plugin name */
  name: string;
  
  /** Plugin version */
  version?: string;
  
  /** Authentication requirement for this plugin */
  auth: 'required' | 'none';
  
  /** Include this plugin in public (unauthenticated) navigation */
  public?: boolean;
  
  /** Routes provided by this plugin */
  routes: PluginRoute[];
  
  /** Menu configuration */
  menu?: PluginMenuConfig;
  
  /** Paths that should be publicly accessible (without login) */
  publicPaths?: string[];
}

export interface PluginRoute {
  /** Route path (e.g., '/admin/personas' or '/reuniones') */
  path: string;
  
  /** React.lazy() import of the component */
  component: () => Promise<{ default: React.ComponentType<any> }>;
  
  /** Whether this route requires authentication */
  auth?: 'required' | 'none';
}

export interface PluginMenuConfig {
  /** Position in menu: 'top' or section id from bottom sections */
  position: string | 'top';
  
  /** Menu item label */
  label: string;
  
  /** Icon name from ICON_REGISTRY */
  icon: string;
  
  /** Optional: submenu children */
  children?: PluginMenuItem[];
}

export interface PluginMenuItem {
  label: string;
  icon: string;
  path: string;
}
