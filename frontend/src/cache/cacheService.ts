import { get, set, del } from 'idb-keyval';
import type { Perfil } from '../types';

const CACHE_KEYS = {
  MODULES: 'congre_cache_modules',
  CONFIG: 'congre_cache_config',
  USER_PERFIL: 'congre_cache_user_perfil',
  USER_PERMISOS: 'congre_cache_user_permisos',
  PUBLIC_SS: 'congre_cache_public_ss',
} as const;

const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheData {
  modules: Record<string, string>;
  config: Record<string, string>;
  userPerfil: Perfil | null;
  userPermisos: Record<string, string>;
  publicSsId: string | null;
}

type MemoryCache = Partial<CacheData>;

class CacheService {
  private memory: MemoryCache = {};
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [modules, config, userPerfil, userPermisos, publicSsId] = await Promise.all([
        get<CacheEntry<Record<string, string>>>(CACHE_KEYS.MODULES),
        get<CacheEntry<Record<string, string>>>(CACHE_KEYS.CONFIG),
        get<CacheEntry<Perfil | null>>(CACHE_KEYS.USER_PERFIL),
        get<CacheEntry<Record<string, string>>>(CACHE_KEYS.USER_PERMISOS),
        get<CacheEntry<string | null>>(CACHE_KEYS.PUBLIC_SS),
      ]);

      if (modules && !this.isExpired(modules.timestamp)) {
        this.memory.modules = modules.data;
      }
      if (config && !this.isExpired(config.timestamp)) {
        this.memory.config = config.data;
      }
      if (userPerfil && !this.isExpired(userPerfil.timestamp)) {
        this.memory.userPerfil = userPerfil.data;
      }
      if (userPermisos && !this.isExpired(userPermisos.timestamp)) {
        this.memory.userPermisos = userPermisos.data;
      }
      if (publicSsId && !this.isExpired(publicSsId.timestamp)) {
        this.memory.publicSsId = publicSsId.data;
      }

      this.initialized = true;
    } catch (error) {
      console.error('CacheService: Failed to initialize', error);
      this.initialized = true;
    }
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > CACHE_EXPIRY_MS;
  }

  private async setWithExpiry<T>(key: string, data: T): Promise<void> {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    await set(key, entry);
  }

  getModuleSsId(moduleName: string): string | undefined {
    return this.memory.modules?.[moduleName];
  }

  setModuleSsId(moduleName: string, ssId: string): void {
    this.memory.modules = { ...this.memory.modules, [moduleName]: ssId };
    this.setWithExpiry(CACHE_KEYS.MODULES, this.memory.modules);
  }

  getAllModules(): Record<string, string> | undefined {
    return this.memory.modules;
  }

  setAllModules(modules: Record<string, string>): void {
    this.memory.modules = modules;
    this.setWithExpiry(CACHE_KEYS.MODULES, modules);
  }

  getConfigValue(key: string): string | undefined {
    return this.memory.config?.[key];
  }

  setConfigValue(key: string, value: string): void {
    this.memory.config = { ...this.memory.config, [key]: value };
    this.setWithExpiry(CACHE_KEYS.CONFIG, this.memory.config);
  }

  setAllConfig(config: Record<string, string>): void {
    this.memory.config = config;
    this.setWithExpiry(CACHE_KEYS.CONFIG, config);
  }

  getUserPerfil(): Perfil | null | undefined {
    return this.memory.userPerfil;
  }

  setUserPerfil(perfil: Perfil): void {
    this.memory.userPerfil = perfil;
    this.setWithExpiry(CACHE_KEYS.USER_PERFIL, perfil);
  }

  getUserPermisos(): Record<string, string> | undefined {
    return this.memory.userPermisos;
  }

  setUserPermisos(permisos: Record<string, string>): void {
    this.memory.userPermisos = permisos;
    this.setWithExpiry(CACHE_KEYS.USER_PERMISOS, permisos);
  }

  getPublicSsId(): string | null | undefined {
    return this.memory.publicSsId;
  }

  setPublicSsId(ssId: string): void {
    this.memory.publicSsId = ssId;
    this.setWithExpiry(CACHE_KEYS.PUBLIC_SS, ssId);
  }

  async refreshOnLogin(
    modules: Record<string, string>,
    config: Record<string, string>,
    perfil: Perfil,
    publicSsId: string
  ): Promise<void> {
    this.memory.modules = modules;
    this.memory.config = config;
    this.memory.userPerfil = perfil;
    this.memory.userPermisos = perfil.permisos;
    this.memory.publicSsId = publicSsId;

    await Promise.all([
      this.setWithExpiry(CACHE_KEYS.MODULES, modules),
      this.setWithExpiry(CACHE_KEYS.CONFIG, config),
      this.setWithExpiry(CACHE_KEYS.USER_PERFIL, perfil),
      this.setWithExpiry(CACHE_KEYS.USER_PERMISOS, perfil.permisos),
      this.setWithExpiry(CACHE_KEYS.PUBLIC_SS, publicSsId),
    ]);
  }

  async clearAll(): Promise<void> {
    this.memory = {};
    await Promise.all([
      del(CACHE_KEYS.MODULES),
      del(CACHE_KEYS.CONFIG),
      del(CACHE_KEYS.USER_PERFIL),
      del(CACHE_KEYS.USER_PERMISOS),
      del(CACHE_KEYS.PUBLIC_SS),
    ]);
  }
}

export const cacheService = new CacheService();
