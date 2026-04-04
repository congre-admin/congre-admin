import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../services/dataService';
import type { Perfil } from '../types';
import { QUERY_OPTIONS } from './queryConfig';

const QUERY_KEYS = {
  perfiles: (ssId: string) => ['perfiles', ssId] as const,
};

export function usePerfiles(ssId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.perfiles(ssId),
    queryFn: async () => {
      return dataService.getPerfiles(ssId);
    },
    enabled: !!ssId,
    ...QUERY_OPTIONS,
  });
}

export function useSavePerfil(ssId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Perfil>) => {
      if (payload.id) {
        return dataService.updateProfile(ssId, payload);
      }
      return dataService.createProfile(ssId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.perfiles(ssId) });
    },
  });
}

export function useDeletePerfil(ssId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string) => {
      return dataService.deleteProfile(ssId, profileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.perfiles(ssId) });
    },
  });
}
