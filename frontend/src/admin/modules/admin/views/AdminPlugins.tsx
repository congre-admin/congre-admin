import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  Button,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Extension as ExtensionIcon,
  InstallDesktop as InstallIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  CheckCircle,
  Error as ErrorIcon,
  TableChart as TableIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../../core/context/AuthContext';
import { dataService } from '@/services/dataService';
import type { BatchOp } from '@/services/dataService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSys } from '@/utils/settingsCache';
import Page from '@/admin/core/components/Page';

// Static plugin manifests - in production these would be loaded dynamically
const BUILT_IN_PLUGINS = [
  {
    id: 'publico',
    name: 'Público',
    description: 'Página pública con reuniones y anuncios',
    version: '1.0.0',
    auth: 'none' as const,
    public: true,
    ssIdField: 'public_ss_id',
    tables: ['Configuracion', 'Registro_Reuniones', 'Registro_Anuncios'],
  },
  {
    id: 'personas',
    name: 'Personas',
    description: 'Gestión de miembros y asistencia',
    version: '1.0.0',
    auth: 'required' as const,
    public: false,
    ssIdField: 'personas_ss_id',
    tables: ['Registro_Personas', 'Registro_Asistencia'],
  },
  {
    id: 'tesoreria',
    name: 'Tesoreria',
    description: 'Gestión de finanzas y ofrendas',
    version: '1.0.0',
    auth: 'required' as const,
    public: false,
    ssIdField: 'tesoreria_ss_id',
    tables: ['Registro_Ofrendas', 'Registro_Gastos'],
  },
];

interface InstalledPlugin {
  plugin_id: string;
  ssId: string;
  status: 'active' | 'inactive';
  config?: string;
  _v?: number;
  _ts?: string;
  _deleted?: boolean;
}

export default function AdminPlugins() {
  const { sessionToken, user } = useAuth();
  const queryClient = useQueryClient();
  const coreSsId = getSys('core_ss_id');
  
  const [installDialog, setInstallDialog] = useState<{ open: boolean; plugin: typeof BUILT_IN_PLUGINS[0] | null }>({
    open: false,
    plugin: null,
  });
  const [newSsId, setNewSsId] = useState('');
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  // Fetch installed plugins from Registro_Plugins
  const { data: installedPlugins, isLoading, refetch } = useQuery({
    queryKey: ['plugins', coreSsId],
    queryFn: async () => {
      if (!coreSsId) return [];
      const plugins = await dataService.getData<InstalledPlugin[]>('Registro_Plugins', coreSsId);
      return plugins || [];
    },
    enabled: !!coreSsId,
  });

  // Get settings to find SSIDs
  const { data: settings } = useQuery({
    queryKey: ['settings', coreSsId],
    queryFn: async () => {
      if (!coreSsId) return {};
      const data = await dataService.getData<Record<string, string>[]>('Configuracion', coreSsId);
      return data?.[0] || {};
    },
    enabled: !!coreSsId,
  });

  const getSsIdForPlugin = (pluginId: string): string | null => {
    const plugin = BUILT_IN_PLUGINS.find(p => p.id === pluginId);
    if (!plugin) return null;
    const field = plugin.ssIdField;
    return settings?.[field] || null;
  };

  const isInstalled = (pluginId: string): boolean => {
    return installedPlugins?.some(p => p.plugin_id === pluginId && p.status !== 'inactive') || false;
  };

  const isEnabled = (pluginId: string): boolean => {
    const plugin = installedPlugins?.find(p => p.plugin_id === pluginId);
    return plugin?.status === 'active';
  };

  const handleToggleEnabled = async (pluginId: string, enabled: boolean) => {
    if (!coreSsId || !sessionToken) return;
    
    try {
      const existing = installedPlugins?.find(p => p.plugin_id === pluginId);
      if (existing) {
        await dataService.batchExecute([{
          sheet: 'Registro_Plugins',
          op: 'update',
          ...existing,
          status: enabled ? 'active' : 'inactive',
        }], { ssId: coreSsId });
      }
      queryClient.invalidateQueries({ queryKey: ['plugins', coreSsId] });
    } catch (err) {
      console.error('Failed to toggle plugin:', err);
    }
  };

  const handleInstall = async () => {
    if (!coreSsId || !sessionToken || !installDialog.plugin) return;
    
    setInstalling(true);
    setInstallError(null);
    
    try {
      const pluginId = installDialog.plugin.id;
      const existing = installedPlugins?.find(p => p.plugin_id === pluginId);
      const field = installDialog.plugin.ssIdField;
      
      // Get current settings for SSID update
      const currentSettings = await dataService.getData<Record<string, string>[]>('Configuracion', coreSsId);
      const settingsOps: BatchOp[] = [];
      
      // Update or create plugin registration
      if (existing) {
        settingsOps.push({
          sheet: 'Registro_Plugins',
          op: 'update',
          ...existing,
          ssId: newSsId,
          status: 'active',
        });
      } else {
        settingsOps.push({
          sheet: 'Registro_Plugins',
          op: 'create',
          plugin_id: pluginId,
          ssId: newSsId,
          status: 'active',
          config: '{}',
          _v: 1,
        });
      }
      
      // Also save the SSID to settings
      if (currentSettings?.[0]) {
        settingsOps.push({
          sheet: 'Configuracion',
          op: 'update',
          ...currentSettings[0],
          [field]: newSsId,
        });
      }
      
      await dataService.batchExecute(settingsOps, { ssId: coreSsId, mode: 'fail-fast' });
      
      queryClient.invalidateQueries({ queryKey: ['plugins', coreSsId] });
      queryClient.invalidateQueries({ queryKey: ['settings', coreSsId] });
      
      setInstallDialog({ open: false, plugin: null });
      setNewSsId('');
    } catch (err: any) {
      setInstallError(err.message || 'Error al instalar plugin');
    } finally {
      setInstalling(false);
    }
  };

  const handleUninstall = async (pluginId: string) => {
    if (!coreSsId || !sessionToken) return;
    
    try {
      await dataService.batchExecute([{
        sheet: 'Registro_Plugins',
        op: 'update',
        plugin_id: pluginId,
        ssId: '',
        status: 'inactive',
      }], { ssId: coreSsId });
      
      queryClient.invalidateQueries({ queryKey: ['plugins', coreSsId] });
    } catch (err) {
      console.error('Failed to uninstall plugin:', err);
    }
  };

  const openInstallDialog = (plugin: typeof BUILT_IN_PLUGINS[0]) => {
    const currentSsId = getSsIdForPlugin(plugin.id);
    setNewSsId(currentSsId || '');
    setInstallDialog({ open: true, plugin });
  };

  if (isLoading) {
    return (
      <Page title="Gestión de módulos" loading={true}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  return (
    <Page
      title="Gestión de módulos"
      subtitle="Instala y configura los módulos de la aplicación. Cada módulo puede tener su propia hoja de cálculo"
    >
      <Box>
        {BUILT_IN_PLUGINS.map((plugin) => {
          const installed = isInstalled(plugin.id);
          const enabled = isEnabled(plugin.id);
          const pluginSsId = getSsIdForPlugin(plugin.id);
          
          return (
            <Paper key={plugin.id} sx={{ mb: 2, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ mt: 0.5 }}>
                  <ExtensionIcon color={enabled ? 'primary' : 'disabled'} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {plugin.name}
                    </Typography>
                    {installed && (
                      <Chip
                        size="small"
                        icon={enabled ? <CheckCircle /> : <ErrorIcon />}
                        label={enabled ? 'Activo' : 'Inactivo'}
                        color={enabled ? 'success' : 'default'}
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {plugin.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={`v${plugin.version}`}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={plugin.auth === 'none' ? 'Público' : 'Admin'}
                      variant="outlined"
                      color={plugin.auth === 'none' ? 'info' : 'default'}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {installed ? (
                    <>
                      <Switch
                        checked={enabled}
                        onChange={(e) => handleToggleEnabled(plugin.id, e.target.checked)}
                      />
                      <IconButton
                        color="error"
                        onClick={() => handleUninstall(plugin.id)}
                        title="Desinstalar"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<InstallIcon />}
                      onClick={() => openInstallDialog(plugin)}
                    >
                      Instalar
                    </Button>
                  )}
                </Box>
              </Box>
              
              {installed && (
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary">
                    ID de Hoja de Cálculo
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {pluginSsId || 'Sin configurar'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                    {plugin.tables.map(table => (
                      <Chip
                        key={table}
                        size="small"
                        icon={<TableIcon />}
                        label={table}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          );
        })}
      </Box>

      {/* Install Dialog */}
      <Dialog open={installDialog.open} onClose={() => setInstallDialog({ open: false, plugin: null })}>
        <DialogTitle>
          Instalar módulo: {installDialog.plugin?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ingresa el ID de la hoja de cálculo para este plugin. La hoja debe tener las siguientes pestañas:
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
            {installDialog.plugin?.tables.map(table => (
              <Chip key={table} size="small" label={table} variant="outlined" />
            ))}
          </Box>
          
          {installError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {installError}
            </Alert>
          )}
          
          <TextField
            label="ID de Hoja de Cálculo"
            fullWidth
            value={newSsId}
            onChange={(e) => setNewSsId(e.target.value)}
            placeholder="1a2b3c4d5e6f7g8h9i0..."
            helperText="El ID es la cadena larga al final de la URL de Google Sheets"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstallDialog({ open: false, plugin: null })}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleInstall}
            disabled={installing || !newSsId}
          >
            {installing ? <CircularProgress size={20} /> : 'Instalar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}
