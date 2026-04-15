import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  TextField,
  Typography,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Key as KeyIcon,
  MoreVert as MoreVertIcon,
  RocketLaunch as RocketLaunchIcon,
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
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [newInstallDialogOpen, setNewInstallDialogOpen] = useState(false);

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
      setError('Ingresá un código válido');
      return;
    }
    
    localStorage.setItem(PUBLIC_SS_ID_KEY, ssid);
    setError(null);
    setSsidInput('');
    onClose();
    
    // Reload to fetch data with new SSID
    window.location.reload();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleNewInstall = () => {
    handleMenuClose();
    setNewInstallDialogOpen(true);
  };

  const handleConfirmNewInstall = () => {
    setNewInstallDialogOpen(false);
    localStorage.clear();
    window.location.href = '/admin/setup';
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogContent sx={{ textAlign: 'center', py: 4, px: 3 }}>
          <KeyIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Ingresá el código de tu congregación
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Para ver el tablero de tu congregación, necesitás ingresar el código.
          </Typography>
          
          <TextField
            autoFocus
            fullWidth
            placeholder="Código de tu congregación"
            value={ssidInput}
            onChange={(e) => {
              setSsidInput(e.target.value);
              setError(null);
            }}
            error={!!error}
            helperText={error}
            sx={{ mb: 3 }}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Si no conocés el código, podés pedirle a un anciano de tu congregación que te envíe el enlace correcto.
          </Typography>
          
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={!ssidInput.trim()}
            fullWidth
            size="large"
          >
            Aceptar
          </Button>
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant="text"
              size="small"
              onClick={handleMenuOpen}
              startIcon={<MoreVertIcon />}
            >
              Más opciones
            </Button>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleNewInstall}>
                <ListItemIcon><RocketLaunchIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Desplegar instalación nueva</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </DialogContent>
      </Dialog>

      {/* New Install Dialog */}
      <Dialog 
        open={newInstallDialogOpen} 
        onClose={() => setNewInstallDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Desplegar instalación nueva
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Esta acción va a borrar todos los datos y mostrar el asistente de configuración. ¿Estás seguro de que querés continuar?
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Button onClick={() => setNewInstallDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmNewInstall} variant="contained" color="warning">
              Desplegar
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}