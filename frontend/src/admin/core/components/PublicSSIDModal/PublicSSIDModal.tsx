import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Link,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Link as LinkIcon,
  HelpOutline as HelpIcon,
} from '@mui/icons-material';

const PUBLIC_SS_ID_KEY = 'congre_public_ss_id';

interface PublicSSIDModalProps {
  open: boolean;
  onClose: () => void;
  onSetupWizard: () => void;
}

export default function PublicSSIDModal({ open, onClose, onSetupWizard }: PublicSSIDModalProps) {
  const [ssidInput, setSsidInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSetupConfirm, setShowSetupConfirm] = useState(false);

  const extractSsId = (input: string): string | null => {
    const trimmed = input.trim();
    
    // Already a plain SSID (like "abc123..." or "1A2B3C...")
    if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
      return trimmed;
    }
    
    // Full Google Sheets URL: https://docs.google.com/spreadsheets/d/ABC123.../edit...
    const urlMatch = trimmed.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }
    
    // Check if it's just the ID portion from a URL
    if (trimmed.includes('docs.google.com/spreadsheets/d/')) {
      return null;
    }
    
    return null;
  };

  const handleSubmit = () => {
    const ssid = extractSsId(ssidInput);
    
    if (!ssid) {
      setError('Por favor ingresa un ID de hoja de cálculo o URL válida de Google Sheets');
      return;
    }
    
    localStorage.setItem(PUBLIC_SS_ID_KEY, ssid);
    setError(null);
    setSsidInput('');
    onClose();
    
    // Reload to fetch data with new SSID
    window.location.reload();
  };

  const handleSetupClick = () => {
    setShowSetupConfirm(true);
  };

  const handleSetupConfirm = () => {
    setShowSetupConfirm(false);
    // Navigate to admin setup
    window.location.href = '/admin/setup';
  };

  const handleSetupCancel = () => {
    setShowSetupConfirm(false);
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon color="primary" />
          Configurar hoja pública
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Para ver la información pública de una congregación, ingresa el ID o enlace 
            de su hoja de cálculo de Google Sheets.
          </Typography>
          
          <TextField
            autoFocus
            fullWidth
            label="ID o URL de Google Sheets"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={ssidInput}
            onChange={(e) => {
              setSsidInput(e.target.value);
              setError(null);
            }}
            error={!!error}
            helperText={error}
            InputProps={{
              startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ mb: 2 }}
          />
          
          <Alert severity="info" icon={<HelpIcon />}>
            <Typography variant="body2">
              ¿No conoces el enlace? Pregunta a un anciano de tu congregación 
              para que te proporcione el enlace a la hoja pública.
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          <Button 
            variant="text" 
            onClick={handleSetupClick}
            sx={{ color: 'text.secondary' }}
          >
            Configurar nueva congregación
          </Button>
          
          <Box>
            <Button onClick={onClose} sx={{ mr: 1 }}>
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              disabled={!ssidInput.trim()}
            >
              Aceptar
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Setup confirmation dialog */}
      <Dialog 
        open={showSetupConfirm} 
        onClose={handleSetupCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          ¿Configurar nueva congregación?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Esto abrirá el asistente de configuración para crear una nueva congregación. 
            ¿Estás seguro de que deseas continuar?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSetupCancel}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSetupConfirm}
          >
            Sí, continuar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}