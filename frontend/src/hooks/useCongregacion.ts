import { useQuery } from '@tanstack/react-query';
import { dataService } from '../services/dataService';
import { QUERY_OPTIONS } from './queryConfig';
import { getSys } from '../utils/settingsCache';

export interface CongregacionSettings {
  nombre?: string;
  numero?: string;
  nombreMostrar?: string;
  temaColor?: string;
  temaColorSecundario?: string;
  iconoUrl?: string;
  idioma?: string;
  zonaHoraria?: string;
}

export function useCongregacion() {
  const adminSsId = getSys('core_ss_id');
  
  return useQuery<CongregacionSettings | null>({
    queryKey: ['congregacion'],
    queryFn: async () => {
      if (!adminSsId) return null;
      const config = await dataService.getData<{ clave: string; valor: string }[]>('Configuracion', adminSsId);
      
      const getValue = (key: string) => config.find((c) => c.clave === key)?.valor;
      
      return {
        nombre: getValue('nombre_mostrar') || getValue('nombre_congregacion') || 'CongreAdmin',
        numero: getValue('numero_congregacion'),
        nombreMostrar: getValue('nombre_mostrar'),
        temaColor: getValue('tema_color'),
        temaColorSecundario: getValue('tema_color_secundario'),
        iconoUrl: getValue('icono_url'),
        idioma: getValue('idioma_predeterminado'),
        zonaHoraria: getValue('zona_horaria'),
      };
    },
    enabled: !!adminSsId,
    ...QUERY_OPTIONS,
  });
}

export function useCongregacionName(): string {
  const { data } = useCongregacion();
  return data?.nombre || 'CongreAdmin';
}