import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Person, 
  Lock, 
  Settings, 
  Cloud, 
  TableChart, 
  Email,
  Security,
  Fingerprint,
  MoreVert,
  Key,
  RestartAlt,
  RocketLaunch
} from '@mui/icons-material';
import { useAuth } from '../../../../core/context/AuthContext';
import { authService } from '../../../../services/authService';
import { dataService } from '../../../../services/dataService';
import { getAllConfigs, getConfig, setConfig } from '../../../../utils/settingsCache';

// Config prefixes
const PUBLIC_PREFIX = 'congre_public_';
const CORE_PREFIX = 'congre_core_';

async function getCongregationName(apiUrl: string | null, ssId: string | null): Promise<string> {
  if (!apiUrl || !ssId) return 'CongreAdmin';
  try {
    const url = apiUrl.includes('script.google.com') 
      ? apiUrl.endsWith('/exec') ? apiUrl : `${apiUrl}/exec`
      : `https://script.google.com/macros/s/${apiUrl}/exec`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getData', sheet: 'Configuracion', ssId }),
      mode: 'cors',
      redirect: 'follow',
    });
    const result = await response.json();
    const rows = result.data || [];
    const nombre = rows.find((r: any) => r.clave === 'nombre_mostrar')?.valor || rows.find((r: any) => r.clave === 'nombre_congregacion')?.valor;
    return nombre || 'CongreAdmin';
  } catch {
    return 'CongreAdmin';
  }
}

type AuthStep = 'password' | 'method' | 'totp' | 'email_otp' | 'passkey';

const METHOD_LABELS: Record<string, string> = {
  passkey: 'Passkey (Huella/Face ID)',
  totp: 'Aplicación autenticadora (TOTP)',
  email_otp: 'Código por email'
};

const METHOD_ICONS: Record<string, any> = {
  passkey: Fingerprint,
  totp: Security,
  email_otp: Email
};

export default function Login() {
  const navigate = useNavigate();
  const { login, setSession } = useAuth();
  
  const [hasConfig, setHasConfig] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [gasUrl, setGasUrl] = useState('');
  const [coreSsId, setCoreSsId] = useState('');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<AuthStep>('password');
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [defaultMethod, setDefaultMethod] = useState<string>('passkey');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [defaultMethodStep, setDefaultMethodStep] = useState<AuthStep | null>(null);
  const [showMethodSelection, setShowMethodSelection] = useState(false);
  const [congregationName, setCongregationName] = useState('CongreAdmin');

  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [showConfigFields, setShowConfigFields] = useState(false);
  
  // Dialog states
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [newInstallDialogOpen, setNewInstallDialogOpen] = useState(false);

  useEffect(() => {
    // Get config from localStorage using the new naming convention
    const publicConfigs = getAllConfigs(true);
    const coreConfigs = getAllConfigs(false);
    
    // API URL: check gas_url in public first, then core
    let storedGasUrl = publicConfigs.gas_url || coreConfigs.gas_url;
    // SS ID: check ss_core in public first, then core
    let storedSsId = publicConfigs.ss_core || coreConfigs.ss_core;
    
    const hasConfig = !!(storedGasUrl && storedSsId);
    setHasConfig(hasConfig);
    if (storedGasUrl) setGasUrl(storedGasUrl);
    if (storedSsId) setCoreSsId(storedSsId);
    setShowConfig(!hasConfig);
    
    // Get congregation name from localStorage (no API call)
    const storedName = publicConfigs.nombre_mostrar || coreConfigs.nombre_mostrar;
    if (storedName) {
      setCongregationName(storedName);
    }
  }, []);

  const getStatusMessage = () => {
    if (loading) {
      switch (step) {
        case 'password': return 'Verificando credenciales...';
        case 'method': return 'Verificando métodos disponibles...';
        case 'totp': return 'Verificando código TOTP...';
        case 'email_otp': return 'Verificando código...';
        case 'passkey': return 'Autenticando con passkey...';
      }
    }
    if (defaultMethodStep === 'passkey' && !loading) {
      return 'Esperando autenticación con passkey...';
    }
    return null;
  };

  const handleSaveConfig = () => {
    if (!gasUrl.trim()) {
      setError('Ingresá la URL del Google Apps Script');
      return;
    }
    if (!coreSsId.trim()) {
      setError('Ingresá el ID de la hoja de cálculo');
      return;
    }
    setConfig('gas_url', gasUrl.trim(), true);
    setConfig('ss_core', coreSsId.trim(), true);
    setHasConfig(true);
    setShowConfig(false);
    setError(null);
  };

  const handleClearConfig = () => {
    localStorage.removeItem(`${PUBLIC_PREFIX}gas_url`);
    localStorage.removeItem(`${PUBLIC_PREFIX}ss_core`);
    localStorage.removeItem(`${CORE_PREFIX}gas_url`);
    localStorage.removeItem(`${CORE_PREFIX}ss_core`);
    localStorage.removeItem('congre_admin_session_token');
    localStorage.removeItem('congre_admin_user_data');
    setHasConfig(false);
    setShowConfig(true);
    setGasUrl('');
    setCoreSsId('');
    setUsername('');
    setPassword('');
  };

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleResetData = () => {
    handleMenuClose();
    setResetDialogOpen(true);
  };

  const handleConfirmReset = () => {
    localStorage.clear();
    // Clear cookies
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    setResetDialogOpen(false);
    window.location.reload();
  };

  const handleNewInstall = () => {
    handleMenuClose();
    setNewInstallDialogOpen(true);
  };

  const handleConfirmNewInstall = () => {
    setNewInstallDialogOpen(false);
    localStorage.clear();
    navigate('/admin/setup');
  };

  const handlePasswordStep = async () => {
    if (!username.trim()) {
      setError('Ingresá tu usuario');
      return;
    }
    if (!password) {
      setError('Ingresá tu contraseña');
      return;
    }

    const apiUrl = getConfig('gas_url');
    if (!apiUrl) {
      setShowConfig(true);
      setError('Tenés que configurar la conexión primero');
      return;
    }

    dataService.setApiUrl(apiUrl);

    setLoading(true);
    setError(null);

    try {
      const data = await authService.loginWithPassword(username, password);

      if (!data.success) {
        if (data.requiresSetup) {
          sessionStorage.setItem('totp_setup_user', username);
          sessionStorage.setItem('totp_setup_pass', password);
          navigate('/admin/setup-totp');
          return;
        }
        if (data.step === 'method') {
          setAvailableMethods(data.availableMethods || []);
          const defaultM = data.defaultMethod || 'passkey';
          setDefaultMethod(defaultM);
          setDefaultMethodStep(defaultM as AuthStep);
          setShowMethodSelection(false);
          handleMethodSelect(defaultM);
          return;
        }
        if (data.step === 'email_otp' || data.step === 'totp' || data.step === 'passkey') {
          setAvailableMethods(data.availableMethods || []);
          setStep(data.step);
          if (data.message) setError(data.message);
          return;
        }
        throw new Error(data.error || 'Error al verificar credenciales');
      }

      setSession(data.sessionToken, data.user, data.wrapped_mk);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el login');
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSelect = async (method: string) => {
    if (method === 'passkey') {
      await handlePasskeyLogin();
    } else if (method === 'email_otp') {
      const apiUrl = getConfig('gas_url');
      if (!apiUrl) {
        setError('API URL no configurada');
        return;
      }
      dataService.setApiUrl(apiUrl);
      
      setLoading(true);
      setStep('email_otp');
      setError(null);
      setDefaultMethodStep('email_otp');
      setShowMethodSelection(false);
      try {
        const result = await dataService.request<{ success: boolean; error?: string; debug?: { email?: string; error?: string } }>('requestOTP', { username });
        if (result.success) {
          setCode('');
          setError('Código enviado a ' + (result.debug?.email || username));
        } else {
          setError(result.debug?.error || result.error || 'Error al enviar código');
        }
      } catch (err: any) {
        setError(err.message || 'Error al enviar código');
      } finally {
        setLoading(false);
      }
    } else if (method === 'totp') {
      setStep('totp');
      setCode('');
      setDefaultMethodStep('totp');
      setShowMethodSelection(false);
      setError(null);
    }
  };

  const handleShowMethodSelection = () => {
    setDefaultMethodStep(null);
    setShowMethodSelection(true);
    setStep('method');
    setError(null);
  };

  const handleCodeSubmit = async () => {
    if (!code.trim()) {
      setError('Ingresá el código');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const method = step === 'totp' ? 'totp' : 'email_otp';
      
      const data = step === 'totp'
        ? await authService.loginWithTOTP(username, code, password)
        : await authService.loginWithEmailOTP(username, code, password);

      if (!data.success) {
        throw new Error(data.error || 'Código inválido');
      }

      setSession(data.sessionToken, data.user, data.wrapped_mk);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el login');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    setError(null);
    setStep('passkey');

    try {
      const apiUrl = getConfig('gas_url');
      if (!apiUrl) {
        throw new Error('API URL no configurada');
      }

      dataService.setApiUrl(apiUrl);

      const challengeData = await dataService.request<{ success: boolean; error?: string; challenge?: string; rpId?: string; timeout?: number; allowCredentials?: Array<{ id: string; type: string }>; userVerification?: string }>('challenge', {
        username,
        origin: window.location.origin
      });

      if (!challengeData.success) {
        throw new Error(challengeData.error || 'Error al obtener desafío');
      }

      const publicKey: PublicKeyCredentialRequestOptions = {
        challenge: Uint8Array.from(atob(challengeData.challenge!), c => c.charCodeAt(0)),
        rpId: challengeData.rpId || 'localhost',
        timeout: challengeData.timeout || 60000,
        allowCredentials: challengeData.allowCredentials?.map((cred) => ({
          id: base64UrlToUint8Array(cred.id) as BufferSource,
          type: 'public-key' as const
        })) || [],
        userVerification: (challengeData.userVerification || 'preferred') as UserVerificationRequirement
      };

      let credential: PublicKeyCredential | null = null;
      
      // Check WebAuthn support - be more robust
      // Use window.credentials which is the global reference
      const creds = (window as any).credentials || (navigator as any).credentials;
      const hasWebAuthn = creds && typeof creds.get === 'function';
      
      // Additional check: WebAuthn requires secure context (HTTPS or localhost)
      const isSecureContext = window.isSecureContext || (window.location.protocol === 'https:') || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      
      if (!hasWebAuthn || !isSecureContext) {
        console.error('WebAuthn not supported:', { 
          windowCredentials: !!(window as any).credentials,
          navigatorCredentials: !!creds,
          getFn: typeof creds?.get,
          isSecureContext,
          location: window.location.href
        });
        if (!isSecureContext) {
          throw new Error('WebAuthn requiere contexto seguro (HTTPS o localhost). URL actual: ' + window.location.href);
        }
        throw new Error('WebAuthn no disponible en este navegador. Use Chrome, Edge o Firefox.');
      }
      
      console.log('Passkey challenge:', { rpId: challengeData.rpId, allowCredentials: challengeData.allowCredentials });
      
      try {
        credential = await creds.get({ publicKey }) as PublicKeyCredential;
      } catch (webAuthnErr) {
        console.error('WebAuthn error:', webAuthnErr);
        throw new Error('Error al usar passkey. ¿Canceló la autenticación?');
      }

      if (!credential) {
        throw new Error('No se pudo completar la autenticación con passkey');
      }

      const assertionResponse = credential as any;
      
      const passkeyAssertion = {
        credentialId: credential.id,
        clientDataJSON: arrayBufferToBase64(assertionResponse.response.clientDataJSON),
        signature: arrayBufferToBase64(assertionResponse.response.signature),
        authenticatorData: arrayBufferToBase64(assertionResponse.response.authenticatorData)
      };

      const data = await authService.loginWithPasskey(username, passkeyAssertion, password);

      if (!data.success) {
        throw new Error(data.error || 'Error al verificar passkey');
      }

      setSession(data.sessionToken, data.user, data.wrapped_mk);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el login con passkey');
      setDefaultMethodStep(null);
      setShowMethodSelection(true);
      setStep('method');
    } finally {
      setLoading(false);
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const base64UrlToUint8Array = (base64Url: string): Uint8Array => {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const binary = atob(paddedBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const handleBackToMethod = () => {
    setStep('method');
    setCode('');
    setError(null);
  };

  const handleBackToPassword = () => {
    setStep('password');
    setCode('');
    setError(null);
  };

  const handleSetupAuth = (type: 'totp' | 'passkey') => {
    if (type === 'totp') {
      sessionStorage.setItem('totp_setup_user', username);
      sessionStorage.setItem('totp_setup_pass', password);
      navigate('/admin/setup-totp');
    } else {
      sessionStorage.setItem('passkey_setup_user', username);
      sessionStorage.setItem('passkey_setup_pass', password);
      navigate('/admin/setup-passkey');
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      setError('Ingresá tu email o nombre de usuario');
      return;
    }

    setForgotPasswordLoading(true);
    setError(null);

    try {
      await authService.requestPasswordReset(forgotPasswordEmail.trim());
      setForgotPasswordSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar restablecimiento');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setForgotPasswordOpen(false);
    setForgotPasswordEmail('');
    setForgotPasswordSuccess(false);
    setError(null);
  };

  const getStepTitle = () => {
    switch (step) {
      case 'password': return 'Iniciar sesión';
      case 'method': return 'Seleccione método';
      case 'totp': return 'Código TOTP';
      case 'email_otp': return 'Código del email';
      case 'passkey': return 'Autenticación';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'password': return 'Ingresá tus credenciales';
      case 'method': return 'Elegí cómo verificar tu identidad';
      case 'totp': return 'Ingresá el código de tu app autenticadora';
      case 'email_otp': return 'Revisá tu bandeja de entrada';
      case 'passkey': return 'Usá tu dispositivo para autenticarte';
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
        sx={{ p: 4, maxWidth: 420, width: '100%' }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          {congregationName}
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 3 }}>
          {getStepTitle()}
        </Typography>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Status Message */}
        {getStatusMessage() && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {getStatusMessage()}
          </Alert>
        )}

        {/* Main Login Form */}
        {step === 'password' && (
          <>
            <TextField
              fullWidth
              label="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
              autoFocus
              autoComplete="username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handlePasswordStep}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Iniciar sesión'}
            </Button>
          </>
        )}

        {/* Más Opciones Menu */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="text"
            size="small"
            onClick={handleMenuOpen}
            startIcon={<MoreVert />}
          >
            Más opciones
          </Button>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => { handleMenuClose(); setForgotPasswordOpen(true); }}>
              <ListItemIcon><Key fontSize="small" /></ListItemIcon>
              <ListItemText>Recuperar contraseña</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); setShowConfigFields(!showConfigFields); }}>
              <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
              <ListItemText>Cambiar datos de conexión</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleResetData}>
              <ListItemIcon><RestartAlt fontSize="small" /></ListItemIcon>
              <ListItemText>Reestablecer datos de conexión</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleNewInstall}>
              <ListItemIcon><RocketLaunch fontSize="small" /></ListItemIcon>
              <ListItemText>Desplegar instalación nueva</ListItemText>
            </MenuItem>
          </Menu>
        </Box>

        {/* Config Fields (toggled from menu) */}
        <Collapse in={showConfigFields || !hasConfig}>
          <Box sx={{ mt: 2, mb: 2 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Configuración de conexión
            </Typography>
            <TextField
              fullWidth
              label="URL del Google Apps Script"
              placeholder="https://script.google.com/macros/s/..."
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Cloud />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="ID de hoja de cálculo (Core)"
              placeholder="1abc123..."
              value={coreSsId}
              onChange={(e) => setCoreSsId(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TableChart />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                if (!gasUrl.trim()) {
                  setError('Ingresá la URL del Google Apps Script');
                  return;
                }
                if (!coreSsId.trim()) {
                  setError('Ingresá el ID de la hoja de cálculo');
                  return;
                }
                setConfig('gas_url', gasUrl.trim(), true);
                setConfig('ss_core', coreSsId.trim(), true);
                setHasConfig(true);
                setShowConfigFields(false);
                setError(null);
              }}
              disabled={loading}
              startIcon={<Settings />}
            >
              Guardar configuración
            </Button>
          </Box>
        </Collapse>

        {step === 'method' && showMethodSelection && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {getStepSubtitle()}
            </Typography>
            
            <List sx={{ mb: 2 }}>
              {availableMethods.map((method) => {
                const Icon = METHOD_ICONS[method] || Security;
                return (
                  <ListItemButton
                    key={method}
                    onClick={() => handleMethodSelect(method)}
                    sx={{ borderRadius: 1, mb: 1, border: 1, borderColor: 'divider' }}
                  >
                    <ListItemIcon>
                      <Icon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={METHOD_LABELS[method] || method} 
                      secondary={method === defaultMethod ? 'Recomendado' : null}
                    />
                  </ListItemButton>
                );
              })}
            </List>

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              ¿No tiene configured ningún método?
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {availableMethods.includes('totp') === false && (
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => handleSetupAuth('totp')}
                >
                  Configurar TOTP
                </Button>
              )}
              {availableMethods.includes('passkey') === false && (
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => handleSetupAuth('passkey')}
                >
                  Configurar Passkey
                </Button>
              )}
            </Box>

            <Button
              variant="text"
              onClick={handleBackToPassword}
              sx={{ mt: 2 }}
              fullWidth
            >
              Atrás
            </Button>
          </>
        )}

        {(step === 'totp' || step === 'email_otp') && defaultMethodStep && !showMethodSelection && (
          <>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Button variant="outlined" onClick={handleShowMethodSelection}>
                Cambiar método
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {getStepSubtitle()}
            </Typography>
            <TextField
              fullWidth
              label="Código"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 6 }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleBackToMethod}
                disabled={loading}
              >
                Atrás
              </Button>
              <Button
                variant="contained"
                onClick={handleCodeSubmit}
                disabled={loading}
                sx={{ flex: 1 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Verificar'}
              </Button>
            </Box>
            {step === 'email_otp' && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={async () => {
                    try {
                      const result = await dataService.request<{ success: boolean; error?: string; debug?: { email?: string; error?: string } }>('requestOTP', { username });
                      if (result.success) {
                        setError('Nuevo código enviado a ' + (result.debug?.email || username));
                      } else {
                        setError((result.debug?.error || result.error) + (result.debug?.email ? ' (' + result.debug.email + ')' : ''));
                      }
                    } catch (err: any) {
                      setError(err.message || 'Error al reenviar código');
                    }
                  }}
                  sx={{ cursor: 'pointer' }}
                >
                  ¿No recibió el código? Reenviar
                </Link>
              </Box>
            )}
          </>
        )}

        {step === 'email_otp' && !defaultMethodStep && (
          <>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Button variant="outlined" onClick={handleShowMethodSelection}>
                Cambiar método
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {getStepSubtitle()}
            </Typography>
            <TextField
              fullWidth
              label="Código"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 6 }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleBackToMethod}
                disabled={loading}
              >
                Atrás
              </Button>
              <Button
                variant="contained"
                onClick={handleCodeSubmit}
                disabled={loading}
                sx={{ flex: 1 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Verificar'}
              </Button>
            </Box>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link
                component="button"
                variant="body2"
                onClick={async () => {
                  try {
                    const result = await dataService.request<{ success: boolean; error?: string; debug?: { email?: string; error?: string } }>('requestOTP', { username });
                    if (result.success) {
                      setError('Nuevo código enviado a ' + (result.debug?.email || username));
                    } else {
                      setError((result.debug?.error || result.error) + (result.debug?.email ? ' (' + result.debug.email + ')' : ''));
                    }
                  } catch (err: any) {
                    setError(err.message || 'Error al reenviar código');
                  }
                }}
                sx={{ cursor: 'pointer' }}
              >
                ¿No recibió el código? Reenviar
              </Link>
            </Box>
          </>
        )}

        {step === 'passkey' && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {loading ? (
              <>
                <CircularProgress sx={{ mb: 3 }} />
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Esperando autenticación con passkey...
                </Typography>
              </>
            ) : (
              <>
                <Fingerprint sx={{ fontSize: 64, mb: 2, color: 'primary.main' }} />
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Usá tu passkey para autenticarte
                </Typography>
              </>
            )}
            {defaultMethodStep && !showMethodSelection && (
              <Button 
                variant="outlined" 
                onClick={handleShowMethodSelection}
              >
                Cambiar método
              </Button>
            )}
          </Box>
        )}

        <Dialog open={forgotPasswordOpen} onClose={handleCloseForgotPassword} maxWidth="sm" fullWidth>
          <DialogTitle>Restablecer Contraseña</DialogTitle>
          <DialogContent>
            {forgotPasswordSuccess ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Si el usuario existe, recibirás un email con instrucciones para restablecer tu contraseña.
                </Typography>
                <Button variant="contained" onClick={handleCloseForgotPassword}>
                  Cerrar
                </Button>
              </Box>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Ingresá tu email o nombre de usuario y te vamos a enviar instrucciones para restablecer tu contraseña.
                </Typography>
                <TextField
                  fullWidth
                  label="Email o Usuario"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
              </>
            )}
          </DialogContent>
          {!forgotPasswordSuccess && (
            <DialogActions>
              <Button onClick={handleCloseForgotPassword}>Cancelar</Button>
              <Button 
                onClick={handleForgotPassword} 
                variant="contained"
                disabled={forgotPasswordLoading}
              >
                {forgotPasswordLoading ? <CircularProgress size={24} /> : 'Enviar'}
              </Button>
            </DialogActions>
          )}
        </Dialog>

        {/* Reset Data Dialog */}
        <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Restablecer datos de conexión</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Esta acción borrará todos los datos almacenados en este navegador, incluyendo sesión, configuración y credenciales guardadas. ¿Está seguro?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmReset} variant="contained" color="warning">
              Restablecer
            </Button>
          </DialogActions>
        </Dialog>

        {/* New Install Dialog */}
        <Dialog open={newInstallDialogOpen} onClose={() => setNewInstallDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Desplegar instalación nueva</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Esta acción borrará todos los datos y mostrará el asistente de configuración. ¿Está seguro de que desea continuar?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewInstallDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmNewInstall} variant="contained" color="primary">
              Desplegar
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}
