import { Box, Typography, Grid, Card, CardContent, CardHeader, CircularProgress } from '@mui/material';
import { People, EventNote, Campaign, Map } from '@mui/icons-material';
import { useSheetData } from '@/hooks/useSession';
import { useCongregacion } from '@/hooks/useCongregacion';
import Page from '@/admin/core/components/Page';
import type { Perfil } from '@/types';

const ADMIN_SS_ID_KEY = 'congre_admin_ss_id';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
          </Box>
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 2, 
            bgcolor: `${color}20`,
            color: color 
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const adminSsId = localStorage.getItem(ADMIN_SS_ID_KEY) || '';
  const { data: perfiles, isLoading } = useSheetData<Perfil[]>('Perfiles', adminSsId, {
    enabled: !!adminSsId,
  });
  const { data: congregacion } = useCongregacion();
  const congregationName = congregacion?.nombre || 'CongreAdmin';

  return (
    <Page
      title="Tablero"
      subtitle={`Bienvenido a ${congregationName}`}
      loading={isLoading}
    >
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Perfiles" 
            value={perfiles?.length || 0} 
            icon={<People />} 
            color="#1976d2" 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Reuniones Hoy" 
            value="0" 
            icon={<EventNote />} 
            color="#2e7d32" 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Anuncios Activos" 
            value="0" 
            icon={<Campaign />} 
            color="#ed6c02" 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Territorios" 
            value="0" 
            icon={<Map />} 
            color="#9c27b0" 
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader title="Próximas Asignaciones" />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                No hay asignaciones próximas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader title="Anuncios Recientes" />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                No hay anuncios recientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Page>
  );
}
