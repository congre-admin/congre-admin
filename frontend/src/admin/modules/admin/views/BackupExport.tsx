import { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Download,
  Upload,
  Visibility,
  VisibilityOff,
  Restore
} from '@mui/icons-material';
import { createMasterKeyBackup, restoreMasterKeyBackup, MasterKeyBackup } from '@/core/crypto/cryptoUtils';
import { useAuth } from '@/core/context/AuthContext';

export default function BackupExport() {
  const { user, wrapped_mk, sessionToken, apiUrl } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [backupPassword, setBackupPassword] = useState('');
  const [backupPasswordConfirm, setBackupPasswordConfirm] = useState('');
  const [showBackupPassword, setShowBackupPassword] = useState(false);

  const [restoreFile, setRestoreFile] = useState<MasterKeyBackup | null>(null);
  const [restorePassword, setRestorePassword] = useState('');
  const [showRestorePassword, setShowRestorePassword] = useState(false);

  const handleExport = async () => {
    if (!backupPassword || !backupPasswordConfirm) {
      setError('Complete ambos campos de contraseña');
      return;
    }
    if (backupPassword !== backupPasswordConfirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (backupPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (!wrapped_mk) {
      setError('No hay clave maestra disponible. Inicie sesión primero.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const backup = await createMasterKeyBackup(
        wrapped_mk,
        user?.username || 'unknown',
        backupPassword
      );

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `congre-admin-backup-${user?.username}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess('✓ Respaldo descargado exitosamente');
      setBackupPassword('');
      setBackupPasswordConfirm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear respaldo');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text) as MasterKeyBackup;
      
      if (!data.version || !data.wrapped_mk || !data.username) {
        throw new Error('Archivo de respaldo inválido');
      }
      
      setRestoreFile(data);
      setError(null);
    } catch (err) {
      setError('Error al leer el archivo: formato inválido');
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      setError('Seleccione un archivo de respaldo');
      return;
    }
    if (!restorePassword) {
      setError('Ingrese la contraseña de respaldo');
      return;
    }
    if (!apiUrl || !sessionToken) {
      setError('No hay sesión activa');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const restored = await restoreMasterKeyBackup(restoreFile, restorePassword);

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateUser',
          sessionToken,
          payload: {
            id: user?.id,
            wrapped_mk: restored.wrapped_mk
          }
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al restaurar respaldo');
      }

      setSuccess('✓ Respaldo restaurado exitosamente. Su clave maestra ha sido actualizada.');
      setRestoreFile(null);
      setRestorePassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restaurar respaldo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Respaldo de clave maestra
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Exporte su clave maestra cifrada para crear un respaldo de seguridad, 
        o restaure un respaldo previamente guardado
      </Typography>

      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab icon={<Download />} label="Exportar" />
          <Tab icon={<Restore />} label="Restaurar" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <>
              <Alert severity="warning" sx={{ mb: 3 }}>
                Use una contraseña diferente a su contraseña de acceso. 
                Sin esta contraseña no podrá restaurar el respaldo.
              </Alert>

              <TextField
                fullWidth
                label="Contraseña de Respaldo"
                type={showBackupPassword ? 'text' : 'password'}
                value={backupPassword}
                onChange={(e) => setBackupPassword(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowBackupPassword(!showBackupPassword)} edge="end">
                        {showBackupPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                fullWidth
                label="Confirmar Contraseña"
                type={showBackupPassword ? 'text' : 'password'}
                value={backupPasswordConfirm}
                onChange={(e) => setBackupPasswordConfirm(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleExport}
                disabled={loading}
                startIcon={<Download />}
              >
                {loading ? <CircularProgress size={24} /> : 'Descargar Respaldo'}
              </Button>
            </>
          )}

          {activeTab === 1 && (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                Seleccione un archivo de respaldo (.json) e ingrese la contraseña 
                que usó al crear el respaldo.
              </Alert>

              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <Button
                fullWidth
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                startIcon={<Upload />}
                sx={{ mb: 3 }}
              >
                {restoreFile ? restoreFile.username : 'Seleccionar Archivo'}
              </Button>

              {restoreFile && (
                <>
                  <TextField
                    fullWidth
                    label="Contraseña de Respaldo"
                    type={showRestorePassword ? 'text' : 'password'}
                    value={restorePassword}
                    onChange={(e) => setRestorePassword(e.target.value)}
                    sx={{ mb: 3 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowRestorePassword(!showRestorePassword)} edge="end">
                            {showRestorePassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Advertencia: Esta acción reemplazará su clave maestra actual 
                    con la del respaldo.
                  </Alert>
                  <Button
                    fullWidth
                    variant="contained"
                    color="warning"
                    onClick={handleRestore}
                    disabled={loading}
                    startIcon={<Restore />}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Restaurar Respaldo'}
                  </Button>
                </>
              )}
            </>
          )}
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
    </Box>
  );
}
