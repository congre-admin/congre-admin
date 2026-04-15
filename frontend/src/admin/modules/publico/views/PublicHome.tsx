import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid2,
  CircularProgress,
} from '@mui/material';
import {
  Event as EventIcon,
  Campaign as CampaignIcon,
} from '@mui/icons-material';
import { parseCsvToJson } from '@/utils/csvUtils';
import { setConfigs, getConfig } from '@/utils/settingsCache';

const PUBLIC_SS_ID_KEY = 'congre_public_ss_id';

export default function PublicHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [congregacion, setCongregacion] = useState<{
    nombre?: string;
    numero?: string;
    temaColor?: string;
    temaColorSecundario?: string;
    iconoUrl?: string;
  } | null>(null);

  useEffect(() => {
    const storedSsId = localStorage.getItem(PUBLIC_SS_ID_KEY);
    if (storedSsId) {
      loadPublicData(storedSsId);
    } else {
      // No SSID - let modal handle this, show loading until modal appears
      setLoading(false);
    }
  }, []);

  const loadPublicData = async (ssId: string) => {
    setLoading(true);
    setError(null);
    
    let nombreMostrar: string | undefined;
    let temaColor: string | undefined;
    let temaColorSecundario: string | undefined;
    let iconoUrl: string | undefined;
    
    try {
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${ssId}/gviz/tq?tqx=out:csv&sheet=Configuracion`;
      const configResponse = await fetch(gvizUrl);
      const configText = await configResponse.text();
      
      // Check if response is HTML error instead of CSV
      if (configText.trim().startsWith('<') || configResponse.status !== 200) {
        setError(`Error: ${configResponse.status} - La hoja de cálculo no es pública o no existe`);
        setLoading(false);
        return;
      }
      
      const configData = parseCsvToJson(configText);
      
      // Store ALL config keys in localStorage
      const publicConfig: Record<string, string> = {};
      
      // First pass: collect all raw key-value pairs
      for (const row of configData) {
        const clave = row.clave;
        const valor = row.valor;
        
        if (clave && valor !== undefined) {
          publicConfig[clave] = valor;
        }
      }
      
      // Second pass: extract specific formatted values for display
      for (const row of configData) {
        const clave = row.clave;
        const valor = row.valor;
        
        if (clave === 'nombre_mostrar') nombreMostrar = valor;
        
        // theme_config is a JSON object with primary color
        if (clave === 'theme_config') {
          try {
            const themeConfig = JSON.parse(valor);
            temaColor = themeConfig.primary;
          } catch { /* ignore */ }
        }
        
        // Fallback: tema_color as simple string
        if (clave === 'tema_color' && !temaColor) {
          temaColor = valor;
        }
        
        // icon_config is a JSON object with icon data - extract URL if available
        if (clave === 'icon_config') {
          try {
            const iconConfig = JSON.parse(valor);
            // Check for text-based icon URL (not emoji)
            iconoUrl = iconConfig.url || iconConfig.text || undefined;
          } catch { /* ignore */ }
        }
        
        // Fallback: icono_url as simple string
        if (clave === 'icono_url' && !iconoUrl) {
          iconoUrl = valor;
        }
      }
      
      // Store each config key using the unified settings cache
      setConfigs(publicConfig, true);
      
      if (temaColor) {
        document.documentElement.style.setProperty('--theme-primary', temaColor);
      }
      if (temaColorSecundario) {
        document.documentElement.style.setProperty('--theme-secondary', temaColorSecundario);
      }
      
      setCongregacion({ 
        nombre: nombreMostrar || 'CongreAdmin', 
        temaColor,
        temaColorSecundario,
        iconoUrl
      });
    } catch (err) {
      console.error('Error loading public data:', err);
      setError('Error al cargar datos públicos');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const congregationName = congregacion?.nombre || 'CongreAdmin';

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bienvenido a {congregationName}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Información pública de la congregación
      </Typography>

      <Grid2 container spacing={3}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Card 
            sx={{ cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}
            onClick={() => handleNavigation('/reuniones')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EventIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Reuniones</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Horarios de reuniones de la congregación
              </Typography>
            </CardContent>
          </Card>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }}>
          <Card 
            sx={{ cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}
            onClick={() => handleNavigation('/anuncios')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CampaignIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Anuncios</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Anuncios y actualizaciones recientes
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>
    </Container>
  );
}
