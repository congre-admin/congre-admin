const SETTINGS_KEY = 'congre_settings';
const STALE_THRESHOLD = 15 * 60 * 1000; // 15 minutes

export interface CachedSettings {
  fetchedAt: string;
  data: Record<string, string>;
}

export function getCachedSettings(): CachedSettings | null {
  try {
    const cached = localStorage.getItem(SETTINGS_KEY);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

export function setCachedSettings(data: Record<string, string>): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    fetchedAt: new Date().toISOString(),
    data,
  }));
}

export function isSettingsStale(): boolean {
  const cached = getCachedSettings();
  if (!cached) return true;
  return Date.now() - new Date(cached.fetchedAt).getTime() > STALE_THRESHOLD;
}

export function clearCachedSettings(): void {
  localStorage.removeItem(SETTINGS_KEY);
}
