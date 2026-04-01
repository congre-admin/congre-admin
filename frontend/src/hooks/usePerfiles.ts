import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../services/dataService';
import type { Perfil } from '../types';

const QUERY_KEYS = {
  perfiles: ['perfiles'] as const,
};

export function usePerfiles() {
  return useQuery({
    queryKey: QUERY_KEYS.perfiles,
    queryFn: async () => {
      const result = await dataService.getPerfiles();
      return result.perfiles;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSavePerfil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Perfil>) => {
      if (payload.id) {
        return dataService.updateProfile(payload);
      }
      return dataService.createProfile(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.perfiles });
    },
  });
}

export function useDeletePerfil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string) => {
      return dataService.deleteProfile(profileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.perfiles });
    },
  });
}
