import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { cacheService } from '../cache/cacheService';
import { dataService } from '../services/dataService';
import { QUERY_OPTIONS } from './queryConfig';

const QUERY_KEYS = {
  session: ['session'] as const,
  authMethods: ['authMethods'] as const,
};

export function useSession() {
  return useQuery({
    queryKey: QUERY_KEYS.session,
    queryFn: async () => {
      return authService.validateSession();
    },
    ...QUERY_OPTIONS,
    enabled: false, // Manual only
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
  });
}

export async function initializeCacheOnLogin(): Promise<void> {
  const coreSsId = localStorage.getItem('congre_admin_ss_id');
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
    if (c.clave === 'ss_publico') {
      publicSsId = c.valor;
    }
  });

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
}
