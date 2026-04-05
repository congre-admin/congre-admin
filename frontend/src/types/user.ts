import type { Permiso } from './data';

export type ModulePermission = Permiso | Record<string, Permiso>;

export interface Perfil {
  id: string;
  nombre: string;
  permisos: Permisos;
  descripcion?: string;
  _v: number;
  _ts: string;
  _deleted?: boolean;
}

export interface Permisos {
  [modulo: string]: ModulePermission;
}
