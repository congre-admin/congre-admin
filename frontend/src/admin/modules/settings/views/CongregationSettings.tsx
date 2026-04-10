import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid2,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormHelperText,
} from '@mui/material';
import { ColorLens as ColorLensIcon, Save as SaveIcon } from '@mui/icons-material';
import { useSheetData } from '@/hooks/useSession';
import { useQueryClient } from '@tanstack/react-query';
import { dataService } from '@/services/dataService';
import { useThemeContext } from '@/core/context/ThemeContext';
import { getCachedSettings, setCachedSettings, isSettingsStale } from '@/utils/settingsCache';
import type { ThemeConfig, IconConfig, BgSetting, HarmonyMode } from '@/types';
import {
  generatePalette,
  generateBackgrounds,
  resolveBackground,
  resolveBackgroundDark,
  getAutoTextColor,
} from '@/utils/color';
import ThemePreview from '@/core/components/ThemePreview';
import IconCreator from '@/core/components/IconCreator';

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
  harmony: 'complementary',
  backgrounds: {
    lightPage: { mode: 'auto', value: null },
    lightPanel: { mode: 'auto', value: null },
    darkPage: { mode: 'auto', value: null },
    darkPanel: { mode: 'auto', value: null },
  },
};

const DEFAULT_ICON_CONFIG: IconConfig = {
  mode: 'default',
  text: '',
  bgMode: 'primary',
  bgColor: '#1976d2',
  textMode: 'white',
  textColor: '#ffffff',
  sizes: {},
};

const HARMONY_OPTIONS: { value: HarmonyMode; label: string }[] = [
  { value: 'complementary', label: 'Complementario' },
  { value: 'analogous', label: 'Análogo' },
  { value: 'triadic', label: 'Triádico' },
  { value: 'split', label: 'Split Complementario' },
  { value: 'monochromatic', label: 'Monocromático' },
];

const PUBLIC_FIELDS: (keyof CongregacionSettings)[] = ['nombre_mostrar', 'ciudad', 'provincia'];

export default function CongregationSettings() {
  const adminSsId = localStorage.getItem(ADMIN_SS_ID_KEY);
  const publicSsId = localStorage.getItem(PUBLIC_SS_ID_KEY);
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

  // Fetch settings if cache is empty or stale
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

  const palette = generatePalette(themeConfig.primary, themeConfig.harmony);
  const autoBg = generateBackgrounds(themeConfig.primary);

  const lightBgPage = resolveBackground(themeConfig.backgrounds.lightPage, autoBg.light.page);
  const lightBgPanel = resolveBackground(themeConfig.backgrounds.lightPanel, autoBg.light.panel);
  const darkBgPage = resolveBackgroundDark(themeConfig.backgrounds.darkPage, autoBg.dark.page);
  const darkBgPanel = resolveBackgroundDark(themeConfig.backgrounds.darkPanel, autoBg.dark.panel);

  const iconPreviewUrl = iconConfig.sizes?.['32'] || null;

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
        const text = iconConfig.text || formData.nombre_congregacion.charAt(0).toUpperCase() || '?';
        const bgColor = iconConfig.bgMode === 'primary' ? themeConfig.primary : iconConfig.bgColor;
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
      setSuccess('Icono guardado correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar icono');
    } finally {
      setSaving(prev => ({ ...prev, icon: false }));
    }
  }, [adminSsId, iconConfig, customIconFile, themeConfig.primary, formData.nombre_congregacion]);

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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Configuración de la congregación
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Configure la información, apariencia e icono del sitio público
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

      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {/* Información Básica */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Información Básica</Typography>
          <Grid2 container spacing={2}>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nombre de la Congregación"
                value={formData.nombre_congregacion}
                disabled
                helperText="Definido durante la instalación"
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Número de Congregación"
                value={formData.numero_congregacion}
                onChange={(e) => handleChange('numero_congregacion', e.target.value)}
                helperText="Número identificador"
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nombre a Mostrar"
                value={formData.nombre_mostrar}
                onChange={(e) => handleChange('nombre_mostrar', e.target.value)}
                helperText="Nombre que se muestra en el sitio público"
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Ciudad"
                value={formData.ciudad}
                onChange={(e) => handleChange('ciudad', e.target.value)}
                helperText="Ciudad de la congregación (opcional)"
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Provincia / Estado"
                value={formData.provincia}
                onChange={(e) => handleChange('provincia', e.target.value)}
                helperText="Provincia o estado (opcional)"
              />
            </Grid2>
          </Grid2>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={saving.basic ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSaveBasic}
              disabled={saving.basic || !hasBasicChanges}
            >
              {saving.basic ? 'Guardando...' : 'Guardar'}
            </Button>
          </Box>
        </Paper>

        {/* Apariencia + Fondos + ThemePreview */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Apariencia</Typography>
          <Grid2 container spacing={2}>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Color Primario"
                value={themeConfig.primary}
                onChange={(e) => setThemeConfig(prev => ({ ...prev, primary: e.target.value }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        component="input"
                        type="color"
                        value={themeConfig.primary}
                        onChange={(e) => setThemeConfig(prev => ({ ...prev, primary: e.target.value }))}
                        sx={{ width: 28, height: 28, border: 'none', p: 0, cursor: 'pointer', bgcolor: 'transparent' }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Armonía</InputLabel>
                <Select
                  value={themeConfig.harmony}
                  label="Armonía"
                  onChange={(e) => setThemeConfig(prev => ({ ...prev, harmony: e.target.value as HarmonyMode }))}
                >
                  {HARMONY_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Color Secundario"
                value={palette.secondary.main}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: palette.secondary.main, border: 1, borderColor: 'grey.400' }} />
                    </InputAdornment>
                  ),
                }}
                helperText="Generado automáticamente"
              />
            </Grid2>
          </Grid2>

          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Fondos</Typography>
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>Modo claro</Typography>
                <BgSettingControl
                  label="Página"
                  setting={themeConfig.backgrounds.lightPage}
                  autoValue={autoBg.light.page}
                  onChange={(s) => setThemeConfig(prev => ({ ...prev, backgrounds: { ...prev.backgrounds, lightPage: s } }))}
                />
                <BgSettingControl
                  label="Panel"
                  setting={themeConfig.backgrounds.lightPanel}
                  autoValue={autoBg.light.panel}
                  onChange={(s) => setThemeConfig(prev => ({ ...prev, backgrounds: { ...prev.backgrounds, lightPanel: s } }))}
                />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>Modo oscuro</Typography>
                <BgSettingControl
                  label="Página"
                  setting={themeConfig.backgrounds.darkPage}
                  autoValue={autoBg.dark.page}
                  onChange={(s) => setThemeConfig(prev => ({ ...prev, backgrounds: { ...prev.backgrounds, darkPage: s } }))}
                />
                <BgSettingControl
                  label="Panel"
                  setting={themeConfig.backgrounds.darkPanel}
                  autoValue={autoBg.dark.panel}
                  onChange={(s) => setThemeConfig(prev => ({ ...prev, backgrounds: { ...prev.backgrounds, darkPanel: s } }))}
                />
              </Grid2>
            </Grid2>
          </Box>

          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <ThemePreview
              primaryColor={themeConfig.primary}
              secondaryColor={palette.secondary.main}
              lightBgPage={lightBgPage}
              lightBgPanel={lightBgPanel}
              darkBgPage={darkBgPage}
              darkBgPanel={darkBgPanel}
              congregationName={formData.nombre_mostrar || formData.nombre_congregacion || 'Congregación'}
              iconPreview={iconPreviewUrl || undefined}
            />
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={saving.appearance ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSaveAppearance}
              disabled={saving.appearance || !hasAppearanceChanges}
            >
              {saving.appearance ? 'Guardando...' : 'Guardar'}
            </Button>
          </Box>
        </Paper>

        {/* Icono del Sitio */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Icono del Sitio</Typography>
          <IconCreator
            congregationName={formData.nombre_congregacion}
            primaryColor={themeConfig.primary}
            config={iconConfig}
            onChange={setIconConfig}
            onModeChange={(mode) => setIconConfig(prev => ({ ...prev, mode }))}
            customFile={customIconFile}
            onCustomFileChange={setCustomIconFile}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={saving.icon ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSaveIcon}
              disabled={saving.icon || !hasIconChanges}
            >
              {saving.icon ? 'Guardando...' : 'Guardar'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

function BgSettingControl({ label, setting, autoValue, onChange }: {
  label: string;
  setting: BgSetting;
  autoValue: string;
  onChange: (s: BgSetting) => void;
}) {
  const displayValue = setting.mode === 'auto' ? autoValue : setting.mode === 'neutral' ? (label === 'Página' ? '#f5f5f5' : '#ffffff') : setting.value || autoValue;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <RadioGroup
        row
        value={setting.mode}
        onChange={(e) => onChange({ mode: e.target.value as BgSetting['mode'], value: null })}
        sx={{ my: 0.25 }}
      >
        <FormControlLabel value="auto" control={<Radio size="small" />} label="Auto" />
        <FormControlLabel value="neutral" control={<Radio size="small" />} label="Neutral" />
        <FormControlLabel value="custom" control={<Radio size="small" />} label="Custom" />
      </RadioGroup>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{displayValue}</Typography>
        {setting.mode === 'custom' && (
          <TextField
            size="small"
            type="color"
            value={setting.value || autoValue}
            onChange={(e) => onChange({ mode: 'custom', value: e.target.value })}
            sx={{ width: 40, height: 28 }}
            InputProps={{ sx: { p: 0 } }}
          />
        )}
      </Box>
    </Box>
  );
}
