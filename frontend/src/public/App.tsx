import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Alert,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Link
} from '@mui/material';
import {
  Church as ChurchIcon,
  AdminPanelSettings as AdminIcon,
  Event as EventIcon,
  Campaign as CampaignIcon,
  Share as ShareIcon
} from '@mui/icons-material';

const PUBLIC_SS_ID_KEY = 'congre_public_ss_id';

interface CongregacionInfo {
  nombre?: string;
  numero?: string;
}

export default function PublicApp() {
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [ssIdInput, setSsIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [congregacion, setCongregacion] = useState<CongregacionInfo | null>(null);
  const [publicData, setPublicData] = useState<any[]>([]);

  useEffect(() => {
    const storedSsId = localStorage.getItem(PUBLIC_SS_ID_KEY);
    if (storedSsId) {
      loadPublicData(storedSsId);
    } else {
      setShowSetupDialog(true);
    }
  }, []);

  const loadPublicData = async (ssId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${ssId}/gviz/tq?tqx=out:json&sheet=Publico`;
      const response = await fetch(gvizUrl);
      const text = await response.text();
      
      const jsonMatch = text.match(/(\{.*\})/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1]);
        if (data.table) {
          setPublicData(data.table.rows || []);
        }
      }
      
      setCongregacion({ nombre: 'Congregación' });
    } catch (err) {
      setError('Error al cargar datos públicos. Verifique el ID de la hoja de cálculo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSsId = () => {
    if (!ssIdInput.trim()) {
      setError('Ingrese un ID de hoja de cálculo');
      return;
    }
    
    localStorage.setItem(PUBLIC_SS_ID_KEY, ssIdInput.trim());
    setShowSetupDialog(false);
    loadPublicData(ssIdInput.trim());
  };

  const handleAccessAdmin = () => {
    window.location.href = '/admin';
  };

  const handleInstall = () => {
    window.location.href = '/admin/setup';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <ChurchIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {congregacion?.nombre || 'Congre-Admin'}
          </Typography>
          <Button
            color="inherit"
            size="small"
            onClick={handleInstall}
            sx={{ mr: 1, opacity: 0.7 }}
          >
            Instalar
          </Button>
          <Button
            color="inherit"
            startIcon={<AdminIcon />}
            onClick={handleAccessAdmin}
          >
            Acceso Admin
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <>
            <Typography variant="h4" gutterBottom>
              Bienvenidos
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Información pública de la congregación
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
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
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
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
              </Grid>
            </Grid>

            {publicData.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Datos Públicos
                </Typography>
                <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, overflow: 'auto' }}>
                  {JSON.stringify(publicData, null, 2)}
                </pre>
              </Box>
            )}
          </>
        )}
      </Container>

      <Dialog open={showSetupDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Configurar Acceso Público
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ingrese el ID de la hoja de cálculo pública de su congregación.
            Esta información se obtendrá de la configuración del sistema.
          </Typography>
          <TextField
            fullWidth
            label="ID de Hoja de Cálculo"
            placeholder="1abc123..."
            value={ssIdInput}
            onChange={(e) => setSsIdInput(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Alert severity="info" sx={{ mb: 2 }}>
            El ID se encuentra en la URL de su hoja de cálculo de Google:
            docs.google.com/spreadsheets/d/<b>ID_AQUI</b>/edit
          </Alert>
          <Button
            fullWidth
            variant="contained"
            onClick={handleSaveSsId}
          >
            Guardar y Cargar
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
