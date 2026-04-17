const CFG_KEY = 'ca.cfg';
const SYS_KEY = 'ca.sys';
const SESSION_KEY = 'ca.session';
const ADMIN_KEYS_KEY = 'ca.admin_keys';

const LEGACY_PREFIXES = ['congre_core_', 'congre_public_', 'congre_admin_'];

export function initSettingsStore(): void {
  if (!localStorage.getItem(SYS_KEY)) {
    localStorage.setItem(SYS_KEY, JSON.stringify({}));
  }

  if (!localStorage.getItem(CFG_KEY)) {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && LEGACY_PREFIXES.some(prefix => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

function getJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSys(key: string): string | null {
  const sys = getJson<Record<string, string>>(SYS_KEY, {});
  return sys[key] ?? null;
}

export function setSys(key: string, value: string): void {
  const sys = getJson<Record<string, string>>(SYS_KEY, {});
  sys[key] = value;
  setJson(SYS_KEY, sys);
}

export function setSysMany(entries: Record<string, string>): void {
  const sys = getJson<Record<string, string>>(SYS_KEY, {});
  Object.assign(sys, entries);
  setJson(SYS_KEY, sys);
}

export function getConfig(key: string): string | null {
  const cfg = getJson<Record<string, string>>(CFG_KEY, {});
  return cfg[key] ?? null;
}

export function setConfig(key: string, value: string): void {
  const cfg = getJson<Record<string, string>>(CFG_KEY, {});
  cfg[key] = value;
  setJson(CFG_KEY, cfg);
}

export function getAllConfigs(): Record<string, string> {
  return getJson<Record<string, string>>(CFG_KEY, {});
}

export interface ConfigRow {
  clave: string;
  valor: any;
  is_public?: boolean | string;
}

function isPublicValue(val: boolean | string | undefined): boolean {
  if (val === undefined || val === null) return true;
  if (typeof val === 'boolean') return val;
  const lower = String(val).toLowerCase().trim();
  if (lower === 'false' || lower === 'no' || lower === '0') return false;
  return true;
}

export function setConfigs(rows: ConfigRow[]): void {
  const cfg: Record<string, string> = {};
  const adminKeys: string[] = [];

  for (const row of rows) {
    const value = typeof row.valor === 'object' ? JSON.stringify(row.valor) : String(row.valor ?? '');
    cfg[row.clave] = value;

    if (!isPublicValue(row.is_public)) {
      adminKeys.push(row.clave);
    }
  }

  const existingCfg = getJson<Record<string, string>>(CFG_KEY, {});
  const mergedCfg = { ...existingCfg, ...cfg };
  setJson(CFG_KEY, mergedCfg);

  if (adminKeys.length > 0) {
    const existingAdminKeys = getJson<string[]>(ADMIN_KEYS_KEY, []);
    const allAdminKeys = [...new Set([...existingAdminKeys, ...adminKeys])];
    setJson(ADMIN_KEYS_KEY, allAdminKeys);
  } else {
    localStorage.removeItem(ADMIN_KEYS_KEY);
  }
}

export function getSession(): { sessionToken: string; userData: any } | null {
  return getJson<{ sessionToken: string; userData: any } | null>(SESSION_KEY, null);
}

export function setSession(token: string, user: any): void {
  setJson(SESSION_KEY, { sessionToken: token, userData: user });
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getAdminKeys(): string[] {
  return getJson<string[]>(ADMIN_KEYS_KEY, []);
}

export function clearAdminConfigs(): void {
  const adminKeys = getAdminKeys();
  const cfg = getJson<Record<string, string>>(CFG_KEY, {});

  for (const key of adminKeys) {
    delete cfg[key];
  }

  setJson(CFG_KEY, cfg);
  localStorage.removeItem(ADMIN_KEYS_KEY);
  clearSession();
}

export function hasConfig(key: string): boolean {
  return getConfig(key) !== null;
}