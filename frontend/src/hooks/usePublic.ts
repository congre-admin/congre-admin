import { useQuery } from '@tanstack/react-query';
import { publicService } from '../services/publicService';
import { QUERY_OPTIONS } from './queryConfig';

const PUBLIC_SS_ID_KEY = 'congre_public_ss_publico';

const QUERY_KEYS = {
  publicData: (sheet: string) => ['public', sheet] as const,
} as const;

export function usePublicData<T = any[]>(sheet: string, query?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.publicData(sheet),
    queryFn: async () => {
      return publicService.getPublicData<T>(sheet, query);
    },
    enabled: !!localStorage.getItem(PUBLIC_SS_ID_KEY),
    ...QUERY_OPTIONS,
  });
}

export function usePublicAnuncios() {
  return usePublicData('Anuncios');
}

export function usePublicReuniones() {
  return usePublicData('Reuniones');
}

export function usePublicPersonas() {
  return usePublicData('Personas');
}
