import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Snackbar,
  ListItemButton,
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment
} from '@mui/material';
import {
  Security,
  Business,
  PersonAdd,
  CheckCircleOutline,
  CheckCircle,
  ContentCopy,
  ExpandMore,
  ExpandLess,
  Check,
  Download,
  Visibility,
  VisibilityOff,
  Close,
  Backup,
  Email
} from '@mui/icons-material';
import { wrapMasterKey, generateMasterKey, createMasterKeyBackup } from '@/core/crypto/cryptoUtils';
import { dataService } from '@/services/dataService';

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
const SS_ID_KEY = 'congre_admin_ss_id';

interface Perfil {
  id: string;
  nombre: string;
  permisos: Record<string, string>;
  descripcion: string;
}

interface SeedData {
  version: string;
  perfiles: Perfil[];
}

interface SeedConfig {
  version: string;
  config: Array<{
    clave: string;
    valor: string;
    is_public: boolean;
  }>;
}

const steps = [
  { label: 'Configuración', icon: Security },
  { label: 'Perfiles y Admin', icon: Business },
  { label: 'Respaldo', icon: Backup },
  { label: 'Completado', icon: CheckCircleOutline },
];

export default function SetupWizard() {
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [apiUrl, setApiUrl] = useState('');
  const [nombreCongregacion, setNombreCongregacion] = useState('');
  const [numeroCongregacion, setNumeroCongregacion] = useState('');
  const [nombreMostrar, setNombreMostrar] = useState('');
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [defaultConfig, setDefaultConfig] = useState<Array<{ clave: string; valor: string; is_public: boolean }>>([]);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [registeredWrappedMk, setRegisteredWrappedMk] = useState('');

  const [backupPassword, setBackupPassword] = useState('');
  const [backupPasswordConfirm, setBackupPasswordConfirm] = useState('');
  const [backupCreated, setBackupCreated] = useState(false);
  const [showBackupPassword, setShowBackupPassword] = useState(false);

  const [showCode, setShowCode] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [apiCode, setApiCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);

  useEffect(() => {
    // Clear old installation data for fresh start
    localStorage.removeItem('congre_admin_api_url');
    localStorage.removeItem('congre_admin_ss_id');
    localStorage.removeItem('congre_admin_session_token');
    localStorage.removeItem('congre_perfil_id');
    localStorage.removeItem('congre_public_ss_id');
    localStorage.removeItem('congre_admin_user_data');
    localStorage.removeItem('congre_admin_folder_id');
    localStorage.removeItem('congre_admin_folder_url');
    
    const storedApiUrl = localStorage.getItem(API_URL_KEY);
    const storedSsId = localStorage.getItem(SS_ID_KEY);
    
    if (storedApiUrl && storedSsId) {
      navigate('/admin/login');
      return;
    }

    fetch('/data/seeds/core/perfiles.json')
      .then(res => res.json())
      .then((data: Perfil[]) => {
        setPerfiles(data);
      })
      .catch(err => {
        console.error('Error loading seed profiles:', err);
        setError('Error al cargar los perfiles base');
      });

    fetch('/data/seeds/core/configuracion.json')
      .then(res => res.json())
      .then((data: Array<{ clave: string; valor: string; is_public: boolean }>) => {
        setDefaultConfig(data);
      })
      .catch(err => {
        console.error('Error loading seed config:', err);
      });

    setLoadingCode(true);
    fetch('/api/api.gs')
      .then(res => res.text())
      .then(text => setApiCode(text))
      .catch(err => console.error('Error loading api.gs:', err))
      .finally(() => setLoadingCode(false));
  }, [navigate]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(apiCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying:', err);
    }
  };

  const handleDownloadCode = () => {
    const blob = new Blob([apiCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api.gs';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleInstall = async () => {
    if (!apiUrl.trim()) {
      setError('Ingresá la URL del Google Apps Script');
      return;
    }

    if (!nombreCongregacion.trim()) {
      setError('Ingresá el nombre de la congregación');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      localStorage.setItem(API_URL_KEY, apiUrl);
      dataService.setApiUrl(apiUrl);
      
      const nombreDisplay = nombreMostrar.trim() || `Co. ${nombreCongregacion}`;
      
      const data = await fetchApi(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'install',
          payload: {
            nombreCongregacion,
            numeroCongregacion,
            nombreMostrar: nombreDisplay,
            gasUrl: apiUrl
          }
        })
      });

      if (!data.success) {
        throw new Error(data.error || 'Error en la instalación');
      }

      localStorage.setItem(SS_ID_KEY, data.ssId);
      localStorage.setItem('congre_public_ss_id', data.publicSsId);
      localStorage.setItem('congre_admin_folder_id', data.folderId);
      localStorage.setItem('congre_admin_folder_url', data.folderUrl);
      
      const coreSsId = data.ssId;
      const publicSsId = data.publicSsId;
      
      const [coreSchema, publicSchema, coreConfigSeed, corePerfilesSeed, publicConfigSeed] = await Promise.all([
        fetch('/data/schemas/core.json').then(r => r.json()),
        fetch('/data/schemas/public.json').then(r => r.json()),
        fetch('/data/seeds/core/configuracion.json').then(r => r.json()),
        fetch('/data/seeds/core/perfiles.json').then(r => r.json()),
        fetch('/data/seeds/public/configuracion.json').then(r => r.json())
      ]);
      
      const perfilesWithMeta = corePerfilesSeed.map((p: Perfil) => ({
        ...p,
        _v: 1,
        _ts: new Date().toISOString(),
        _deleted: false
      }));
      
      const configOverrides: Record<string, string> = {
        'nombre_congregacion': nombreCongregacion,
        'numero_congregacion': numeroCongregacion,
        'nombre_mostrar': nombreMostrar.trim() || `Co. ${nombreCongregacion}`,
        'ss_publico': publicSsId,
        'ss_core': coreSsId,
        'gas_url': apiUrl
      };
      
      const configWithMeta = coreConfigSeed.map((c: any) => ({
        ...c,
        clave: c.clave,
        valor: configOverrides[c.clave] ?? c.valor,
        is_public: c.is_public,
        _v: 1,
        _ts: new Date().toISOString(),
        _deleted: false
      }));
      
      const coreOps: any[] = [
        ...Object.entries(coreSchema.tables).map(([name, table]: [string, any]) => ({
          op: 'initSheet' as const,
          sheet: name,
          headers: table.headers,
          preserveExisting: false,
        })),
        ...perfilesWithMeta.map((p: any) => ({
          op: 'save' as const,
          sheet: 'Perfiles',
          data: p,
        })),
        ...configWithMeta.map((c: any) => ({
          op: 'save' as const,
          sheet: 'Configuracion',
          data: c,
        })),
      ];
      
      await dataService.batchExecute(coreOps, { mode: 'fail-fast', isSetup: true });
      
      setPerfiles(corePerfilesSeed);
      
      const publicTables = Object.entries(publicSchema.tables).map(([name, table]: [string, any]) => ({
        name,
        headers: table.headers,
        preserveExisting: false
      }));
      
      const publicConfig = publicConfigSeed.map((c: any) => ({
        ...c,
        valor: configOverrides[c.clave] ?? c.valor,
        _v: 1,
        _ts: new Date().toISOString(),
        _deleted: false
      }));
      
      const publicOps: any[] = [
        ...publicTables.map((t: any) => ({
          op: 'initSheet' as const,
          sheet: t.name,
          headers: t.headers,
          preserveExisting: false,
        })),
        ...publicConfig.map((c: any) => ({
          op: 'save' as const,
          sheet: 'Configuracion',
          data: c,
        })),
      ];
      
      await dataService.batchExecute(publicOps, { mode: 'fail-fast', isSetup: true, ssId: publicSsId });
      
      setActiveStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la instalación. Verifique la URL del backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setError('Ingresá usuario y contraseña');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!adminEmail.trim() || !emailRegex.test(adminEmail)) {
      setError('Ingresá un email válido');
      return;
    }

      // Password complexity validation
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,128}$/;
    if (!pwRegex.test(adminPassword)) {
      setError('La contraseña debe tener: 8+ caracteres, mayúscula, minúscula, número y carácter especial');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const storedApiUrl = localStorage.getItem(API_URL_KEY);
      if (!storedApiUrl) {
        setError('URL de API no configurada');
        setLoading(false);
        return;
      }
      
      // Check Web Crypto API availability
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('API de cifrado no disponible en este navegador');
      }
      
      console.log('Generating master key...');
      const masterKey = await generateMasterKey();
      console.log('Wrapping master key...');
      const { wrapped_mk } = await wrapMasterKey(masterKey, adminPassword);
      console.log('Wrapped MK:', wrapped_mk ? 'success' : 'failed');
      
      const data = await fetchApi(storedApiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'register',
          payload: {
            username: adminUsername,
            email: adminEmail,
            password: adminPassword,
            perfilIds: ['p_admin'],
            wrapped_mk,
            ssId: localStorage.getItem(SS_ID_KEY)
          }
        })
      });

      if (!data.success) {
        throw new Error(data.error || 'Error al crear usuario');
      }

      setRegisteredWrappedMk(wrapped_mk);
      setActiveStep(2); // Go to backup step
    } catch (err) {
      console.error('Admin creation error:', err);
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
  const handleCreateBackup = async () => {
    if (!backupPassword || !backupPasswordConfirm) {
      setError('Complete ambos campos de contraseña');
      return;
    }
    if (backupPassword !== backupPasswordConfirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (backupPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const backup = await createMasterKeyBackup(
        registeredWrappedMk,
        adminUsername,
        backupPassword
      );

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `congre-admin-backup-${adminUsername}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupCreated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear backup');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSetup = () => {
    navigate('/admin/login');
  };

  const renderBackupStep = () => (
    <Box sx={{ maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Respaldo de Seguridad
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Creá una contraseña de respaldo diferente a tu contraseña de acceso. 
        Este archivo te va a permitir restaurar tu clave maestra si la perdés.
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        Guardá este archivo en un lugar seguro. Sin la contraseña de respaldo no vas a poder restaurar tus datos.
      </Alert>

      {!backupCreated ? (
        <>
          <TextField
            fullWidth
            label="Contraseña de Respaldo"
            type={showBackupPassword ? 'text' : 'password'}
            value={backupPassword}
            onChange={(e) => setBackupPassword(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setShowBackupPassword(!showBackupPassword)} edge="end">
                  {showBackupPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
          />
          <TextField
            fullWidth
            label="Confirmar Contraseña"
            type={showBackupPassword ? 'text' : 'password'}
            value={backupPasswordConfirm}
            onChange={(e) => setBackupPasswordConfirm(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleCreateBackup}
            disabled={loading}
            startIcon={<Download />}
          >
            {loading ? <CircularProgress size={24} /> : 'Descargar Archivo de Respaldo'}
          </Button>
        </>
      ) : (
        <>
          <Alert severity="success" sx={{ mb: 3 }}>
            ✓ Respaldo creado exitosamente
          </Alert>
          <Button
            fullWidth
            variant="contained"
            onClick={handleFinishSetup}
          >
            Continuar al Login
          </Button>
        </>
      )}

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );

    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ maxWidth: 500, mx: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Configurar Conexión al Backend
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ingresá la URL de tu Google Apps Script (archivo api.gs desplegado como Web App)
            </Typography>

            <Paper variant="outlined" sx={{ mb: 3 }}>
              <ListItemButton onClick={() => setShowCode(!showCode)}>
                <ListItemText
                  primary="¿No tienes el backend desplegado? Sigue estos pasos"
                  secondary={showCode ? 'Ocultar instrucciones' : 'Mostrar instrucciones'}
                />
                {showCode ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              
              <Collapse in={showCode}>
                <Box sx={{ px: 2, pb: 2 }}>
                  <List dense disablePadding>
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle fontSize="small" color="primary" /></ListItemIcon>
                      <ListItemText primary="1. Copia el código de api.gs (usa los botones de abajo)" />
                    </ListItem>
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle fontSize="small" color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography component="span">
                            Ve a{' '}
                            <Typography 
                              component="a" 
                              href="https://script.google.com" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              sx={{ color: 'primary.main', textDecoration: 'underline' }}
                            >
                              script.google.com
                            </Typography>
                            {' '}→ Nuevo proyecto
                          </Typography>
                        }
                      />
                    </ListItem>
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle fontSize="small" color="primary" /></ListItemIcon>
                      <ListItemText primary="3. Pega el código y guarda (Ctrl+S)" />
                    </ListItem>
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle fontSize="small" color="primary" /></ListItemIcon>
                      <ListItemText primary="4. Despliegue → Nuevo deployment" />
                    </ListItem>
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle fontSize="small" color="primary" /></ListItemIcon>
                      <ListItemText primary="5. Selecciona: Web app | Ejecutar como: Yo" />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle fontSize="small" color="primary" /></ListItemIcon>
                      <ListItemText primary="6. Copia la URL y pégala abajo" />
                    </ListItem>
                  </List>
                  
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ContentCopy />}
                      onClick={handleCopyCode}
                      disabled={loadingCode}
                    >
                      Copiar
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Download />}
                      onClick={handleDownloadCode}
                      disabled={loadingCode}
                    >
                      Descargar
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => setShowCodeModal(true)}
                      disabled={loadingCode}
                    >
                      Mostrar código
                    </Button>
                  </Box>
                </Box>
              </Collapse>
            </Paper>

            <TextField
              fullWidth
              label="URL del Google Apps Script"
              placeholder="https://script.google.com/macros/s/..."
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Nombre de la Congregación"
              placeholder="Este"
              value={nombreCongregacion}
              onChange={(e) => setNombreCongregacion(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Número de Congregación"
              placeholder="14373"
              value={numeroCongregacion}
              onChange={(e) => setNumeroCongregacion(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Nombre a Mostrar"
              placeholder="Co. Este (se genera automáticamente)"
              value={nombreMostrar}
              onChange={(e) => setNombreMostrar(e.target.value)}
              sx={{ mb: 2 }}
              helperText={`Se mostrará como: ${nombreMostrar.trim() || `Co. ${nombreCongregacion || '...'}`}`}
            />
            <Button
              variant="contained"
              onClick={handleInstall}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Instalar Sistema'}
            </Button>

            <Dialog
              open={showCodeModal}
              onClose={() => setShowCodeModal(false)}
              fullScreen
            >
              <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton onClick={() => setShowCodeModal(false)}>
                    <Close />
                  </IconButton>
                  <span>Código de api.gs</span>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<ContentCopy />}
                  onClick={() => {
                    handleCopyCode();
                    setShowCodeModal(false);
                  }}
                >
                  Copiar
                </Button>
              </DialogTitle>
              <DialogContent sx={{ p: 0 }}>
                <Box
                  sx={{
                    bgcolor: 'grey.900',
                    color: 'grey.100',
                    p: 3,
                    minHeight: '100%',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    whiteSpace: 'pre',
                    overflow: 'auto'
                  }}
                >
                  {apiCode}
                </Box>
              </DialogContent>
            </Dialog>

            <Snackbar
              open={copied}
              autoHideDuration={2000}
              onClose={() => setCopied(false)}
              message="¡Código copiado al portapapeles!"
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ maxWidth: 500, mx: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Perfiles Creados
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Los siguientes perfiles han sido creados:
            </Typography>
            <List>
              {perfiles.map((perfil) => (
                <ListItem key={perfil.id}>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={perfil.nombre}
                    secondary={perfil.descripcion}
                  />
                </ListItem>
              ))}
            </List>
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Crear Usuario Administrador
            </Typography>
            <TextField
              fullWidth
              label="Usuario"
              placeholder="admin"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              placeholder="admin@email.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
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
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              onClick={handleCreateAdmin}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Crear Administrador'}
            </Button>
          </Box>
        );

      case 2:
        return renderBackupStep();

      case 3:
        return (
          <Box sx={{ maxWidth: 500, mx: 'auto', textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              ¡Instalación completada!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Redirigiendo al login...
            </Typography>
          </Box>
        );

      default:
        return null;
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
        sx={{ p: 4, maxWidth: 700, width: '100%' }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          {nombreMostrar.trim() || 'CongreAdmin'}
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Asistente de Instalación
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                StepIconComponent={() => (
                  <step.icon sx={{ color: index <= activeStep ? 'primary.main' : 'disabled' }} />
                )}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              overflow: 'auto',
              maxHeight: 200,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </Paper>
    </Box>
  );
}