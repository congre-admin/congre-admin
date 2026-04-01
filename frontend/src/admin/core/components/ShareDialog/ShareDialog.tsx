import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
  IconButton,
  Stack
} from '@mui/material';
import {
  Share as ShareIcon,
  WhatsApp as WhatsAppIcon,
  ContentCopy as CopyIcon,
  Close as CloseIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
  title?: string;
}

const DISCLAIMER_TEXT = 'No compartir con personas fuera de la congregación, ni en redes sociales o estados. Esta información es privada.';

export default function ShareDialog({ open, onClose, shareUrl, title = 'Compartir Página' }: ShareDialogProps) {
  const [agreed, setAgreed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSystemShare = async () => {
    try {
      await navigator.share({
        title: 'Información de la Congregación',
        text: `Consulta la información pública de nuestra congregación: ${shareUrl}`,
        url: shareUrl
      });
    } catch (err) {
      console.log('Share cancelled or failed:', err);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Consulta la información pública de nuestra congregación: ${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClose = () => {
    setAgreed(false);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        {title}
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
            <WarningIcon color="warning" sx={{ mt: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {DISCLAIMER_TEXT}
            </Typography>
          </Box>
          
          <FormControlLabel
            control={
              <Checkbox 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)}
                color="primary"
              />
            }
            label="He leído y acepto"
          />
        </Box>

        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'center',
          opacity: agreed ? 1 : 0.5,
          pointerEvents: agreed ? 'auto' : 'none'
        }}>
          <Button
            variant="contained"
            startIcon={<ShareIcon />}
            onClick={handleSystemShare}
            disabled={!agreed}
          >
            Compartir
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<WhatsAppIcon />}
            onClick={handleWhatsAppShare}
            disabled={!agreed}
            sx={{ 
              color: '#25D366',
              borderColor: '#25D366',
              '&:hover': { borderColor: '#25D366', bgcolor: 'rgba(37, 211, 102, 0.08)' }
            }}
          >
            WhatsApp
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={handleCopyLink}
            disabled={!agreed}
          >
            {copied ? '¡Copiado!' : 'Copiar'}
          </Button>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
            {shareUrl}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={handleClose} color="inherit">
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
