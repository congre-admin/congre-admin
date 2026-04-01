import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../services/dataService';
import { dataTransformService } from '../services/dataTransformService';
import type { GetDataOptions, SaveDataOptions } from '../types';

const QUERY_KEYS = {
  personas: ['personas'],
  perfiles: ['perfiles'],
  config: (key: string) => ['config', key] as const,
  session: ['session'],
  authMethods: ['authMethods'],
} as const;

export interface PersonaFilters {
  estado?: string;
  grupo?: string;
  search?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}

export function usePersonas(ssId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.personas,
    queryFn: async () => {
      if (!ssId) throw new Error('ssId required');
      return dataService.getData<any[]>('Personas', ssId);
    },
    enabled: !!ssId,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePersonaFilter(ssId: string | undefined, filters: PersonaFilters) {
  const { data: personas, ...rest } = usePersonas(ssId);

  const filteredData = React.useMemo(() => {
    if (!personas) return undefined;

    let result = personas;

    if (filters.estado) {
      result = dataTransformService.filter(result, `estado = "${filters.estado}"`);
    }

    if (filters.grupo) {
      result = dataTransformService.filter(result, `grupo = "${filters.grupo}"`);
    }

    if (filters.search) {
      result = dataTransformService.filter(
        result,
        `nombre =~ /${filters.search}/i`
      );
    }

    if (filters.sort) {
      result = dataTransformService.sort(result, filters.sort);
    }

    if (filters.offset) {
      result = result.slice(filters.offset);
    }

    if (filters.limit) {
      result = result.slice(0, filters.limit);
    }

    return result;
  }, [personas, filters]);

  return { data: filteredData, ...rest };
}

export function useActivos(ssId: string | undefined) {
  return usePersonaFilter(ssId, { estado: 'activo' });
}

export function useSavePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ssId,
      payload,
      options,
    }: {
      ssId: string;
      payload: any;
      options?: SaveDataOptions;
    }) => {
      return dataService.saveData('Personas', ssId, payload, options);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.personas });
    },
  });
}

export function useDeletePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ssId, id }: { ssId: string; id: string }) => {
      return dataService.deleteData('Personas', ssId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.personas });
    },
  });
}
