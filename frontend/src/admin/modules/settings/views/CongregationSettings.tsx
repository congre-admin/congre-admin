import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Visibility,
  VisibilityOff,
  Image as ImageIcon
} from '@mui/icons-material';
import { dataService } from '@/services/dataService';

const ADMIN_SS_ID_KEY = 'congre_admin_ss_id';
const PUBLIC_SS_ID_KEY = 'congre_public_ss_id';

interface CongregacionSettings {
  nombre_congregacion: string;
  numero_congregacion: string;
  nombre_mostrar: string;
  tema_color: string;
  tema_color_secundario: string;
  icono_url: string;
  idioma_predeterminado: string;
  zona_horaria: string;
}

const IDIOMA_OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
];

const DEFAULT_SETTINGS: CongregacionSettings = {
  nombre_congregacion: '',
  numero_congregacion: '',
  nombre_mostrar: '',
  tema_color: '#1976d2',
  tema_color_secundario: '#dc004e',
  icono_url: '',
  idioma_predeterminado: 'es',
  zona_horaria: 'America/Argentina/Buenos_Aires',
};

const PUBLIC_SETTINGS: (keyof CongregacionSettings)[] = [
  'nombre_mostrar',
  'tema_color',
  'tema_color_secundario',
  'icono_url',
  'idioma_predeterminado',
  'zona_horaria',
];

export default function CongregationSettings() {
  const adminSsId = localStorage.getItem(ADMIN_SS_ID_KEY);
  const publicSsId = localStorage.getItem(PUBLIC_SS_ID_KEY);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<CongregacionSettings>(DEFAULT_SETTINGS);
  const [originalData, setOriginalData] = useState<CongregacionSettings>(DEFAULT_SETTINGS);

  const [showIconPreview, setShowIconPreview] = useState(false);

  const [zonasHorarias, setZonasHorarias] = useState<string[]>([]);

  useEffect(() => {
    loadSettings();
    loadTimezones();
  }, []);

  const loadTimezones = () => {
    try {
      const zones = Intl.supportedValuesOf('timeZone');
      setZonasHorarias(zones);
    } catch (e) {
      setZonasHorarias([
        'America/Argentina/Buenos_Aires',
        'America/New_York',
        'America/Chicago',
        'America/Los_Angeles',
        'Europe/Madrid',
        'Europe/Lisbon',
        'America/Sao_Paulo',
        'America/Mexico_City',
      ]);
    }
  };

  const loadSettings = async () => {
    if (!adminSsId) {
      setError('ID de spreadsheet no configurado');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config = await dataService.getData<{ clave: string; valor: string }[]>('Configuracion', adminSsId);

      const loadedSettings: CongregacionSettings = { ...DEFAULT_SETTINGS };

      config.forEach((item) => {
        const key = item.clave as keyof CongregacionSettings;
        if (key in loadedSettings) {
          loadedSettings[key] = item.valor;
        }
      });

      setFormData(loadedSettings);
      setOriginalData(loadedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CongregacionSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!adminSsId) {
      setError('ID de spreadsheet no configurado');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const changedFields: (keyof CongregacionSettings)[] = [];

      (Object.keys(formData) as (keyof CongregacionSettings)[]).forEach((key) => {
        if (formData[key] !== originalData[key]) {
          changedFields.push(key);
        }
      });

      for (const field of changedFields) {
        const isPublic = PUBLIC_SETTINGS.includes(field);
        const value = formData[field];

        await dataService.setConfig(field, value, adminSsId, isPublic);

        if (isPublic && publicSsId) {
          try {
            await dataService.setConfig(field, value, publicSsId, isPublic);
          } catch (publicErr) {
            console.warn(`No se pudo sincronizar ${field} a hoja pública:`, publicErr);
          }
        }
      }

      setOriginalData(formData);
      setSuccess('Configuración guardada correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Configuración de la Congregación
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Configure la información y apariencia del sitio público
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Información Básica
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nombre de la Congregación"
              value={formData.nombre_congregacion}
              onChange={(e) => handleChange('nombre_congregacion', e.target.value)}
              helperText="Nombre completo de la congregación"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Número de Congregación"
              value={formData.numero_congregacion}
              onChange={(e) => handleChange('numero_congregacion', e.target.value)}
              helperText="Número identificador"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nombre a Mostrar"
              value={formData.nombre_mostrar}
              onChange={(e) => handleChange('nombre_mostrar', e.target.value)}
              helperText="Nombre que se muestra en el sitio público"
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Apariencia
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Color Primario"
              type="text"
              value={formData.tema_color}
              onChange={(e) => handleChange('tema_color', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 1,
                        bgcolor: formData.tema_color,
                        border: 1,
                        borderColor: 'grey.400',
                      }}
                    />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Color Secundario"
              type="text"
              value={formData.tema_color_secundario}
              onChange={(e) => handleChange('tema_color_secundario', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 1,
                        bgcolor: formData.tema_color_secundario,
                        border: 1,
                        borderColor: 'grey.400',
                      }}
                    />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="URL del Icono/Logo"
              value={formData.icono_url}
              onChange={(e) => handleChange('icono_url', e.target.value)}
              helperText="URL de la imagen del icono (png, svg)"
              InputProps={{
                endAdornment: formData.icono_url ? (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowIconPreview(!showIconPreview)} size="small">
                      {showIconPreview ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            {showIconPreview && formData.icono_url && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <img
                  src={formData.icono_url}
                  alt="Icono preview"
                  style={{ maxWidth: 100, maxHeight: 100 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </Box>
            )}
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="body2" gutterBottom>
            Vista previa:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {formData.icono_url ? (
              <img
                src={formData.icono_url}
                alt="Logo"
                style={{ width: 40, height: 40, objectFit: 'contain' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: formData.tema_color,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ImageIcon sx={{ color: 'white' }} />
              </Box>
            )}
            <Box>
              <Typography variant="h6" sx={{ color: formData.tema_color }}>
                {formData.nombre_mostrar || 'Nombre Congregación'}
              </Typography>
              <Typography variant="caption" sx={{ color: formData.tema_color_secundario }}>
                Texto secundario
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Regional
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Idioma Predeterminado</InputLabel>
              <Select
                value={formData.idioma_predeterminado}
                label="Idioma Predeterminado"
                onChange={(e) => handleChange('idioma_predeterminado', e.target.value)}
              >
                {IDIOMA_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Idioma del sitio público</FormHelperText>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Zona Horaria</InputLabel>
              <Select
                value={formData.zona_horaria}
                label="Zona Horaria"
                onChange={(e) => handleChange('zona_horaria', e.target.value)}
              >
                {zonasHorarias.map((tz) => (
                  <MenuItem key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Zona horaria para fechas y horarios</FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? <CircularProgress size={24} /> : 'Guardar Configuración'}
        </Button>
      </Box>
    </Box>
  );
}