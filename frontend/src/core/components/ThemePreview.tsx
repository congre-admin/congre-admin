import { Box, Typography, Paper, Chip, Button } from '@mui/material';
import { Home, Settings, Notifications } from '@mui/icons-material';

interface ThemePreviewProps {
  primaryColor: string;
  secondaryColor: string;
  lightBgPage: string;
  lightBgPanel: string;
  darkBgPage: string;
  darkBgPanel: string;
  congregationName: string;
  iconPreview?: string;
}

function Mockup({ mode, primary, secondary, bgPage, bgPanel, name, icon }: {
  mode: 'light' | 'dark';
  primary: string;
  secondary: string;
  bgPage: string;
  bgPanel: string;
  name: string;
  icon?: string;
}) {
  const textColor = mode === 'dark' ? '#e0e0e0' : '#333';
  const textSecondary = mode === 'dark' ? '#9e9e9e' : '#666';
  const borderColor = mode === 'dark' ? '#333' : '#e0e0e0';

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mb: 0.5, fontSize: '0.65rem' }}>
        {mode === 'light' ? '☀️ LIGHT' : '🌙 DARK'}
      </Typography>
      <Paper
        elevation={0}
        sx={{
          bgcolor: bgPage,
          borderRadius: 1,
          overflow: 'hidden',
          border: `1px solid ${borderColor}`,
        }}
      >
        <Box sx={{ bgcolor: primary, px: 1, py: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {icon ? (
            <img src={icon} alt="" style={{ width: 14, height: 14, borderRadius: 2 }} />
          ) : (
            <Box sx={{ width: 14, height: 14, bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
          )}
          <Typography sx={{ color: '#fff', fontSize: '0.55rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name || 'Congregación'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex' }}>
          <Box sx={{ width: 28, bgcolor: bgPanel, borderRight: `1px solid ${borderColor}`, py: 0.5, px: 0.3 }}>
            {[Home, Settings, Notifications].map((Icon, i) => (
              <Box key={i} sx={{ mb: 0.3, display: 'flex', justifyContent: 'center' }}>
                <Icon sx={{ fontSize: 10, color: i === 0 ? primary : textSecondary }} />
              </Box>
            ))}
          </Box>
          <Box sx={{ flex: 1, p: 0.5 }}>
            <Paper elevation={0} sx={{ bgcolor: bgPanel, p: 0.5, mb: 0.5, borderRadius: 0.5 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: primary }}>1,234</Typography>
              <Typography sx={{ fontSize: '0.5rem', color: textSecondary }}>Miembros</Typography>
            </Paper>
            <Box sx={{ display: 'flex', gap: 0.3, mb: 0.3 }}>
              <Box sx={{ bgcolor: primary, color: '#fff', px: 0.5, py: 0.15, borderRadius: 0.5, fontSize: '0.5rem' }}>
                Primario
              </Box>
              <Chip label="Secundario" size="small" sx={{ height: 14, fontSize: '0.45rem', bgcolor: secondary + '22', color: secondary }} />
            </Box>
          </Box>
        </Box>
      </Paper>
      <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mt: 0.25, fontSize: '0.55rem' }}>
        Page: {bgPage} · Panel: {bgPanel}
      </Typography>
    </Box>
  );
}

export default function ThemePreview({
  primaryColor,
  secondaryColor,
  lightBgPage,
  lightBgPanel,
  darkBgPage,
  darkBgPanel,
  congregationName,
  iconPreview,
}: ThemePreviewProps) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Vista Previa del Tema
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Mockup
          mode="light"
          primary={primaryColor}
          secondary={secondaryColor}
          bgPage={lightBgPage}
          bgPanel={lightBgPanel}
          name={congregationName}
          icon={iconPreview}
        />
        <Mockup
          mode="dark"
          primary={primaryColor}
          secondary={secondaryColor}
          bgPage={darkBgPage}
          bgPanel={darkBgPanel}
          name={congregationName}
          icon={iconPreview}
        />
      </Box>
    </Box>
  );
}
