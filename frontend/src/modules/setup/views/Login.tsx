import { useState } from 'react';
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
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { useAuth } from '../../../core/context/AuthContext';

const API_URL_KEY = 'congre_admin_api_url';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');

  const handleRequestOTP = async () => {
    if (!username.trim()) {
      setError('Ingrese su usuario');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = localStorage.getItem(API_URL_KEY);
      
      const response = await fetch(`${apiUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'requestOTP',
          payload: { username }
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al solicitar código');
      }

      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar código');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !code.trim()) {
      setError('Ingrese usuario y código');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(username, code, 'email');
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el login');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('credentials');
    setCode('');
    setError(null);
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
        sx={{ p: 4, maxWidth: 400, width: '100%' }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Congre-Admin
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Iniciar Sesión
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {step === 'credentials' ? (
          <>
            <TextField
              fullWidth
              label="Usuario (email)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
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
            />
            <Button
              variant="contained"
              onClick={handleRequestOTP}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Continuar'}
            </Button>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Se ha enviado un código de verificación a su correo.
            </Typography>
            <TextField
              fullWidth
              label="Código de verificación"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 6 }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={loading}
              >
                Atrás
              </Button>
              <Button
                variant="contained"
                onClick={handleLogin}
                disabled={loading}
                sx={{ flex: 1 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
              </Button>
            </Box>
          </>
        )}

        <Button
          variant="text"
          onClick={() => navigate('/setup')}
          sx={{ mt: 2 }}
          fullWidth
        >
          ¿Necesita configurar el sistema?
        </Button>
      </Paper>
    </Box>
  );
}