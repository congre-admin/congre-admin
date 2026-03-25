import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { Security, Business, PersonAdd, CheckCircleOutline, CheckCircle } from '@mui/icons-material';

const API_URL_KEY = 'congre_admin_api_url';
const SS_ID_KEY = 'congre_admin_ss_id';

interface Perfil {
  id: string;
  nombre: string;
  permisos: Record<string, string>;
  descripcion: string;
}

interface SeedData {
  version: string;
  perfiles: Perfil[];
}

const steps = [
  { label: 'URL del Backend', icon: Security },
  { label: 'Nombre de Congregación', icon: Business },
  { label: 'Perfiles base', icon: CheckCircleOutline },
  { label: 'Usuario Admin', icon: PersonAdd },
];

export default function SetupWizard() {
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [apiUrl, setApiUrl] = useState('');
  const [nombreCongregacion, setNombreCongregacion] = useState('');
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    const storedApiUrl = localStorage.getItem(API_URL_KEY);
    const storedSsId = localStorage.getItem(SS_ID_KEY);
    
    if (storedApiUrl && storedSsId) {
      navigate('/login');
      return;
    }

    fetch('/data/seed_perfiles.json')
      .then(res => res.json())
      .then((data: SeedData) => {
        setPerfiles(data.perfiles);
      })
      .catch(err => {
        console.error('Error loading seed profiles:', err);
        setError('Error al cargar los perfiles base');
      });
  }, [navigate]);

  const validateApiConnection = async () => {
    if (!apiUrl.trim()) {
      setError('Ingrese la URL del Google Apps Script');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}?action=getData&sheet=Usuarios`);
      const data = await response.json();
      
      if (data.error && data.error !== 'Hoja no encontrada') {
        throw new Error(data.error);
      }

      localStorage.setItem(API_URL_KEY, apiUrl);
      setActiveStep(1);
    } catch (err) {
      setError('No se pudo conectar al backend. Verifique la URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async () => {
    if (!nombreCongregacion.trim()) {
      setError('Ingrese el nombre de la congregación');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const storedApiUrl = localStorage.getItem(API_URL_KEY);
      
      const response = await fetch(`${storedApiUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'install',
          payload: {
            nombreCongregacion,
            perfiles
          }
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error en la instalación');
      }

      localStorage.setItem(SS_ID_KEY, data.ssId);
      setActiveStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la instalación');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setError('Ingrese usuario y contraseña');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const storedApiUrl = localStorage.getItem(API_URL_KEY);
      
      const response = await fetch(`${storedApiUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          payload: {
            username: adminEmail || adminUsername,
            perfilId: 'p_admin'
          }
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al crear usuario');
      }

      setActiveStep(3);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ maxWidth: 500, mx: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Configurar Conexión al Backend
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ingrese la URL de su Google Apps Script (archivo api.gs desplegado como Web App)
            </Typography>
            <TextField
              fullWidth
              label="URL del Google Apps Script"
              placeholder="https://script.google.com/macros/s/..."
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              onClick={validateApiConnection}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Conectar'}
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ maxWidth: 500, mx: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Nombre de la Congregación
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ingrese el nombre de su congregación
            </Typography>
            <TextField
              fullWidth
              label="Nombre de la Congregación"
              placeholder="Congregación Central"
              value={nombreCongregacion}
              onChange={(e) => setNombreCongregacion(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              onClick={handleInstall}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Crear Base de Datos'}
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ maxWidth: 500, mx: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Perfiles Creados
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Los siguientes perfiles han sido creados:
            </Typography>
            <List>
              {perfiles.map((perfil) => (
                <ListItem key={perfil.id}>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={perfil.nombre}
                    secondary={perfil.descripcion}
                  />
                </ListItem>
              ))}
            </List>
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Crear Usuario Administrador
            </Typography>
            <TextField
              fullWidth
              label="Usuario (email)"
              placeholder="admin@congregacion.org"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              onClick={handleCreateAdmin}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Crear Administrador'}
            </Button>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ maxWidth: 500, mx: 'auto', textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              ¡Instalación Completada!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Redirigiendo al login...
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3
      }}
    >
      <Paper
        elevation={3}
        sx={{ p: 4, maxWidth: 700, width: '100%' }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Congre-Admin
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Asistente de Instalación
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                StepIconComponent={() => (
                  <step.icon sx={{ color: index <= activeStep ? 'primary.main' : 'disabled' }} />
                )}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </Paper>
    </Box>
  );
}