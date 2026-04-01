import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../services/dataService';

const QUERY_KEYS = {
  config: (key: string) => ['config', key] as const,
};

export function useConfig(ssId: string | undefined, key: string) {
  return useQuery({
    queryKey: QUERY_KEYS.config(key),
    queryFn: async () => {
      if (!ssId) throw new Error('ssId required');
      return dataService.getConfig(key, ssId);
    },
    enabled: !!ssId && !!key,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSetConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      key,
      value,
      ssId,
      isPublic = false,
    }: {
      key: string;
      value: string;
      ssId: string;
      isPublic?: boolean;
    }) => {
      return dataService.setConfig(key, value, ssId, isPublic);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.config(variables.key) });
    },
  });
}
