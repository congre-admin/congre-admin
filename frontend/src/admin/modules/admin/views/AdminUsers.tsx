import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  ButtonProps,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import {
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  AdminPanelSettings as ProfileIcon,
  VpnKey as PermissionIcon,
} from '@mui/icons-material';
import Page from '@/admin/core/components/Page';

interface User {
  id: string;
  username: string;
  email: string;
  profile: string;
  active: boolean;
  createdAt: string;
}

interface Profile {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

// Placeholder data
const INITIAL_USERS: User[] = [
  { id: '1', username: 'admin', email: 'admin@test.com', profile: 'Administrador', active: true, createdAt: '2024-01-01' },
  { id: '2', username: 'secretario', email: 'secretario@test.com', profile: 'Secretario', active: true, createdAt: '2024-01-15' },
];

const INITIAL_PROFILES: Profile[] = [
  { id: '1', name: 'Administrador', description: 'Acceso total al sistema', permissions: ['*'] },
  { id: '2', name: 'Secretario', description: 'Gestión de miembros y reuniones', permissions: ['personas.read', 'personas.write', 'reuniones.read', 'reuniones.write'] },
  { id: '3', name: 'Tesorero', description: 'Gestión de finanzas', permissions: ['tesoreria.read', 'tesoreria.write'] },
];

const INITIAL_PERMISSIONS: Permission[] = [
  { id: 'personas.read', name: 'Ver Personas', description: 'Puede ver la lista de personas', category: 'Personas' },
  { id: 'personas.write', name: 'Editar Personas', description: 'Puede crear, modificar y eliminar personas', category: 'Personas' },
  { id: 'reuniones.read', name: 'Ver Reuniones', description: 'Puede ver las reuniones', category: 'Reuniones' },
  { id: 'reuniones.write', name: 'Editar Reuniones', description: ' Puede crear, modificar y eliminar reuniones', category: 'Reuniones' },
  { id: 'anuncios.read', name: 'Ver Anuncios', description: 'Puede ver los anuncios', category: 'Anuncios' },
  { id: 'anuncios.write', name: 'Editar Anuncios', description: 'Puede crear, modificar y eliminar anuncios', category: 'Anuncios' },
  { id: 'tesoreria.read', name: 'Ver Finanzas', description: 'Puede ver finanzas', category: 'Tesorería' },
  { id: 'tesoreria.write', name: 'Editar Finanzas', description: 'Puede gestionar ofrendas y gastos', category: 'Tesorería' },
  { id: 'backup.export', name: 'Exportar Respaldo', description: 'Puede exportar datos', category: 'Sistema' },
  { id: 'settings.manage', name: 'Gestionar Configuración', description: 'Puede modificar configuración', category: 'Sistema' },
];

type TabValue = 'users' | 'profiles' | 'permissions';

export default function AdminUsers() {
  const [tab, setTab] = useState<TabValue>('users');
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [permissions] = useState<Permission[]>(INITIAL_PERMISSIONS);
  
  // Dialogs
  const [userDialog, setUserDialog] = useState<{ open: boolean; user?: User }>({ open: false });
  const [profileDialog, setProfileDialog] = useState<{ open: boolean; profile?: Profile }>({ open: false });
  
  // Form fields
  const [userForm, setUserForm] = useState({ username: '', email: '', profile: '', active: true });
  const [profileForm, setProfileForm] = useState<{ name: string; description: string; permissions: string[] }>({ name: '', description: '', permissions: [] });
  const [saving, setSaving] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    setTab(newValue);
  };

  // User handlers
  const openUserDialog = (user?: User) => {
    if (user) {
      setUserForm({ username: user.username, email: user.email, profile: user.profile, active: user.active });
    } else {
      setUserForm({ username: '', email: '', profile: '', active: true });
    }
    setUserDialog({ open: true, user });
  };

  const handleSaveUser = async () => {
    setSaving(true);
    // Placeholder - would save to backend
    setTimeout(() => {
      setSaving(false);
      setUserDialog({ open: false });
    }, 500);
  };

  const handleToggleUser = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, active: !u.active } : u));
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  // Profile handlers
  const openProfileDialog = (profile?: Profile) => {
    if (profile) {
      setProfileForm({ name: profile.name, description: profile.description, permissions: profile.permissions });
    } else {
      setProfileForm({ name: '', description: '', permissions: [] });
    }
    setProfileDialog({ open: true, profile });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    // Placeholder - would save to backend
    setTimeout(() => {
      setSaving(false);
      setProfileDialog({ open: false });
    }, 500);
  };

  const handleTogglePermission = (permId: string) => {
    setProfileForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const groupedPermissions = permissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getPageActions = () => {
    if (tab === 'users') {
      return {
        primary: {
          children: 'Nuevo usuario',
          startIcon: <PersonAddIcon />,
          onClick: () => openUserDialog(),
        } as ButtonProps,
      };
    }
    if (tab === 'profiles') {
      return {
        primary: {
          children: 'Nuevo perfil',
          startIcon: <ProfileIcon />,
          onClick: () => openProfileDialog(),
        } as ButtonProps,
      };
    }
    return undefined;
  };

  return (
    <Page
      title="Gestión de usuarios y permisos"
      subtitle="Administra usuarios, perfiles y permisos del sistema"
      actions={getPageActions()}
    >
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<PersonIcon />} iconPosition="start" label={`Usuarios (${users.length})`} value="users" />
          <Tab icon={<ProfileIcon />} iconPosition="start" label={`Perfiles (${profiles.length})`} value="profiles" />
          <Tab icon={<PermissionIcon />} iconPosition="start" label={`Permisos (${permissions.length})`} value="permissions" />
        </Tabs>
      </Paper>

      {/* USERS TAB */}
      {tab === 'users' && (
        <Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Perfil</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Creado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip label={user.profile} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Switch checked={user.active} onChange={() => handleToggleUser(user.id)} size="small" />
                    </TableCell>
                    <TableCell>{user.createdAt}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openUserDialog(user)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteUser(user.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* PROFILES TAB */}
      {tab === 'profiles' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<ProfileIcon />} onClick={() => openProfileDialog()}>
              Nuevo perfil
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Permisos</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <Typography fontWeight={600}>{profile.name}</Typography>
                    </TableCell>
                    <TableCell>{profile.description}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {profile.permissions.slice(0, 3).map(p => (
                          <Chip key={p} label={p} size="small" variant="outlined" />
                        ))}
                        {profile.permissions.length > 3 && (
                          <Chip label={`+${profile.permissions.length - 3}`} size="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openProfileDialog(profile)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* PERMISSIONS TAB */}
      {tab === 'permissions' && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Permisos disponibles en el sistema. Los permisos se asignan a los perfiles.
          </Typography>
          
          {Object.entries(groupedPermissions).map(([category, perms]) => (
            <Paper key={category} sx={{ mb: 2, p: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                {category}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {perms.map((perm) => (
                  <Box key={perm.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SecurityIcon color="action" fontSize="small" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>{perm.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{perm.description}</Typography>
                    </Box>
                    <Chip label={perm.id} size="small" variant="outlined" />
                  </Box>
                ))}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* USER DIALOG */}
      <Dialog open={userDialog.open} onClose={() => setUserDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {userDialog.user ? 'Editar usuario' : 'Nuevo usuario'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Usuario"
            fullWidth
            value={userForm.username}
            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="Email"
            fullWidth
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Perfil</InputLabel>
            <Select
              value={userForm.profile}
              label="Perfil"
              onChange={(e) => setUserForm({ ...userForm, profile: e.target.value })}
            >
              {profiles.map(p => (
                <MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Switch checked={userForm.active} onChange={(e) => setUserForm({ ...userForm, active: e.target.checked })} />
            <Typography>Usuario activo</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog({ open: false })}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveUser} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PROFILE DIALOG */}
      <Dialog open={profileDialog.open} onClose={() => setProfileDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {profileDialog.profile ? 'Editar perfil' : 'Nuevo perfil'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Nombre del Perfil"
            fullWidth
            value={profileForm.name}
            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="Descripción"
            fullWidth
            multiline
            rows={2}
            value={profileForm.description}
            onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Permisos</Typography>
          {Object.entries(groupedPermissions).map(([category, perms]) => (
            <Box key={category} sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                {category}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {perms.map(perm => (
                  <Box key={perm.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Checkbox
                      checked={profileForm.permissions.includes(perm.id)}
                      onChange={() => handleTogglePermission(perm.id)}
                      size="small"
                    />
                    <Typography variant="body2">{perm.name}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialog({ open: false })}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveProfile} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}
