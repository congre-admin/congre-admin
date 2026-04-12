import type { Permiso } from './data';

export type ModulePermission = Permiso | Record<string, Permiso>;

export interface Perfil {
  id: string;
  nombre: string;
  permisos: Permisos;
  descripcion?: string;
  _v?: number;
  _ts?: string;
  _deleted?: boolean;
}

export interface Permisos {
  [modulo: string]: ModulePermission;
}

// Admin user type for user management UI
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  perfilIds: string[];
  perfiles: Array<{ id: string; nombre: string }>;
  active: boolean;
  created_at: string;
  last_login: string | null;
  failed_attempts: number;
  has_password: boolean;
  has_totp: boolean;
  has_passkeys: boolean;
}

// Granular permission per action
export interface GranularPermission {
  read?: boolean;
  write?: boolean;
  delete?: boolean;
  export?: boolean;
}

export interface ModulePermissions {
  [module: string]: GranularPermission;
}
