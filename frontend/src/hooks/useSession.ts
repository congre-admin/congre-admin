import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { cacheService } from '../cache/cacheService';
import { dataService } from '../services/dataService';
import { QUERY_OPTIONS } from './queryConfig';
import { getSys, getConfig, setConfigs } from '../utils/settingsCache';

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

export function useSheetData<T = any>(sheet: string, ssId: string, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.sheet(sheet, ssId),
    queryFn: () => dataService.getData<T>(sheet, ssId),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

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
  const coreSsId = getSys('core_ss_id');
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

  let publicSsId: string | null = null;
  for (const c of configResult) {
    if (c.clave === 'ss_publico' && c.valor) {
      publicSsId = c.valor;
    }
  }

  setConfigs(configResult);

  const session = getSession();
  const userPerfilId = session?.userData?.perfilId;
  const perfil = perfilesResult.find((p) => p.id === userPerfilId);

  const configObj: Record<string, string> = {};
  configResult.forEach((c) => {
    configObj[c.clave] = c.valor;
  });

  if (perfil) {
    await cacheService.refreshOnLogin(
      modules,
      configObj,
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