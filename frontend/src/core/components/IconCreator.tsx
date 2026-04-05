import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import { Upload, Link as LinkIcon } from '@mui/icons-material';
import { generateTextIconPreview, generateImagePreview } from '../../utils/faviconGenerator';
import { getAutoTextColor } from '../../utils/color';

interface IconCreatorProps {
  congregationName: string;
  primaryColor: string;
  config: {
    mode: 'default' | 'custom';
    text: string;
    bgMode: 'primary' | 'custom';
    bgColor: string;
    textMode: 'white' | 'auto' | 'custom';
    textColor: string;
    sizes?: Record<string, string>;
  };
  onChange: (config: IconCreatorProps['config']) => void;
  onModeChange: (mode: 'default' | 'custom') => void;
  customFile?: File | null;
  onCustomFileChange?: (file: File | null) => void;
}

export default function IconCreator({
  congregationName,
  primaryColor,
  config,
  onChange,
  onModeChange,
  customFile,
  onCustomFileChange,
}: IconCreatorProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlTab, setUrlTab] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const defaultText = congregationName.charAt(0).toUpperCase() || '?';

  useEffect(() => {
    if (config.mode === 'custom' && customFile) {
      generateImagePreview(customFile, 64).then(setPreviewUrl).catch(() => setPreviewUrl(null));
    } else if (config.mode === 'default') {
      const text = config.text || defaultText;
      const bgColor = config.bgMode === 'primary' ? primaryColor : config.bgColor;
      const textColor = config.textMode === 'auto'
        ? getAutoTextColor(bgColor)
        : config.textMode === 'white'
          ? '#ffffff'
          : config.textColor;
      setPreviewUrl(generateTextIconPreview(text, bgColor, textColor, 64));
    } else {
      setPreviewUrl(null);
    }
  }, [config, primaryColor, customFile, defaultText]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    onCustomFileChange?.(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUrlLoad = async () => {
    if (!urlInput.trim()) return;
    try {
      const response = await fetch(urlInput);
      const blob = await response.blob();
      const file = new File([blob], 'icon', { type: blob.type });
      handleFileSelect(file);
    } catch {
      // Invalid URL
    }
  };

  return (
    <Box>
      <RadioGroup
        value={config.mode}
        onChange={(e) => onModeChange(e.target.value as 'default' | 'custom')}
        sx={{ mb: 2 }}
      >
        <FormControlLabel value="default" control={<Radio />} label="Icono predeterminado" />
        <FormControlLabel value="custom" control={<Radio />} label="Icono personalizado" />
      </RadioGroup>

      {config.mode === 'default' ? (
        <Box sx={{ pl: 3 }}>
          <TextField
            fullWidth
            size="small"
            label="Texto del Icono"
            value={config.text || defaultText}
            onChange={(e) => onChange({ ...config, text: e.target.value.slice(0, 2) })}
            inputProps={{ maxLength: 2 }}
            helperText={config.text.length >= 2 ? 'Máximo 2 caracteres' : '1-2 caracteres recomendados'}
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Color de fondo</Typography>
          <RadioGroup
            row
            value={config.bgMode}
            onChange={(e) => onChange({ ...config, bgMode: e.target.value as 'primary' | 'custom' })}
            sx={{ mb: 1 }}
          >
            <FormControlLabel value="primary" control={<Radio size="small" />} label="Primario" />
            <FormControlLabel value="custom" control={<Radio size="small" />} label="Custom" />
          </RadioGroup>
          {config.bgMode === 'custom' && (
            <TextField
              fullWidth
              size="small"
              type="color"
              value={config.bgColor}
              onChange={(e) => onChange({ ...config, bgColor: e.target.value })}
              sx={{ mb: 2, maxWidth: 120 }}
            />
          )}

          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Color de texto</Typography>
          <RadioGroup
            row
            value={config.textMode}
            onChange={(e) => {
              const mode = e.target.value as 'white' | 'auto' | 'custom';
              const bgColor = config.bgMode === 'primary' ? primaryColor : config.bgColor;
              onChange({
                ...config,
                textMode: mode,
                textColor: mode === 'auto' ? getAutoTextColor(bgColor) : mode === 'white' ? '#ffffff' : config.textColor,
              });
            }}
            sx={{ mb: 1 }}
          >
            <FormControlLabel value="white" control={<Radio size="small" />} label="Blanco" />
            <FormControlLabel value="auto" control={<Radio size="small" />} label="Auto" />
            <FormControlLabel value="custom" control={<Radio size="small" />} label="Custom" />
          </RadioGroup>
          {config.textMode === 'custom' && (
            <TextField
              fullWidth
              size="small"
              type="color"
              value={config.textColor}
              onChange={(e) => onChange({ ...config, textColor: e.target.value })}
              sx={{ mb: 2, maxWidth: 120 }}
            />
          )}
        </Box>
      ) : (
        <Box sx={{ pl: 3 }}>
          <Tabs value={urlTab} onChange={(_, v) => setUrlTab(v)} sx={{ mb: 2 }}>
            <Tab icon={<Upload />} label="Archivo" />
            <Tab icon={<LinkIcon />} label="URL" />
          </Tabs>

          {urlTab === 0 ? (
            <Box
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              sx={{
                border: '2px dashed',
                borderColor: dragOver ? 'primary.main' : 'divider',
                borderRadius: 1,
                p: 2,
                textAlign: 'center',
                bgcolor: dragOver ? 'action.hover' : 'transparent',
                cursor: 'pointer',
                mb: 2,
              }}
              onClick={() => document.getElementById('icon-file-input')?.click()}
            >
              <input
                id="icon-file-input"
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <Upload sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2">
                {customFile ? customFile.name : 'Arrastra una imagen o haz clic para seleccionar'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                PNG, JPG, SVG, WebP
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="https://..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <IconButton onClick={handleUrlLoad} color="primary">
                <LinkIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      )}

      {previewUrl && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <img
            src={previewUrl}
            alt="Icono preview"
            style={{
              width: 64,
              height: 64,
              borderRadius: 8,
              border: '1px solid',
              borderColor: 'divider',
            }}
          />
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            Vista previa
          </Typography>
        </Box>
      )}
    </Box>
  );
}
