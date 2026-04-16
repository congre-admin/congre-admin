import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { cacheService } from '../cache/cacheService';
import { dataService } from '../services/dataService';
import { QUERY_OPTIONS } from './queryConfig';
import { getConfig, setConfigs, setSettingsFetchedAt } from '../utils/settingsCache';

const QUERY_KEYS = {
  session: ['session'] as const,
  authMethods: ['authMethods'] as const,
  sheet: (sheet: string, ssId: string) => ['sheet', sheet, ssId] as const,
  coreData: (ssId: string) => ['core-data', ssId] as const,
};

export function useSession() {
  return useQuery({
    queryKey: QUERY_KEYS.session,
    queryFn: async () => {
      return authService.validateSession();
    },
    ...QUERY_OPTIONS,
    enabled: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return authService.logout();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useRefreshSession() {
  return useMutation({
    mutationFn: async () => {
      return authService.refreshSession();
    },
  });
}

export function useAuthMethods() {
  return useQuery({
    queryKey: QUERY_KEYS.authMethods,
    queryFn: async () => {
      return authService.getAuthMethods();
    },
    ...QUERY_OPTIONS,
    refetchOnMount: true,
  });
}

/**
 * Generic hook for fetching sheet data.
 * Uses TanStack Query cache with 5min stale time.
 * Automatically deduplicates concurrent requests via DataService.
 */
export function useSheetData<T = any>(sheet: string, ssId: string, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.sheet(sheet, ssId),
    queryFn: () => dataService.getData<T>(sheet, ssId),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook for fetching sheet data with JSONata filtering, mapping, and sorting.
 * The filter/map/sort expressions are included in the query key for proper caching.
 */
export function useFilteredData<T = any>(
  sheet: string,
  ssId: string,
  options: {
    filter?: string;
    map?: string;
    sort?: string;
    limit?: number;
    offset?: number;
    sanitize?: boolean;
  } = {},
  queryOptions = {}
) {
  return useQuery({
    queryKey: ['sheet', sheet, ssId, options.filter, options.map, options.sort, options.limit, options.offset],
    queryFn: () => dataService.getData<T>(sheet, ssId, options),
    staleTime: 5 * 60 * 1000,
    ...queryOptions,
  });
}

/**
 * Batch hook that fetches core tables in a single HTTP call.
 * Returns { perfiles, config, plugins } from one batchExecute.
 */
export function useCoreData(ssId: string, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.coreData(ssId),
    queryFn: async () => {
      const result = await dataService.batchExecute([
        { op: 'read' as const, sheet: 'Perfiles' },
        { op: 'read' as const, sheet: 'Configuracion' },
        { op: 'read' as const, sheet: 'Registro_Plugins' },
      ], { mode: 'continue' });

      return {
        perfiles: result.results?.[0]?.data || [],
        config: result.results?.[1]?.data || [],
        plugins: result.results?.[2]?.data || [],
      };
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Mutation for saving data with optimistic updates and cache invalidation.
 */
export function useSaveData(sheet: string, ssId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => dataService.saveData(sheet, ssId, data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.sheet(sheet, ssId) });
      const previous = queryClient.getQueryData(QUERY_KEYS.sheet(sheet, ssId));
      queryClient.setQueryData(QUERY_KEYS.sheet(sheet, ssId), (old: any[]) => {
        if (!old) return [{ ...newData, _v: 1, _ts: new Date().toISOString(), _deleted: false }];
        const idx = old.findIndex((r: any) => r.id === newData.id);
        if (idx >= 0) {
          const copy = [...old];
          copy[idx] = { ...copy[idx], ...newData };
          return copy;
        }
        return [...old, { ...newData, _v: 1, _ts: new Date().toISOString(), _deleted: false }];
      });
      return { previous };
    },
    onError: (err, newData, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.sheet(sheet, ssId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sheet(sheet, ssId) });
    },
  });
}

/**
 * Mutation for deleting data with optimistic updates.
 */
export function useDeleteData(sheet: string, ssId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dataService.deleteData(sheet, ssId, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.sheet(sheet, ssId) });
      const previous = queryClient.getQueryData(QUERY_KEYS.sheet(sheet, ssId));
      queryClient.setQueryData(QUERY_KEYS.sheet(sheet, ssId), (old: any[]) =>
        old?.filter((r: any) => r.id !== id) || []
      );
      return { previous };
    },
    onError: (err, id, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.sheet(sheet, ssId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sheet(sheet, ssId) });
    },
  });
}

export async function initializeCacheOnLogin(queryClient?: QueryClient): Promise<void> {
  const coreSsId = getConfig('ss_core');
  if (!coreSsId) return;

  const [pluginsResult, configResult, perfilesResult] = await Promise.all([
    dataService.getData<{ plugin_id: string; ssId: string }[]>('Registro_Plugins', coreSsId),
    dataService.getData<{ clave: string; valor: string }[]>('Configuracion', coreSsId),
    dataService.getPerfiles(coreSsId),
  ]);

  const modules: Record<string, string> = {};
  pluginsResult.forEach((p) => {
    modules[p.plugin_id] = p.ssId;
  });

  const config: Record<string, string> = {};
  let publicSsId: string | null = null;
  configResult.forEach((c) => {
    config[c.clave] = c.valor;
    if (c.clave === 'ss_publico' && c.valor) {
      publicSsId = c.valor;
    }
  });

  // Store config to localStorage (core only - the getConfig fallback handles public)
  setConfigs(config, false);
  // Set timestamp for TTL tracking
  setSettingsFetchedAt();

  // Also store theme_config specifically if present
  if (config.theme_config) {
    localStorage.setItem('congre_theme_config', config.theme_config);
  }

  const userPerfilId = localStorage.getItem('congre_perfil_id');
  const perfil = perfilesResult.find((p) => p.id === userPerfilId);

  if (perfil) {
    await cacheService.refreshOnLogin(
      modules,
      config,
      perfil,
      publicSsId || ''
    );
  }

  if (queryClient) {
    queryClient.setQueryData(QUERY_KEYS.sheet('Registro_Plugins', coreSsId), pluginsResult);
    queryClient.setQueryData(QUERY_KEYS.sheet('Configuracion', coreSsId), configResult);
    queryClient.setQueryData(QUERY_KEYS.sheet('Perfiles', coreSsId), perfilesResult);
  }
}
