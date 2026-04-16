/**
 * Configuration cache for CongreAdmin
 * 
 * Stores config as individual localStorage keys:
 * - Logged users: congre_core_<key>
 * - Public: congre_public_<key>
 * 
 * On logout, config is replaced with public sheet values.
 */

const CORE_PREFIX = 'congre_core_';
const PUBLIC_PREFIX = 'congre_public_';
const CONFIG_SS_KEY = 'congre_config_ss_id';

/**
 * Set a config value for the current session type
 */
export function setConfig(key: string, value: string, isPublic = false): void {
  const prefix = isPublic ? PUBLIC_PREFIX : CORE_PREFIX;
  localStorage.setItem(`${prefix}${key}`, value);
}

/**
 * Get a config value - checks core first, then public as fallback
 */
export function getConfig(key: string): string | null {
  const coreValue = localStorage.getItem(`${CORE_PREFIX}${key}`);
  if (coreValue !== null) return coreValue;
  return localStorage.getItem(`${PUBLIC_PREFIX}${key}`);
}

/**
 * Set multiple config values at once
 */
export function setConfigs(entries: Record<string, string>, isPublic = false): void {
  const prefix = isPublic ? PUBLIC_PREFIX : CORE_PREFIX;
  Object.entries(entries).forEach(([key, value]) => {
    localStorage.setItem(`${prefix}${key}`, value);
  });
}

/**
 * Get all config keys for current session (core or public)
 */
export function getAllConfigKeys(isPublic: boolean): string[] {
  const prefix = isPublic ? PUBLIC_PREFIX : CORE_PREFIX;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      keys.push(key.slice(prefix.length));
    }
  }
  return keys;
}

/**
 * Get all config entries as Record
 */
export function getAllConfigs(isPublic: boolean): Record<string, string> {
  const prefix = isPublic ? PUBLIC_PREFIX : CORE_PREFIX;
  const configs: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      const configKey = key.slice(prefix.length);
      configs[configKey] = localStorage.getItem(key) || '';
    }
  }
  return configs;
}

/**
 * Clear core config (called on logout, then replaced with public)
 */
export function clearCoreConfig(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CORE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Clear public config
 */
export function clearPublicConfig(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PUBLIC_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Check if config exists for a given key (core or public)
 */
export function hasConfig(key: string): boolean {
  return getConfig(key) !== null;
}

/**
 * Store which spreadsheet ID was used to load current config
 */
export function setConfigSsId(ssId: string, isPublic: boolean): void {
  const prefix = isPublic ? 'public' : 'core';
  localStorage.setItem(`${CONFIG_SS_KEY}_${prefix}`, ssId);
}

/**
 * Get the spreadsheet ID used to load current config
 */
export function getConfigSsId(isPublic: boolean): string | null {
  const prefix = isPublic ? 'public' : 'core';
  return localStorage.getItem(`${CONFIG_SS_KEY}_${prefix}`);
}

// Legacy compatibility
export function getCachedSettings(): { fetchedAt: string; data: Record<string, string> } | null {
  const coreConfigs = getAllConfigs(false);
  if (Object.keys(coreConfigs).length === 0) {
    const publicConfigs = getAllConfigs(true);
    if (Object.keys(publicConfigs).length === 0) return null;
    return {
      fetchedAt: new Date().toISOString(),
      data: publicConfigs,
    };
  }
  return {
    fetchedAt: new Date().toISOString(),
    data: coreConfigs,
  };
}

export function setCachedSettings(data: Record<string, string>): void {
  setConfigs(data, false);
  localStorage.setItem('congre_settings_fetched_at', Date.now().toString());
}

export function clearCachedSettings(): void {
  clearCoreConfig();
}

const SETTINGS_FETCHED_AT_KEY = 'congre_settings_fetched_at';
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export function isSettingsStale(): boolean {
  const fetchedAt = localStorage.getItem(SETTINGS_FETCHED_AT_KEY);
  if (!fetchedAt) return true;
  
  const timestamp = parseInt(fetchedAt, 10);
  if (isNaN(timestamp)) return true;
  
  return Date.now() - timestamp > STALE_THRESHOLD_MS;
}

export function setSettingsFetchedAt(): void {
  localStorage.setItem(SETTINGS_FETCHED_AT_KEY, Date.now().toString());
}
