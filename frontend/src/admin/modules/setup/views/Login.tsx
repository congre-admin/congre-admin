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
  DialogActions
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
  Fingerprint
} from '@mui/icons-material';
import { useAuth } from '../../../core/context/AuthContext';
import { authService } from '../../../../services/authService';
import { dataService } from '../../../../services/dataService';

const API_URL_KEY = 'congre_admin_api_url';
const SS_ID_KEY = 'congre_admin_ss_id';

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
  const [hasAutocompleteSubmitted, setHasAutocompleteSubmitted] = useState(false);
  const [defaultMethodStep, setDefaultMethodStep] = useState<AuthStep | null>(null);
  const [showMethodSelection, setShowMethodSelection] = useState(false);
  const [congregationName, setCongregationName] = useState('CongreAdmin');

  useEffect(() => {
    const storedGasUrl = localStorage.getItem(API_URL_KEY);
    const storedSsId = localStorage.getItem(SS_ID_KEY);
    const hasConfig = !!(storedGasUrl && storedSsId);
    setHasConfig(hasConfig);
    if (storedGasUrl) setGasUrl(storedGasUrl);
    if (storedSsId) setCoreSsId(storedSsId);
    setShowConfig(!hasConfig);
    
    getCongregationName(storedGasUrl, storedSsId).then(setCongregationName);
  }, []);

  useEffect(() => {
    if (username && password && !loading && step === 'password' && !hasAutocompleteSubmitted) {
      setHasAutocompleteSubmitted(true);
      handlePasswordStep();
    }
  }, [username, password]);

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
      setError('Ingrese la URL del Google Apps Script');
      return;
    }
    if (!coreSsId.trim()) {
      setError('Ingrese el ID de la hoja de cálculo');
      return;
    }
    localStorage.setItem(API_URL_KEY, gasUrl.trim());
    localStorage.setItem(SS_ID_KEY, coreSsId.trim());
    setHasConfig(true);
    setShowConfig(false);
    setError(null);
  };

  const handleClearConfig = () => {
    localStorage.removeItem(API_URL_KEY);
    localStorage.removeItem(SS_ID_KEY);
    localStorage.removeItem('congre_admin_session_token');
    localStorage.removeItem('congre_admin_user_data');
    setHasConfig(false);
    setShowConfig(true);
    setGasUrl('');
    setCoreSsId('');
    setUsername('');
    setPassword('');
  };

  const handlePasswordStep = async () => {
    if (!username.trim()) {
      setError('Ingrese su usuario');
      return;
    }
    if (!password) {
      setError('Ingrese su contraseña');
      return;
    }

    const apiUrl = localStorage.getItem(API_URL_KEY);
    if (!apiUrl) {
      setShowConfig(true);
      setError('Debe configurar la conexión primero');
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
      const apiUrl = localStorage.getItem(API_URL_KEY);
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
      setError('Ingrese el código');
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
      const apiUrl = localStorage.getItem(API_URL_KEY);
      if (!apiUrl) {
        throw new Error('API URL no configurada');
      }

      dataService.setApiUrl(apiUrl);

      const challengeData = await dataService.request<{ success: boolean; challenge?: string; rpId?: string; timeout?: number; allowCredentials?: any[] }>('challenge', {
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
        allowCredentials: challengeData.allowCredentials?.map((cred: any) => ({
          id: base64UrlToUint8Array(cred.id),
          type: cred.type
        })) || [],
        userVerification: challengeData.userVerification || 'preferred'
      };

      let credential: PublicKeyCredential | null = null;
      
      try {
        credential = await navigator.credentials.get({ publicKey }) as PublicKeyCredential;
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
      setError('Ingrese su email o nombre de usuario');
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
      case 'password': return 'Iniciar Sesión';
      case 'method': return 'Seleccione método';
      case 'totp': return 'Código TOTP';
      case 'email_otp': return 'Código del email';
      case 'passkey': return 'Autenticación';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'password': return 'Ingrese sus credenciales';
      case 'method': return 'Elija cómo verificar su identidad';
      case 'totp': return 'Ingrese el código de su app autenticadora';
      case 'email_otp': return 'Revise su bandeja de entrada';
      case 'passkey': return 'Use su dispositivo para autenticarse';
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

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {getStatusMessage() && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {getStatusMessage()}
          </Alert>
        )}

        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Button
            size="small"
            variant="text"
            color="secondary"
            onClick={() => {
              if (confirm('¿Está seguro de borrar todos los datos y comenzar de nuevo? Esto cerrará su sesión.')) {
                localStorage.clear();
                window.location.href = '/admin/setup';
              }
            }}
          >
            Reiniciar instalación
          </Button>
        </Box>

        <Collapse in={showConfig}>
          <Box sx={{ mb: 3 }}>
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
              label="ID de Hoja de Cálculo (Core)"
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
              onClick={handleSaveConfig}
              disabled={loading}
              startIcon={<Settings />}
            >
              Guardar Configuración
            </Button>
          </Box>
        </Collapse>

        {hasConfig && !showConfig && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                Configuración activa
              </Typography>
              <Button size="small" onClick={handleClearConfig}>
                Cambiar
              </Button>
            </Box>
          </Alert>
        )}

        {step === 'password' && (
          <>
            <TextField
              fullWidth
              label="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
              autoFocus
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
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordStep()}
            />
            <Button
              variant="contained"
              onClick={handlePasswordStep}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Continuar'}
            </Button>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => setForgotPasswordOpen(true)}
                sx={{ cursor: 'pointer' }}
              >
                ¿Olvidó su contraseña?
              </Link>
            </Box>
          </>
        )}

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
                Cambiar método de autenticación
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
                Cambiar método de autenticación
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
                  Use su passkey para autenticarse
                </Typography>
              </>
            )}
            {defaultMethodStep && !showMethodSelection && (
              <Button 
                variant="outlined" 
                onClick={handleShowMethodSelection}
              >
                Cambiar método de autenticación
              </Button>
            )}
          </Box>
        )}

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/admin/setup')}
            sx={{ cursor: 'pointer' }}
          >
            ¿Necesita configurar una nueva congregación?
          </Link>
        </Box>

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
                  Ingresa tu email o nombre de usuario y te enviaremos instrucciones para restablecer tu contraseña.
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
                  onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
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
      </Paper>
    </Box>
  );
}
