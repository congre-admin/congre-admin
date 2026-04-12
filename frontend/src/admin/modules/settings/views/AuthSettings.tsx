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
import { useAuthMethods } from '@/hooks/useSession';
import { authService } from '@/services/authService';
import { dataService } from '@/services/dataService';
import { useQueryClient } from '@tanstack/react-query';
import Page from '@/admin/core/components/Page';

export default function AuthSettings() {
  const navigate = useNavigate();
  const { user, sessionToken, logout } = useAuth();
  const { data: authData, isLoading: authLoading } = useAuthMethods();
  const queryClient = useQueryClient();
  
  const methods = authData?.methods || [];
  const defaultMethod = authData?.defaultMethod || 'passkey';
  const passkeys = authData?.passkeys || [];
  const totpEnabled = authData?.totp?.enabled || false;
  
  const [selectedMethod, setSelectedMethod] = useState(defaultMethod);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loading = authLoading || !sessionToken || !user;

  useEffect(() => {
    if (defaultMethod) setSelectedMethod(defaultMethod);
  }, [defaultMethod]);

  const handleSetDefaultMethod = async (method: string) => {
    setSaving(true);
    setError(null);
    
    try {
      await authService.setDefaultAuthMethod(method);
      queryClient.invalidateQueries({ queryKey: ['authMethods'] });
      setSuccess('Método predeterminado actualizado');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    if (!confirm('¿Está seguro de eliminar este passkey?')) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await authService.deletePasskey(passkeyId);
      queryClient.invalidateQueries({ queryKey: ['authMethods'] });
      setSuccess('Passkey eliminado');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar passkey');
    } finally {
      setSaving(false);
    }
  };

  const handleDisableTOTP = async () => {
    if (!confirm('¿Está seguro de desactivar la autenticación TOTP?')) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await dataService.request('disableTOTP', {});
      queryClient.invalidateQueries({ queryKey: ['authMethods'] });
      setSuccess('TOTP desactivado');
      setTimeout(() => setSuccess(null), 3000);
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
      await authService.changePassword(oldPassword, newPassword);
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
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
      await dataService.request('deleteAccount', { password: deletePassword });
      logout();
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
      <Page title="Configuración de autenticación" loading={true}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  return (
    <Page
      title="Configuración de autenticación"
      subtitle="Gestione sus métodos de autenticación y seguridad de cuenta"
    >
      <Box sx={{ maxWidth: 800 }}>
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
          Métodos de Autenticación
        </Typography>

        <List>
          <ListItem sx={{ px: 0 }}>
            <ListItemText
              primary="Passkeys"
              secondary={`${passkeys.length} dispositivo(s) configurado(s)`}
            />
            <ListItemSecondaryAction>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {passkeys.map((passkey) => (
                  <Chip
                    key={passkey.id}
                    icon={<Fingerprint />}
                    label={passkey.deviceName || 'Passkey'}
                    size="small"
                    onDelete={() => handleDeletePasskey(passkey.id)}
                    deleteIcon={<Delete />}
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
              primary="Aplicación Autenticadora (TOTP)"
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
              primary="Código por Email (2FA)"
              secondary="Siempre activo - requerido para autenticación"
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
          Método Predeterminado
        </Typography>
        
        <RadioGroup
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
        >
          {methods.includes('passkey') && (
            <FormControlLabel value="passkey" control={<Radio />} label="Passkey (Huella/Face ID) - Recomendado" />
          )}
          {methods.includes('totp') && (
            <FormControlLabel value="totp" control={<Radio />} label="Aplicación autenticadora (TOTP)" />
          )}
          {methods.includes('email_otp') && (
            <FormControlLabel value="email_otp" control={<Radio />} label="Código por email" />
          )}
        </RadioGroup>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={() => handleSetDefaultMethod(selectedMethod)}
            disabled={saving || selectedMethod === defaultMethod}
          >
            Guardar
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Key color="primary" />
          Cambiar Contraseña
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
          label="Confirmar nueva contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleChangePassword}
          disabled={passwordLoading}
        >
          {passwordLoading ? <CircularProgress size={24} /> : 'Cambiar Contraseña'}
        </Button>
      </Paper>

      <Paper sx={{ p: 3, border: 1, borderColor: 'error.main' }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <Warning color="error" />
          Zona de Peligro
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Eliminar su cuenta es irreversible. Todos sus datos serán eliminados permanentemente.
        </Typography>
        
        <Button
          variant="outlined"
          color="error"
          onClick={() => setDeleteDialogOpen(true)}
          startIcon={<Delete />}
        >
          Eliminar Mi Cuenta
        </Button>
      </Paper>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>
          ¿Está seguro de eliminar su cuenta?
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Esta acción es irreversible. Todos sus datos serán eliminados permanentemente.
          </Alert>
          <TextField
            fullWidth
            type="password"
            label="Ingrese su contraseña para confirmar"
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
            {deleteLoading ? <CircularProgress size={24} /> : 'Eliminar Cuenta'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </Page>
  );
}
