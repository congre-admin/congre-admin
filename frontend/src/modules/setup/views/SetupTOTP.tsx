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
  StepLabel
} from '@mui/material';
import { Security, CheckCircle } from '@mui/icons-material';
import QRCode from 'qrcode';
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

export default function SetupTOTP() {
  const navigate = useNavigate();
  const { user, sessionToken, isAuthenticated } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [success, setSuccess] = useState(false);

  const username = user?.username || sessionStorage.getItem('totp_setup_user') || '';
  const password = sessionStorage.getItem('totp_setup_pass') || '';

  useEffect(() => {
    if (!isAuthenticated && !username) {
      navigate('/admin/login');
    }
  }, [navigate, isAuthenticated, username]);

  useEffect(() => {
    // Don't clear sessionStorage on unmount - credentials needed for retry
    return () => {};
  }, []);

  const handleGenerateTOTP = async () => {
    if (!username) {
      setError('Usuario no vílido');
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
      
      const payload: Record<string, string> = { username };
      
      if (isAuthenticated && sessionToken) {
        payload.sessionToken = sessionToken;
      } else {
        payload.password = password;
      }
      
      const data = await fetchApi(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'setupTOTP',
          payload
        })
      });

      if (!data.success) {
        throw new Error(data.error || 'Error al generar TOTP');
      }

      setSecret(data.secret);
      
      const qrDataUrl = await QRCode.toDataURL(data.otpURI);
      setQrCode(qrDataUrl);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al configurar TOTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTOTP = async () => {
    if (!code.trim() || code.length !== 6) {
      setError('Ingrese un cóndigo de 6 dígitos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = localStorage.getItem(API_URL_KEY);
      if (!apiUrl) {
        throw new Error('API URL no configurada');
      }
      
      const payload: Record<string, string> = { username, code };
      
      if (isAuthenticated && sessionToken) {
        payload.sessionToken = sessionToken;
      } else {
        payload.password = password;
      }
      
      const data = await fetchApi(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'confirmTOTP',
          payload
        })
      });

      if (!data.success) {
        throw new Error(data.error || 'Error al verificar cóndigo');
      }

      sessionStorage.removeItem('totp_setup_user');
      sessionStorage.removeItem('totp_setup_pass');
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/settings/auth');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar cóndigo');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableTOTP = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = localStorage.getItem(API_URL_KEY);
      
      const data = await fetchApi(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'disableTOTP',
          payload: {
            sessionToken
          }
        })
      });

      if (!data.success) {
        throw new Error(data.error || 'Error al desactivar TOTP');
      }

      navigate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al desactivar TOTP');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Generar cóndigo', 'Escanear QR', 'Verificar'];

  if (success) {
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
        <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            ┬íTOTP configurado!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Redirigiendo...
          </Typography>
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
        p: 3
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: '100%' }}>
        <Typography variant="h4" align="center" gutterBottom>
          Configurar TOTP
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Autenticaciónn de dos factores
        </Typography>

        <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {step === 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure la autenticaciónn de dos factores usando Google Authenticator (u otra app compatible).
              Necesitará su teléfono para escanear el cóndigo QR.
            </Typography>
            
            <Button
              variant="contained"
              onClick={handleGenerateTOTP}
              disabled={loading}
              fullWidth
              startIcon={<Security />}
            >
              {loading ? <CircularProgress size={24} /> : 'Generar cóndigo QR'}
            </Button>

            <Button
              variant="outlined"
              onClick={handleDisableTOTP}
              disabled={loading}
              fullWidth
              sx={{ mt: 2 }}
            >
              Desactivar TOTP (volver a email)
            </Button>
          </Box>
        )}

        {step === 1 && qrCode && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Escanee este cóndigo QR con su app de autenticaciónn (Google Authenticator, Authy, etc.)
            </Typography>
            
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <Paper variant="outlined" sx={{ p: 2, display: 'inline-block' }}>
                <img src={qrCode} alt="QR Code" style={{ width: 200, height: 200 }} />
              </Paper>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
             σ»åΘÆÑ (secreto): <strong>{secret}</strong>
            </Typography>

            <TextField
              fullWidth
              label="Cóndigo de verificaciónn"
              placeholder="Ingrese el cóndigo de 6 dígitos"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputProps={{ maxLength: 6 }}
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              onClick={handleVerifyTOTP}
              disabled={loading || code.length !== 6}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Verificar y activar'}
            </Button>

            <Button
              variant="text"
              onClick={() => {
                setStep(0);
                setQrCode(null);
                setSecret(null);
                setCode('');
              }}
              fullWidth
              sx={{ mt: 1 }}
            >
              Volver
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
