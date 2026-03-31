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
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { Security, CheckCircle, Devices, Keyboard, PhoneIphone } from '@mui/icons-material';
import { useAuth } from '../../../core/context/AuthContext';

const API_URL_KEY = 'congre_admin_api_url';

async function fetchApi(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  return response.json();
}

interface PasskeyChallenge {
  challenge: string;
  rpId: string;
  timeout: number;
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{ type: string; alg: number }>;
  attestation: string;
  excludeCredentials: Array<{ id: string; type: string }>;
}

export default function SetupPasskey() {
  const navigate = useNavigate();
  const { user, sessionToken, isAuthenticated } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);

  const username = user?.username || sessionStorage.getItem('passkey_setup_user') || '';
  const password = sessionStorage.getItem('passkey_setup_pass') || '';

  useEffect(() => {
    if (!isAuthenticated && !username) {
      navigate('/admin/login');
    }
  }, [navigate, isAuthenticated, username]);

  useEffect(() => {
    return () => {
      sessionStorage.removeItem('passkey_setup_user');
      sessionStorage.removeItem('passkey_setup_pass');
    };
  }, []);

  const detectDeviceName = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) {
      return 'iPhone/iPad';
    }
    if (ua.includes('android')) {
      return 'Android';
    }
    if (ua.includes('mac')) {
      return 'Mac';
    }
    if (ua.includes('windows')) {
      return 'Windows PC';
    }
    if (ua.includes('linux')) {
      return 'Linux';
    }
    return 'Dispositivo';
  };

  useEffect(() => {
    if (!deviceName) {
      setDeviceName(detectDeviceName());
    }
  }, [deviceName]);

  const handleStartSetup = async () => {
    if (!username) {
      setError('Usuario no válido');
      return;
    }

    if (!isAuthenticated && !password) {
      setError('Sesiónn expirada. Por favor inicia sesiónn nuevamente.');
      navigate('/admin/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = localStorage.getItem(API_URL_KEY);
      if (!apiUrl) {
        throw new Error('API URL no configurada');
      }

      const payload: Record<string, string> = {
        username,
        deviceName,
        origin: window.location.origin
      };

      if (isAuthenticated && sessionToken) {
        payload.sessionToken = sessionToken;
      } else {
        payload.password = password;
      }

      const data = await fetchApi(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'setupPasskey',
          payload
        })
      });

      if (!data.success) {
        throw new Error(data.error || 'Error al iniciar configuraciónn de passkey');
      }

      const challenge: PasskeyChallenge = data;

      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: Uint8Array.from(atob(challenge.challenge), c => c.charCodeAt(0)),
        rp: {
          id: challenge.rpId || 'localhost',
          name: 'Congre-Admin'
        },
        user: {
          id: Uint8Array.from(challenge.user.id, c => c.charCodeAt(0)),
          name: challenge.user.name,
          displayName: challenge.user.displayName
        },
        pubKeyCredParams: challenge.pubKeyCredParams.map(param => ({
          type: param.type as 'public-key',
          alg: param.alg
        })),
        timeout: challenge.timeout || 60000,
        attestation: challenge.attestation as AttestationConveyancePreference,
        excludeCredentials: challenge.excludeCredentials.map(cred => ({
          id: base64UrlToUint8Array(cred.id),
          type: cred.type as 'public-key'
        }))
      };

      let credential: PublicKeyCredential | null = null;
      
      try {
        credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;
      } catch (webAuthnErr) {
        console.error('WebAuthn error:', webAuthnErr);
        throw new Error('Error al crear credencial. Asegárate de usar un navegador compatible con WebAuthn.');
      }

      if (!credential) {
        throw new Error('No se pudo crear la credencial');
      }

      const attestationResponse = credential as any;
      
      const attestation = {
        id: credential.id,
        type: credential.type,
        response: {
          clientDataJSON: arrayBufferToBase64(attestationResponse.response.clientDataJSON),
          attestationObject: arrayBufferToBase64(attestationResponse.response.attestationObject),
          publicKey: attestationResponse.response.publicKey 
            ? arrayBufferToBase64(attestationResponse.response.publicKey)
            : null
        }
      };

      const confirmPayload: Record<string, any> = {
        username,
        attestation
      };

      if (isAuthenticated && sessionToken) {
        confirmPayload.sessionToken = sessionToken;
      } else {
        confirmPayload.password = password;
      }

      const confirmData = await fetchApi(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'confirmPasskey',
          payload: confirmPayload
        })
      });

      if (!confirmData.success) {
        throw new Error(confirmData.error || 'Error al confirmar passkey');
      }

      setSuccess(true);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al configurar passkey');
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

  const handleFinish = () => {
    navigate('/admin/settings/auth');
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 2
        }}
      >
        <Paper sx={{ p: 4, maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Passkey configurado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ahora puedes usar tu dispositivo para iniciar sesiónn de forma segura.
          </Typography>
          <Button variant="contained" fullWidth onClick={handleFinish}>
            Ir a Login
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 500, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Security sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
          <Typography variant="h5">
            Configurar Passkey
          </Typography>
        </Box>

        <Stepper activeStep={step} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Preparar dispositivo</StepLabel>
          </Step>
          <Step>
            <StepLabel>Autenticarse</StepLabel>
          </Step>
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {step === 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Un passkey te permite iniciar sesiónn usando tu dispositivo (huella digital, rostro, PIN, etc.) 
              en lugar de una contraseña.
            </Typography>

            <List sx={{ mb: 2 }}>
              <ListItem>
                <ListItemIcon>
                  <Devices color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Compatible con máltiples dispositivos" 
                  secondary="Huella digital, Face ID, PIN de Windows, etc."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Security color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Más seguro que contraseñas" 
                  secondary="No se puede phishing ni robar"
                />
              </ListItem>
            </List>

            <TextField
              fullWidth
              label="Nombre del dispositivo"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              sx={{ mb: 3 }}
              placeholder="Ej: MacBook Pro, iPhone 15"
            />

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleStartSetup}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Keyboard />}
            >
              {loading ? 'Configurando...' : 'Crear Passkey'}
            </Button>
          </Box>
        )}

        {step === 1 && (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>
              Verificando...
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
