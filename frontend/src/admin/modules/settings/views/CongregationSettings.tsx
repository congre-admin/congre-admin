import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  ButtonProps,
  Alert,
  CircularProgress,
  Grid2 as Grid,
  InputAdornment,
  Divider,
  MenuItem,
} from '@mui/material';
import { ColorLens as ColorLensIcon, Save as SaveIcon } from '@mui/icons-material';
import { useSheetData } from '@/hooks/useSession';
import { useQueryClient } from '@tanstack/react-query';
import { dataService } from '@/services/dataService';
import { useThemeContext } from '@/core/context/ThemeContext';
import { getCachedSettings, setCachedSettings, isSettingsStale, getConfig } from '@/utils/settingsCache';
import type { ThemeConfig, IconConfig, BgSetting, HarmonyMode } from '@/types';
import {
  generatePalette,
  getAutoTextColor,
} from '@/utils/color';
import IconCreator from '@/core/components/IconCreator';
import Page from '@/admin/core/components/Page';

const ADMIN_SS_ID_KEY = 'congre_admin_ss_id';
const PUBLIC_SS_ID_KEY = 'congre_public_ss_id';

interface CongregacionSettings {
  nombre_congregacion: string;
  numero_congregacion: string;
  nombre_mostrar: string;
  ciudad: string;
  provincia: string;
}

const DEFAULT_SETTINGS: CongregacionSettings = {
  nombre_congregacion: '',
  numero_congregacion: '',
  nombre_mostrar: '',
  ciudad: '',
  provincia: '',
};

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  primary: '#1976d2',
  secondary: '#dc004e',
  harmony: 'complementary',
  backgrounds: {
    lightPage: { mode: 'auto', value: null },
    lightPanel: { mode: 'auto', value: null },
    darkPage: { mode: 'auto', value: null },
    darkPanel: { mode: 'auto', value: null },
  },
};

const HARMONY_OPTIONS: { value: HarmonyMode; label: string }[] = [
  { value: 'complementary', label: 'Complementario' },
  { value: 'analogous', label: 'Análogo' },
  { value: 'triadic', label: 'Triádico' },
  { value: 'split', label: 'Split Complementario' },
  { value: 'monochromatic', label: 'Monocromático' },
];

const DEFAULT_ICON_CONFIG: IconConfig = {
  mode: 'default',
  text: '',
  bgMode: 'primary',
  bgColor: '#1976d2',
  textMode: 'white',
  textColor: '#ffffff',
  sizes: {},
};

// Fields synced to public sheet
const PUBLIC_FIELDS: (keyof CongregacionSettings)[] = [
  'nombre_mostrar',
  'ciudad',
  'provincia',
  'nombre_congregacion',
  'numero_congregacion',
];

export default function CongregationSettings() {
  const adminSsId = getConfig('ss_core') || localStorage.getItem(ADMIN_SS_ID_KEY);
  const queryClient = useQueryClient();
  const { updateThemeConfig } = useThemeContext();

  const cached = getCachedSettings();

  const [saving, setSaving] = useState<Record<string, boolean>>({ basic: false, appearance: false, icon: false });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<CongregacionSettings>(() => {
    if (cached?.data) {
      return {
        nombre_congregacion: cached.data.nombre_congregacion || '',
        numero_congregacion: cached.data.numero_congregacion || '',
        nombre_mostrar: cached.data.nombre_mostrar || '',
        ciudad: cached.data.ciudad || '',
        provincia: cached.data.provincia || '',
      };
    }
    return DEFAULT_SETTINGS;
  });
  const [originalData, setOriginalData] = useState<CongregacionSettings>(() => {
    if (cached?.data) {
      return {
        nombre_congregacion: cached.data.nombre_congregacion || '',
        numero_congregacion: cached.data.numero_congregacion || '',
        nombre_mostrar: cached.data.nombre_mostrar || '',
        ciudad: cached.data.ciudad || '',
        provincia: cached.data.provincia || '',
      };
    }
    return DEFAULT_SETTINGS;
  });

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    if (cached?.data.theme_config) {
      try { return JSON.parse(cached.data.theme_config); } catch { /* ignore */ }
    }
    return DEFAULT_THEME_CONFIG;
  });
  const [originalThemeConfig, setOriginalThemeConfig] = useState<ThemeConfig>(() => {
    if (cached?.data.theme_config) {
      try { return JSON.parse(cached.data.theme_config); } catch { /* ignore */ }
    }
    return DEFAULT_THEME_CONFIG;
  });

  const [iconConfig, setIconConfig] = useState<IconConfig>(() => {
    if (cached?.data.icon_config) {
      try { return JSON.parse(cached.data.icon_config); } catch { /* ignore */ }
    }
    return DEFAULT_ICON_CONFIG;
  });
  const [originalIconConfig, setOriginalIconConfig] = useState<IconConfig>(() => {
    if (cached?.data.icon_config) {
      try { return JSON.parse(cached.data.icon_config); } catch { /* ignore */ }
    }
    return DEFAULT_ICON_CONFIG;
  });
  const [customIconFile, setCustomIconFile] = useState<File | null>(null);
  const [isInitializing, setIsInitializing] = useState(!cached);
  const themeConfigRef = useRef(themeConfig);
  const iconConfigRef = useRef(iconConfig);
  useEffect(() => { themeConfigRef.current = themeConfig; }, [themeConfig]);
  useEffect(() => { iconConfigRef.current = iconConfig; }, [iconConfig]);

  useEffect(() => {
    if (!adminSsId) return;
    if (!isSettingsStale() && cached) { setIsInitializing(false); return; }

    dataService.getData<{ clave: string; valor: any }[]>('Configuracion', adminSsId)
      .then(config => {
        const settings: Record<string, string> = {};
        config.forEach(c => {
          settings[c.clave] = typeof c.valor === 'object' ? JSON.stringify(c.valor) : c.valor;
        });
        setCachedSettings(settings);

        const loadedSettings = { ...DEFAULT_SETTINGS };
        let loadedTheme: ThemeConfig | null = null;
        let loadedIcon: IconConfig | null = null;

        config.forEach((item) => {
          const key = item.clave as keyof CongregacionSettings;
          if (key in loadedSettings) loadedSettings[key] = typeof item.valor === 'object' ? JSON.stringify(item.valor) : item.valor;
          if (item.clave === 'theme_config') {
            try { loadedTheme = typeof item.valor === 'object' ? item.valor : JSON.parse(item.valor); } catch { /* ignore */ }
          }
          if (item.clave === 'icon_config') {
            try { loadedIcon = typeof item.valor === 'object' ? item.valor : JSON.parse(item.valor); } catch { /* ignore */ }
          }
        });

        setFormData(loadedSettings);
        setOriginalData(loadedSettings);
        if (loadedTheme) { setThemeConfig(loadedTheme); setOriginalThemeConfig(loadedTheme); }
        if (loadedIcon) { setIconConfig(loadedIcon); setOriginalIconConfig(loadedIcon); }
        setIsInitializing(false);
      })
      .catch(() => setIsInitializing(false));
  }, [adminSsId]);

  const handleChange = (field: keyof CongregacionSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveBasic = async () => {
    if (!adminSsId) return;
    setSaving(prev => ({ ...prev, basic: true }));
    setError(null);
    setSuccess(null);

    try {
      const changedFields: (keyof CongregacionSettings)[] = [];
      (Object.keys(formData) as (keyof CongregacionSettings)[]).forEach((key) => {
        if (formData[key] !== originalData[key]) changedFields.push(key);
      });

      if (changedFields.length === 0) {
        setSaving(prev => ({ ...prev, basic: false }));
        return;
      }

      const ops = changedFields.map(field => ({
        op: 'save' as const,
        sheet: 'Configuracion',
        data: { clave: field, valor: formData[field], is_public: PUBLIC_FIELDS.includes(field) },
      }));

      await dataService.batchExecute(ops, { mode: 'fail-fast' });
      setOriginalData(formData);
      queryClient.invalidateQueries({ queryKey: ['sheet', 'Configuracion', adminSsId] });
      const existing = getCachedSettings();
      const updated = { ...existing?.data };
      changedFields.forEach(field => { updated[field] = formData[field]; });
      setCachedSettings(updated);
      setSuccess('Información guardada correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(prev => ({ ...prev, basic: false }));
    }
  };

  const handleSaveAppearance = async () => {
    if (!adminSsId) return;
    setSaving(prev => ({ ...prev, appearance: true }));
    setError(null);
    setSuccess(null);

    try {
      await dataService.batchExecute([{
        op: 'save' as const,
        sheet: 'Configuracion',
        data: { clave: 'theme_config', valor: JSON.stringify(themeConfig), is_public: true },
      }], { mode: 'fail-fast' });

      setOriginalThemeConfig(themeConfig);
      queryClient.invalidateQueries({ queryKey: ['sheet', 'Configuracion', adminSsId] });
      
      const existing = getCachedSettings();
      const updatedSettings = { ...existing?.data, theme_config: JSON.stringify(themeConfig) };
      setCachedSettings(updatedSettings);
      
      updateThemeConfig(themeConfigRef.current);
      
      setSuccess('Apariencia guardada correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(prev => ({ ...prev, appearance: false }));
    }
  };

  const updateFaviconLink = (sizes: Record<string, string>) => {
    const ico = sizes['ico'];
    const p32 = sizes['32'];
    const p192 = sizes['192'];

    if (ico) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.head.appendChild(link);
      }
      link.href = ico;
    }

    if (p192) {
      let apple = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (!apple) {
        apple = document.createElement('link');
        apple.rel = 'apple-touch-icon';
        document.head.appendChild(apple);
      }
      apple.href = p192;
    }
  };

  const handleSaveIcon = useCallback(async () => {
    if (!adminSsId) return;
    setSaving(prev => ({ ...prev, icon: true }));
    setError(null);
    setSuccess(null);

    try {
      const { generateIconFromText, generateIconFromImage } = await import('@/utils/faviconGenerator');
      let generated: { pngs: Record<string, string>; ico: string };

      if (iconConfig.mode === 'custom' && customIconFile) {
        generated = await generateIconFromImage(customIconFile);
      } else {
        const text = iconConfig.text || formData.nombre_mostrar.substring(0, 4) || '?';
        let bgColor = iconConfig.bgColor;
        if (iconConfig.bgMode === 'primary') bgColor = themeConfig.primary;
        else if (iconConfig.bgMode === 'secondary') bgColor = themeConfig.secondary || '#dc004e';
        
        const textColor = iconConfig.textMode === 'auto'
          ? getAutoTextColor(bgColor)
          : iconConfig.textMode === 'white' ? '#ffffff' : iconConfig.textColor;
        generated = generateIconFromText(text, bgColor, textColor);
      }

      const folderId = localStorage.getItem('congre_admin_folder_id');
      if (!folderId) throw new Error('Folder ID no configurado');

      const uploadOps = Object.entries(generated.pngs).map(([size, dataUrl]) => ({
        op: 'uploadFile' as const,
        content: dataUrl.split(',')[1],
        fileName: `favicon-${size}.png`,
        mimeType: 'image/png',
        subfolder: 'assets',
      }));
      uploadOps.push({
        op: 'uploadFile' as const,
        content: generated.ico.split(',')[1],
        fileName: 'favicon.ico',
        mimeType: 'image/x-icon',
        subfolder: 'assets',
      });

      const uploadResult = await dataService.batchExecute(uploadOps, { mode: 'fail-fast', folderId });

      const sizes: Record<string, string> = {};
      const keys = [...Object.keys(generated.pngs), 'ico'];
      uploadResult.results?.forEach((r, i) => {
        if (r.success && r.data?.fileUrl) {
          sizes[keys[i]] = r.data.fileUrl;
        }
      });

      const fullIconConfig: IconConfig = {
        ...iconConfigRef.current,
        sizes,
      };

      await dataService.batchExecute([{
        op: 'save' as const,
        sheet: 'Configuracion',
        data: { clave: 'icon_config', valor: JSON.stringify(fullIconConfig), is_public: true },
      }], { mode: 'fail-fast' });

      setIconConfig(fullIconConfig);
      setOriginalIconConfig(fullIconConfig);
      setCustomIconFile(null);
      queryClient.invalidateQueries({ queryKey: ['sheet', 'Configuracion', adminSsId] });
      const existing = getCachedSettings();
      setCachedSettings({ ...existing?.data, icon_config: JSON.stringify(fullIconConfig) });
      
      // Trigger favicon update immediately
      updateFaviconLink(sizes);
      
      setSuccess('Icono guardado correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar icono');
    } finally {
      setSaving(prev => ({ ...prev, icon: false }));
    }
  }, [adminSsId, iconConfig, customIconFile, themeConfig.primary, themeConfig.secondary, formData.nombre_mostrar]);

  const hasBasicChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
  const hasAppearanceChanges = JSON.stringify(themeConfig) !== JSON.stringify(originalThemeConfig);
  const hasIconChanges = iconConfig.mode !== originalIconConfig.mode
    || iconConfig.text !== originalIconConfig.text
    || iconConfig.bgMode !== originalIconConfig.bgMode
    || iconConfig.bgColor !== originalIconConfig.bgColor
    || iconConfig.textMode !== originalIconConfig.textMode
    || iconConfig.textColor !== originalIconConfig.textColor
    || !!customIconFile;

  if (isInitializing) {
    return (
      <Page title="Configuración de la congregación" loading={true}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  return (
    <Page
      title="Configuración de la congregación"
      subtitle="Defina la identidad visual y la información de contacto"
    >
      <Box sx={{ maxWidth: 800 }}>
        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

        {/* Información Básica */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Información Básica</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Nombre de la Congregación" value={formData.nombre_congregacion} disabled helperText="Inmodificable (usado en criptografía)" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Número de Congregación" value={formData.numero_congregacion} onChange={(e) => handleChange('numero_congregacion', e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Nombre a Mostrar" value={formData.nombre_mostrar} onChange={(e) => handleChange('nombre_mostrar', e.target.value)} helperText="Como se verá en el sitio público" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Ciudad" value={formData.ciudad} onChange={(e) => handleChange('ciudad', e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Provincia / Estado" value={formData.provincia} onChange={(e) => handleChange('provincia', e.target.value)} />
            </Grid>
          </Grid>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
             <Button variant="contained" startIcon={saving.basic ? <CircularProgress size={20} /> : <SaveIcon />} onClick={handleSaveBasic} disabled={saving.basic || !hasBasicChanges}>
              {saving.basic ? 'Guardando...' : 'Guardar Información'}
            </Button>
          </Box>
        </Paper>

        {/* Apariencia */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Paleta de Colores</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <ColorPickerField
                label="Color Primario"
                value={themeConfig.primary}
                onChange={(val) => {
                  const palette = generatePalette(val, themeConfig.harmony);
                  setThemeConfig(prev => ({ 
                    ...prev, 
                    primary: val,
                    secondary: palette.secondary.main
                  }));
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                select
                label="Armonía"
                value={themeConfig.harmony}
                onChange={(e) => {
                  const harmony = e.target.value as HarmonyMode;
                  const palette = generatePalette(themeConfig.primary, harmony);
                  setThemeConfig(prev => ({ 
                    ...prev, 
                    harmony,
                    secondary: palette.secondary.main
                  }));
                }}
              >
                {HARMONY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <ColorPickerField
                label="Color Secundario"
                value={themeConfig.secondary || '#dc004e'}
                onChange={(val) => setThemeConfig(prev => ({ ...prev, secondary: val }))}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={saving.appearance ? <CircularProgress size={20} /> : <SaveIcon />} onClick={handleSaveAppearance} disabled={saving.appearance || !hasAppearanceChanges}>
              {saving.appearance ? 'Guardando...' : 'Aplicar Colores'}
            </Button>
          </Box>
        </Paper>

        {/* Icono del Sitio */}
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Logotipo e Icono (Favicon)</Typography>
          <IconCreator
            congregationName={formData.nombre_congregacion}
            primaryColor={themeConfig.primary}
            secondaryColor={themeConfig.secondary || '#dc004e'}
            config={iconConfig}
            onChange={setIconConfig}
            onModeChange={(mode) => setIconConfig(prev => ({ ...prev, mode }))}
            customFile={customIconFile}
            onCustomFileChange={setCustomIconFile}
          />
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={saving.icon ? <CircularProgress size={20} /> : <SaveIcon />} onClick={handleSaveIcon} disabled={saving.icon || !hasIconChanges}>
              {saving.icon ? 'Guardando...' : 'Guardar Icono'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Page>
  );
}

function ColorPickerField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <TextField
      fullWidth
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Box
                component="input"
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                sx={{ 
                  width: 32, 
                  height: 32, 
                  border: 'none', 
                  p: 0, 
                  outline: 'none',
                  cursor: 'pointer', 
                  bgcolor: 'transparent',
                  borderRadius: '4px'
                }}
              />
            </InputAdornment>
          ),
        }
      }}
    />
  );
}
