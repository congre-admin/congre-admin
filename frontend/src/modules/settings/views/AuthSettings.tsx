import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel
} from '@mui/material';
import {
  Fingerprint,
  Security,
  Delete,
  Add,
  Key,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../../core/context/AuthContext';

const API_URL_KEY = 'congre_admin_api_url';

async function fetchApi(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    mode: 'cors',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
      ...options?.headers,
    },
  });
  return response.json();
}

export default function AuthSettings() {
  const navigate = useNavigate();
  const { user, sessionToken, logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [methods, setMethods] = useState<string[]>([]);
  const [defaultMethod, setDefaultMethod] = useState('passkey');
  const [passkeys, setPasskeys] = useState<Array<{id: string; device_name?: string; created_at?: string}>>([]);
  const [totpEnabled, setTotpEnabled] = useState(false);
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadAuthSettings();
  }, []);

  const loadAuthSettings = async () => {
    if (!sessionToken || !user) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = localStorage.getItem(API_URL_KEY);
      if (!apiUrl) {
        throw new Error('API URL no configurada');
      }
      
      const data = await fetchApi(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'getAuthMethods',
          sessionToken,
          payload: {}
        })
      });
      
      if (data.success) {
        setMethods(data.methods || []);
        setDefaultMethod(data.defaultMethod || 'passkey');
        setPasskeys(data.passkeys || []);
        setTotpEnabled(data.totp?.enabled || false);
      } else {
        setError(data.error || 'Error al cargar configuraciiónn');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar configuraciiónn');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultMethod = async (method: string) => {
    setSaving(true);
    setError(null);
    
    try {
      const apiUrl = localStorage.getItem(API_URL_KEY);
      if (!apiUrl) throw new Error('API URL no configurada');
      
      const data = await fetchApi(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateAuthConfig',
          sessionToken,
          payload: { default_method: method }
        })
      });
      
      if (data.success) {
        setDefaultMethod(method);
        setSuccess('Método predeterminado actualizado');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Error al actualizar');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    if (!confirm('¿Estás seguro de eliminar este passkey?')) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const apiUrl = localStorage.getItem(API_URL_KEY);
      if (!apiUrl) throw new Error('API URL no configurada');
      
      const data = await fetchApi(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'deletePasskey',
          sessionToken,
          payload: { passkeyId }
        })
      });
      
      if (data.success) {
        setPasskeys(passkeys.filter(p => p.id !== passkeyId));
        setMethods(methods.filter(m => m !== 'passkey' || passkeys.length > 1));
        setSuccess('Passkey eliminado');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Error al eliminar passkey');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar passkey');
    } finally {
      setSaving(false);
    }
  };

  const handleDisableTOTP = async () => {
    if (!confirm('¿Estás seguro de desactivar la autenticación TOTP?')) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const apiUrl = localStorage.getItem(API_URL_KEY);
      if (!apiUrl) throw new Error('API URL no configurada');
      
      const data = await fetchApi(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'disableTOTP',
          sessionToken,
          payload: {}
        })
      });
      
      if (data.success) {
        setTotpEnabled(false);
        setMethods(methods.filter(m => m !== 'totp'));
        setSuccess('TOTP desactivado');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Error al desactivar TOTP');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al desactivar TOTP');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Complete todos los campos');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      const apiUrl = localStorage.getItem(API_URL_KEY);
      if (!apiUrl) throw new Error('API URL no configurada');
      
      const data = await fetchApi(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'changePassword',
          sessionToken,
          payload: { old_password: oldPassword, new_password: newPassword }
        })
      });
      
      if (data.success) {
        setPasswordSuccess(true);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.error || 'Error al cambiar contraseña');
      }
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Error al cambiar contraseña');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setError('Ingrese su contraseña');
      return;
    }
    
    setDeleteLoading(true);
    setError(null);
    
    try {
      const apiUrl = localStorage.getItem(API_URL_KEY);
      if (!apiUrl) throw new Error('API URL no configurada');
      
      const data = await fetchApi(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'deleteAccount',
          sessionToken,
          payload: { password: deletePassword }
        })
      });
      
      if (data.success) {
        logout();
      } else {
        setError(data.error || 'Error al eliminar cuenta');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cuenta');
    } finally {
      setDeleteLoading(false);
    }
  };

  const navigateToSetupPasskey = () => {
    navigate('/admin/setup-passkey');
  };

  const navigateToSetupTOTP = () => {
    navigate('/admin/setup-totp');
  };

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
        Configuración de autenticación
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Gestioná la autenticación y seguridad de tu cuenta.
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
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Fingerprint color="primary" />
          Métodos de autenticación
        </Typography>

        <List>
          <ListItem sx={{ px: 0 }}>
            <ListItemText
              primary="Passkeys"
              secondary={`${passkeys.length} dispositivo(s) configurado(s)`}
            />
            <ListItemSecondaryAction>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {passkeys.map((passkey, index) => (
                  <Chip
                    key={passkey.id}
                    icon={<Fingerprint />}
                    label={passkey.device_name ? `${passkey.device_name}` : `Passkey ${index + 1}`}
                    size="small"
                    onDelete={() => handleDeletePasskey(passkey.id)}
                    deleteIcon={<Delete />}
                    title={passkey.created_at ? `Creado: ${new Date(passkey.created_at).toLocaleDateString()}` : undefined}
                  />
                ))}
                <IconButton onClick={navigateToSetupPasskey} color="primary">
                  <Add />
                </IconButton>
              </Box>
            </ListItemSecondaryAction>
          </ListItem>
          
          <Divider />
          
          <ListItem sx={{ px: 0 }}>
            <ListItemText
              primary="Aplicación de autenticación (TOTP)"
              secondary={totpEnabled ? 'Configurado' : 'No configurado'}
            />
            <ListItemSecondaryAction>
              {totpEnabled ? (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip icon={<CheckCircle />} label="Activo" color="success" size="small" />
                  <IconButton 
                    onClick={handleDisableTOTP} 
                    color="error" 
                    size="small"
                    disabled={saving}
                    title="Desactivar TOTP"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ) : (
                <Button variant="outlined" size="small" onClick={navigateToSetupTOTP}>
                  Configurar
                </Button>
              )}
            </ListItemSecondaryAction>
          </ListItem>
          
          <Divider />
          
          <ListItem sx={{ px: 0 }}>
            <ListItemText
              primary="Código enviado por email (autenticación de dos factores)"
              secondary="Siempre activo. Requerido para autenticación."
            />
            <ListItemSecondaryAction>
              <Chip icon={<CheckCircle />} label="Activo" color="success" size="small" />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security color="primary" />
          Método predeterminado
        </Typography>
        
        <RadioGroup
          value={defaultMethod}
          onChange={(e) => handleSetDefaultMethod(e.target.value)}
        >
          {methods.includes('passkey') && (
            <FormControlLabel value="passkey" control={<Radio />} label="Passkey (recomendado)" />
          )}
          {methods.includes('totp') && (
            <FormControlLabel value="totp" control={<Radio />} label="Aplicación de autenticación" />
          )}
          {methods.includes('email_otp') && (
            <FormControlLabel value="email_otp" control={<Radio />} label="Código por email" />
          )}
        </RadioGroup>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Key color="primary" />
          Cambiar contraseña
        </Typography>
        
        {passwordSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Contraseña cambiada correctamente
          </Alert>
        )}
        
        {passwordError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError(null)}>
            {passwordError}
          </Alert>
        )}
        
        <TextField
          fullWidth
          type="password"
          label="Contraseña actual"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          type="password"
          label="Nueva contraseña"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          sx={{ mb: 2 }}
          helperText="Mínimo 8 caracteres"
        />
        <TextField
          fullWidth
          type="password"
          label="Confirmá la nueva contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleChangePassword}
          disabled={passwordLoading}
        >
          {passwordLoading ? <CircularProgress size={24} /> : 'Cambiar contraseña'}
        </Button>
      </Paper>

      <Paper sx={{ p: 3, border: 1, borderColor: 'error.main' }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <Warning color="error" />
          Zona de Peligro
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Si eliminás tu cuenta es irreversible. Todos los datos serán eliminados permanentemente.
        </Typography>
        
        <Button
          variant="outlined"
          color="error"
          onClick={() => setDeleteDialogOpen(true)}
          startIcon={<Delete />}
        >
          Eliminar mi cuenta
        </Button>
      </Paper>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>
          ¿Estás seguro de eliminar tu cuenta?
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Esta acción es irreversible. Todos los datos serán eliminados permanentemente.
          </Alert>
          <TextField
            fullWidth
            type="password"
            label="Ingresá tu contraseña para confirmar"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={deleteLoading || !deletePassword}
          >
            {deleteLoading ? <CircularProgress size={24} /> : 'Eliminar cuenta'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
