import { useQuery } from '@tanstack/react-query';
import { dataService } from '../services/dataService';
import { useAuth } from '@/admin/core/context/AuthContext';

const ADMIN_SS_ID_KEY = 'congre_admin_ss_id';

export function useCongregacion() {
  const adminSsId = localStorage.getItem(ADMIN_SS_ID_KEY);
  
  return useQuery({
    queryKey: ['congregacion'],
    queryFn: async () => {
      if (!adminSsId) return null;
      const config = await dataService.getData<{ clave: string; valor: string }[]>('Configuracion', adminSsId);
      const nombre = config.find((c) => c.clave === 'nombre_mostrar')?.valor || config.find((c) => c.clave === 'nombre_congregacion')?.valor;
      const numero = config.find((c) => c.clave === 'numero_congregacion')?.valor;
      return { nombre: nombre || 'CongreAdmin', numero };
    },
    enabled: !!adminSsId,
    staleTime: 10 * 60 * 1000,
  });
}
