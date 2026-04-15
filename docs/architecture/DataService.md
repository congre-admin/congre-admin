# Congre-Admin: DataService — Arquitectura y Diseño

> **Versión:** 2.3.0
> **Última actualización:** 2026-04-06
> **Dependencias:** TanStack Query v5, JSONata v2, Google Apps Script (GAS)

---

## 1. Resumen Ejecutivo

El DataService es la capa de abstracción del frontend que conecta la aplicación React con el backend GAS (Google Apps Script). Implementa fetching de datos, orquestación batch, gestión de archivos en Drive, y caché con TanStack Query.

### Arquitectura Actual

```
┌─────────────────────────────────────────────────────┐
│  React Components (Dashboard, Settings, etc.)     │
│  ↓                                                 │
│  TanStack Query Hooks (useSheetData,               │
│    useFilteredData, useCoreData, useSaveData,      │
│    useDeleteData, useAuthMethods)                  │
│  ↓                                                 │
│  DataService (dataService.ts)                     │
│  - HTTP client con in-flight dedup                │
│  - JSONata transformations (filter, map, sort,    │
│    sanitize) — client-side, zero GAS quota        │
│  - Module resolution (ssId → module name)         │
│  - batchExecute con chunking (max 50 ops)         │
│  - File operations (upload, download, list, etc.) │
│  - Settings cache (localStorage)                  │
│  ↓                                                 │
│  jsonataService (jsonataService.ts)               │
│  - Expression caching                             │
│  - filter, map, sort, sanitize, validate, process │
│  ↓                                                 │
│  GAS Backend (api.gs)                             │
│  - doPost → dispatch map                          │
│  - batchExecute orchestrator                      │
│  - Auth, RBAC, CRUD, Drive ops                    │
└─────────────────────────────────────────────────────┘
```

### Principios de Diseño

1. **Zero-Knowledge**: El backend nunca accede a datos plaintext
2. **Batch-first**: Operaciones agrupadas reducen latencia GAS
3. **Cache inteligente**: In-flight dedup + localStorage + TanStack Query
4. **Module resolution dinámico**: `Registro_Plugins` → ssId mapping, zero hardcoded
5. **Error handling centralizado**: Códigos `ERR_*` traducidos a mensajes en español

---

## 2. Configuración de Fetch para GAS (Workaround CORS)

> **Nota Importante:** Google Apps Script **no soporta** headers CORS personalizados. El método `ContentService.setHeaders()` es ignorado por GAS. La solución es la siguiente:

### Configuración del Fetch

```typescript
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify(body),
  mode: 'cors',
  redirect: 'follow',
});
```

### Por qué funciona

| Opción | Propósito |
|--------|-----------|
| `mode: 'cors'` | Habilita explícitamente el modo CORS |
| `redirect: 'follow'` | Permite seguir los redirects 302 de GAS |
| `Content-Type: text/plain` | Evita preflight (OPTIONS) - es un "simple request" |

### Errores comunes a evitar

- ❌ No usar `Content-Type: application/json` - triggerea preflight
- ❌ No intentar agregar `Access-Control-Allow-Origin` - GAS lo ignora
- ❌ No usar `mode: 'no-cors'` - la respuesta será opaca (no se puede leer)

---

## 3. Tipos TypeScript

### 3.1 Estructura de Datos del Backend

#### Tabla: `Usuarios`

```typescript
interface AuthConfig {
  default_method: 'password' | 'passkey' | 'totp' | 'email_otp';
  password_hash?: string;
  recovery_enabled: boolean;
  email_otp?: { enabled: boolean; created_at: string };
  totp?: { enabled: boolean; secret?: string; created_at: string };
  passkeys?: Passkey[];
}

interface Passkey {
  id: string;
  public_key?: string;
  device_name: string;
  created_at: string;
}

interface UserMetadata {
  last_login?: string;
  last_password_change?: string;
  failed_login_attempts: number;
  created_from_ip?: string;
}

interface User {
  id: string;
  username: string;
  perfilIds: string[];  // JSON array in DB, e.g., ["p_admin"]
  wrapped_mk?: string;
  auth_config: AuthConfig;
  metadata: UserMetadata;
  created_at: string;
  _v: number;
  _ts: string;
  _deleted?: boolean;
}
```

> **Nota:** El campo `perfilId` (singular) está deprecado. Ahora se usa `perfilIds` (array) para soporte multi-perfil.

#### Tabla: `Perfiles`

```typescript
type Permiso = 'R' | 'W' | 'RW';
type ModulePermission = Permiso | Record<string, Permiso>;

interface Permisos {
  [modulo: string]: ModulePermission;
}

interface Perfil {
  id: string;
  nombre: string;
  permisos: Permisos;
  descripcion?: string;
  _v: number;
  _ts: string;
  _deleted?: boolean;
}
```

#### Tabla: `Configuracion`

```typescript
interface Configuracion {
  clave: string;
  valor: string;
  is_public: boolean;
  _v: number;
  _ts: string;
  _deleted?: boolean;
}
```

#### Tabla: `Registro_Plugins`

```typescript
interface Plugin {
  plugin_id: string;
  ssId: string;
  status: 'active' | 'suspended';
  config?: Record<string, any>;
  _v: number;
  _ts: string;
  _deleted?: boolean;
}
```

---

### 3.2 Tipos de Respuesta de la API

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

interface GetDataResponse<T = any[]> {
  success: true;
  data: T;
}

interface LoginResponse {
  success: true;
  sessionToken: string;
  wrapped_mk?: string;
  expiresAt: string;
  user: { id: string; username: string; perfilIds: string[] };
}

interface LoginStepResponse {
  success: false;
  step: 'email_otp' | 'totp' | 'passkey' | 'method';
  availableMethods?: string[];
  defaultMethod?: string;
  message: string;
  error?: string;
  requiresSetup?: boolean;
}

interface ValidateSessionResponse {
  valid: boolean;
  userId?: string;
  username?: string;
  expiresAt?: string;
}
```

---

### 3.3 Tipos de Batch Execute

```typescript
type BatchMode = 'continue' | 'fail-fast';

type BatchOp =
  | { op: 'read'; sheet: string; filter?: Record<string, any> }
  | { op: 'readById'; sheet: string; id: string }
  | { op: 'save'; sheet: string; data: Record<string, any> }
  | { op: 'delete'; sheet: string; id: string }
  | { op: 'hardDelete'; sheet: string; id: string }
  | { op: 'restore'; sheet: string; id: string }
  | { op: 'initSheet'; sheet: string; headers: string[]; preserveExisting?: boolean }
  | { op: 'uploadFile'; content: string; fileName: string; mimeType: string; subfolder?: string }
  | { op: 'downloadFile'; fileId: string }
  | { op: 'listFolderFiles'; subfolder?: string }
  | { op: 'deleteFile'; fileId: string }
  | { op: 'setFileSharing'; fileId: string; access: string; permission?: string }
  | { op: 'moveFileToFolder'; fileId: string; subfolder?: string };

interface BatchResult {
  index: number;
  op: string;
  sheet?: string;
  success: boolean;
  error?: string;
  data?: any;
}

interface BatchExecuteResponse {
  success: boolean;
  error?: string;
  results?: BatchResult[];
  totalOps?: number;
  succeeded?: number;
  failed?: number;
}
```

---

### 3.4 Tipos de Operaciones de Archivo

```typescript
interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  created: string;
  modified: string;
  url: string;
  shared: boolean;
  access: string;
  permission: string;
}

interface ListFilesResponse {
  success: boolean;
  files: FileItem[];
}

interface UploadFileResponse {
  success: boolean;
  fileId: string;
  fileUrl: string;
  fileName: string;
  size: number;
}

interface DownloadFileResponse {
  success: boolean;
  fileName: string;
  mimeType: string;
  size: number;
  content: string;  // base64
}

interface SetSharingResponse {
  success: boolean;
  fileId: string;
  access: string;
  permission: string;
  shareUrl: string;
}

interface MoveFileResponse {
  success: boolean;
  fileId: string;
  fileName: string;
  folderId: string;
  fileUrl: string;
}
```

---

### 3.5 Tipos de Configuración de Tema e Icono

```typescript
type HarmonyMode = 'complementary' | 'analogous' | 'triadic' | 'split' | 'monochromatic';

interface BgSetting {
  mode: 'auto' | 'neutral' | 'custom';
  value: string | null;
}

interface ThemeConfig {
  primary: string;
  harmony: HarmonyMode;
  backgrounds: {
    lightPage: BgSetting;
    lightPanel: BgSetting;
    darkPage: BgSetting;
    darkPanel: BgSetting;
  };
}

interface IconConfig {
  mode: 'default' | 'custom';
  text: string;
  bgMode: 'primary' | 'custom';
  bgColor: string;
  textMode: 'white' | 'auto' | 'custom';
  textColor: string;
  sizes?: Record<string, string>;
}
```

---

## 4. DataService Class

### 4.1 Propósito

DataService es el cliente HTTP que comunica con el backend GAS. Maneja:
- Detección flexible de URL (Script ID ↔ full URL)
- Inyección automática de `sessionToken`, `coreSsId`, `module`
- In-flight request deduplication
- Module resolution desde `Registro_Plugins`
- Batch execute con chunking automático (max 50 ops)
- Operaciones de archivo (Drive)
- Manejo de errores con mensajes en español

### 4.2 Métodos Principales

```typescript
class DataService {
  // === Core ===
  setApiUrl(url: string): void;
  getApiUrl(): string | null;
  resolveModule(sheetName: string, ssId: string): string | null;
  async refreshModuleMap(): Promise<void>;

  // === HTTP ===
  async request<T>(action: string, payload?: Record<string, any>): Promise<T>;

  // === CRUD (getData aplica JSONata client-side) ===
  async getData<T>(sheet: string, ssId: string, options?: GetDataOptions): Promise<T>;
  // GetDataOptions: { filter?, map?, sanitize?, sort?, limit?, offset? }
  async saveData(sheet: string, ssId: string, payload: any, options?: SaveDataOptions): Promise<ApiResponse>;
  async deleteData(sheet: string, ssId: string, id: string): Promise<ApiResponse>;
  async hardDelete(sheet: string, ssId: string, id: string): Promise<ApiResponse>;
  async restoreData(sheet: string, ssId: string, id: string): Promise<ApiResponse>;

  // === Batch ===
  async batchExecute(operations: BatchOp[], options?: {
    mode?: BatchMode;
    folderId?: string;
    isSetup?: boolean;
    ssId?: string;
    onProgress?: (completed: number, total: number, result: BatchExecuteResponse) => void;
  }): Promise<BatchExecuteResponse>;

  // === Auth ===
  async login(payload: LoginPayload): Promise<LoginResponse | LoginStepResponse>;
  async register(payload: { username: string; password: string; perfilIds?: string[]; email?: string }): Promise<ApiResponse & { user: any }>;
  async logout(sessionToken: string): Promise<ApiResponse>;
  async validateSession(sessionToken: string): Promise<ValidateSessionResponse>;
  async refreshSession(sessionToken: string): Promise<ApiResponse & { sessionToken: string }>;

  // === Perfiles ===
  async getPerfiles(ssId: string): Promise<Perfil[]>;
  async createProfile(ssId: string, payload: Partial<Perfil>): Promise<ApiResponse>;
  async updateProfile(ssId: string, payload: Partial<Perfil>): Promise<ApiResponse>;
  async deleteProfile(ssId: string, profileId: string): Promise<ApiResponse>;

  // === Config ===
  async getConfig(key: string, ssId: string): Promise<{ clave: string; valor: string } | null>;
  async setConfig(key: string, value: string, ssId: string, isPublic?: boolean): Promise<ApiResponse>;

  // === File Operations (Drive) ===
  async listFolderFiles(folderId?: string, subfolder?: string): Promise<ListFilesResponse>;
  async uploadFile(content: string, fileName: string, mimeType: string, options?: { folderId?: string; subfolder?: string }): Promise<UploadFileResponse>;
  async downloadFile(fileId: string): Promise<DownloadFileResponse>;
  async deleteFile(fileId: string): Promise<ApiResponse>;
  async setFileSharing(fileId: string, access: string, permission?: string): Promise<SetSharingResponse>;
  async moveFileToFolder(fileId: string, options?: { folderId?: string; subfolder?: string }): Promise<MoveFileResponse>;
}
```

### 4.3 In-Flight Request Deduplication

El DataService previene requests duplicados concurrentes:

```typescript
private _inFlight = new Map<string, Promise<any>>();

async request<T>(action: string, payload = {}) {
  const key = `${action}:${JSON.stringify(payload)}`;
  if (this._inFlight.has(key)) return this._inFlight.get(key);
  
  const promise = this._doRequest(action, payload);
  this._inFlight.set(key, promise);
  try { return await promise; }
  finally { this._inFlight.delete(key); }
}
```

Si dos componentes llaman `getData('Configuracion', ssId)` simultáneamente, solo se hace **un** request HTTP.

### 4.4 Module Resolution

```typescript
resolveModule(sheetName: string, ssId: string): string | null {
  // ssId === coreSsId → 'core'
  // ssId en moduleMap → plugin_id
  // else → null
}

async refreshModuleMap(): Promise<void> {
  // Fetch Registro_Plugins → build map → localStorage
  // { coreSsId: 'core', pluginSsId1: 'personas', pluginSsId2: 'reuniones' }
}
```

### 4.5 Batch Execute con Chunking

```typescript
async batchExecute(operations, options) {
  // Auto-chunks operations into batches of 50
  // Supports 'continue' and 'fail-fast' modes
  // isSetup: true bypasses auth for initSheet/save ops
  // Returns aggregated results with correct indices
}
```

### 4.6 Manejo de Errores

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  ERR_AUTH_REQUIRED: 'Se requiere autenticación',
  ERR_AUTH_INVALID: 'Credenciales inválidas',
  ERR_SESSION_EXPIRED: 'La sesión ha expirado',
  ERR_SESSION_NOT_FOUND: 'Sesión no encontrada',
  ERR_USER_NOT_FOUND: 'Usuario no encontrado',
  ERR_USER_EXISTS: 'El usuario ya existe',
  ERR_VERSION_CONFLICT: 'Conflicto de versión',
  ERR_PERMISSION_DENIED: 'Permiso denegado',
  ERR_RATE_LIMITED: 'Demasiados intentos. Intenta más tarde.',
  ERR_INVALID_CREDENTIALS: 'Credenciales inválidas',
  ERR_PASSWORD_WEAK: 'Contraseña muy débil',
  ERR_PROFILE_EXISTS: 'El perfil ya existe',
  ERR_PROFILE_NOT_FOUND: 'Perfil no encontrado',
  ERR_PROFILE_IN_USE: 'El perfil está en uso',
  ERR_SS_ID_REQUIRED: 'Se requiere ID de hoja de cálculo',
  ERR_FILE_NOT_FOUND: 'Archivo no encontrado',
  ERR_FILE_TOO_LARGE: 'Archivo demasiado grande (máx 37MB)',
  ERR_INVALID_MIMETYPE: 'Tipo de archivo no permitido',
  ERR_FOLDER_NOT_FOUND: 'Carpeta no encontrada',
  ERR_SUBFOLDER_NOT_FOUND: 'Subcarpeta no encontrada',
  ERR_INVALID_BASE64: 'Contenido inválido',
  ERR_BATCH_EMPTY: 'No se proporcionaron operaciones',
  ERR_BATCH_TOO_LARGE: 'Demasiadas operaciones (máx 50 por llamada)',
  ERR_SKIPPED: 'Omitida por error anterior',
  ERR_UNKNOWN_OP: 'Operación desconocida',
};
```

---

## 5. Sistema de Caché

### 5.1 Arquitectura de Caché

```
┌─────────────────────────────────────────────────────┐
│  TanStack Query (in-memory, 5min stale)            │
│  ↓                                                 │
│  DataService._inFlight (dedup concurrent requests) │
│  ↓                                                 │
│  settingsCache (localStorage, 15min stale)         │
│  ↓                                                 │
│  GAS Backend (source of truth)                     │
└─────────────────────────────────────────────────────┘
```

### 5.2 settingsCache (localStorage)

| Data | Key | Stale Time |
|------|-----|------------|
| All Configuracion rows | `congre_settings` | 15 minutos |
| Theme config | (within congre_settings) | 15 minutos |
| Icon config | (within congre_settings) | 15 minutos |
| Module map | `congre_module_map` | Until refreshModuleMap() |
| Dark mode preference | `congre_dark_mode` | Persistent |

### 5.3 Flujo de Inicialización

```typescript
// On login:
1. Fetch Configuracion from GAS
2. Parse into { clave: valor } map
3. Store in localStorage: congre_settings
4. ThemeContext reads from cache → applies theme

// On mount (existing session):
1. AuthContext restores session from localStorage
2. AuthContext fetches Configuracion → caches
3. ThemeContext reads cache → applies theme
4. Components render with cached data instantly

// On settings save:
1. Save to GAS via batchExecute
2. Update localStorage cache optimistically
3. Call updateThemeConfig() → instant theme update
```

### 5.4 TanStack Query Integration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      gcTime: 30 * 60 * 1000,      // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

// Offline persistence
persistQueryClient({
  queryClient,
  persister: createSyncStoragePersister({ storage: localStorage }),
  maxAge: 30 * 60 * 1000,
});
```

---

## 6. TanStack Query Hooks

### 6.1 useSheetData

Hook genérico para fetch de cualquier hoja:

```typescript
function useSheetData<T = any>(sheet: string, ssId: string, options = {}) {
  return useQuery({
    queryKey: ['sheet', sheet, ssId],
    queryFn: () => dataService.getData<T>(sheet, ssId),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// Usage:
const { data: config, isLoading } = useSheetData('Configuracion', ssId, {
  enabled: !!ssId,
  refetchOnMount: true,
});
```

### 6.2 useFilteredData

Hook para fetch de datos con transformaciones JSONata. Las expresiones se incluyen en el query key para cacheo correcto.

```typescript
function useFilteredData<T = any>(
  sheet: string,
  ssId: string,
  options: {
    filter?: string;      // JSONata filter expression
    map?: string;         // JSONata map expression
    sort?: string;        // JSONata sort expression
    sanitize?: boolean;   // Remove enc_* fields
    limit?: number;
    offset?: number;
  } = {},
  queryOptions = {}
) {
  return useQuery({
    queryKey: ['sheet', sheet, ssId, options.filter, options.map, options.sort, options.limit, options.offset],
    queryFn: () => dataService.getData<T>(sheet, ssId, options),
    staleTime: 5 * 60 * 1000,
    ...queryOptions,
  });
}

// Usage:
const { data: activos, isLoading } = useFilteredData(
  'Personas',
  ssId,
  {
    filter: '[$.estado = "activo"]',
    sort: '$sort($, function($a, $b) { $a.nombre < $b.nombre })',
    limit: 20,
  }
);
```

### 6.3 useCoreData

Batch hook que fetchea 3 tablas core en un solo request:

```typescript
function useCoreData(ssId: string, options = {}) {
  return useQuery({
    queryKey: ['core-data', ssId],
    queryFn: () => dataService.batchExecute([
      { op: 'read', sheet: 'Perfiles' },
      { op: 'read', sheet: 'Configuracion' },
      { op: 'read', sheet: 'Registro_Plugins' },
    ], { mode: 'continue' }),
    staleTime: 5 * 60 * 1000,
    select: (data) => ({
      perfiles: data.results?.[0]?.data || [],
      config: data.results?.[1]?.data || [],
      plugins: data.results?.[2]?.data || [],
    }),
  });
}
```

### 6.4 useSaveData / useDeleteData

Mutations con optimistic updates:

```typescript
function useSaveData(sheet: string, ssId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => dataService.saveData(sheet, ssId, data),
    onMutate: async (newData) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['sheet', sheet, ssId] });
      const previous = queryClient.getQueryData(['sheet', sheet, ssId]);
      queryClient.setQueryData(['sheet', sheet, ssId], (old: any[]) => {
        const idx = old?.findIndex(r => r.id === newData.id);
        if (idx >= 0) { const copy = [...old]; copy[idx] = { ...copy[idx], ...newData }; return copy; }
        return [...(old || []), { ...newData, _v: 1, _ts: new Date().toISOString(), _deleted: false }];
      });
      return { previous };
    },
    onError: (err, newData, context: any) => {
      if (context?.previous) queryClient.setQueryData(['sheet', sheet, ssId], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet', sheet, ssId] });
    },
  });
}
```

### 6.5 useSession / useAuthMethods

```typescript
function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: () => authService.validateSession(),
    enabled: false,  // Manual trigger
  });
}

function useAuthMethods() {
  return useQuery({
    queryKey: ['authMethods'],
    queryFn: () => authService.getAuthMethods(),
    refetchOnMount: true,
  });
}
```

---

## 7. AuthService

Servicios de autenticación separados (para modularidad):

```typescript
class AuthService {
  async loginWithPassword(username: string, password: string): Promise<LoginResponse | LoginStepResponse>;
  async loginWithPasskey(username: string, assertion: any, password?: string): Promise<LoginResponse | LoginStepResponse>;
  async loginWithTOTP(username: string, code: string, password?: string): Promise<LoginResponse | LoginStepResponse>;
  async loginWithEmailOTP(username: string, code: string, password?: string): Promise<LoginResponse | LoginStepResponse>;
  
  async getAuthMethods(): Promise<AuthMethodsResponse>;
  async setDefaultAuthMethod(method: string): Promise<ApiResponse>;
  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse>;
  async deletePasskey(passkeyId: string): Promise<ApiResponse>;
  
  async logout(): Promise<ApiResponse>;
  async validateSession(): Promise<ValidateSessionResponse>;
  async refreshSession(): Promise<ApiResponse & { sessionToken: string }>;
}
```

---

## 8. Integración con AuthContext

### 8.1 Flujo de Login

```
User → Login.tsx → authService.login()
                     ↓
               AuthContext.setSession()
                     ↓
               Fetch Configuracion → setCachedSettings()
                     ↓
               Fetch Registro_Plugins → refreshModuleMap()
                     ↓
               localStorage + hooks disponibles
```

### 8.2 Flujo de Mount (Sesión Existente)

```
App loads → AuthContext useEffect
              ↓
         Restore session from localStorage
              ↓
         Fetch Configuracion → setCachedSettings()
              ↓
         ThemeContext reads cache → applies theme
              ↓
         Components render instantly
```

### 8.3 Flujo de Logout

```
User clicks logout → authService.logout()
                       ↓
                 clearCachedSettings()
                 queryClient.clear()
                 localStorage cleanup
                       ↓
                 Redirect to /admin/login
```

---

## 9. Uso en Componentes

### 9.1 Ejemplo: Lista de Datos con useSheetData

```typescript
import { useSheetData } from '@/hooks/useSession';

export function ConfigList({ ssId }: Props) {
  const { data: config, isLoading, error } = useSheetData('Configuracion', ssId, {
    enabled: !!ssId,
  });

  if (isLoading) return <Skeleton />;
  if (error) return <Alert>{error.message}</Alert>;

  return (
    <List>
      {config?.map(item => (
        <ListItem key={item.clave}>{item.clave}: {item.valor}</ListItem>
      ))}
    </List>
  );
}
```

### 9.2 Ejemplo: Save con Optimistic Update

```typescript
import { useSaveData } from '@/hooks/useSession';

export function ConfigEditor({ ssId }: Props) {
  const saveConfig = useSaveData('Configuracion', ssId);

  const handleSave = async (key: string, value: string) => {
    await saveConfig.mutateAsync({
      clave: key,
      valor: value,
      is_public: true,
    });
  };

  return <Button onClick={() => handleSave('nombre', 'Nuevo Nombre')}>Guardar</Button>;
}
```

### 9.3 Ejemplo: Raw Fetch + batchExecute

```typescript
import { dataService } from '@/services/dataService';

async function initializeCore(ssId: string) {
  const ops = [
    { op: 'initSheet', sheet: 'Usuarios', headers: [...] },
    { op: 'initSheet', sheet: 'Perfiles', headers: [...] },
    { op: 'save', sheet: 'Perfiles', data: { id: 'p_admin', ... } },
  ];

  const result = await dataService.batchExecute(ops, {
    mode: 'fail-fast',
    isSetup: true,
  });

  console.log(`Succeeded: ${result.succeeded}, Failed: ${result.failed}`);
}
```

---

## 10. Configuración de main.tsx

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

const persister = createSyncStoragePersister({ storage: localStorage });
persistQueryClient({ queryClient, persister, maxAge: 30 * 60 * 1000 });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <AppShell />
      </ThemeContextProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

---

## 11. jsonataService — Transformaciones Client-Side

### 11.1 Propósito

Servicio de transformación de datos usando JSONata. Se ejecuta **client-side** sobre los datos obtenidos del backend, sin costo de cuota GAS.

### 11.2 Arquitectura

```
getData() → fetch from GAS → filter() → map() → sort() → sanitize() → return
```

### 11.3 Métodos

| Método | Descripción | Ejemplo |
|--------|-------------|---------|
| `filter(data, expr)` | Filtra registros | `filter(personas, '[$.estado = "activo"]')` |
| `map(data, expr)` | Transforma campos | `map(personas, '[{"id": id, "nombre": nombre}]')` |
| `sort(data, expr)` | Ordena registros | `sort(personas, '$sort($, function($a, $b) { $a.nombre < $b.nombre })')` |
| `sanitize(data)` | Elimina campos `enc_*` | `sanitize(personas)` |
| `validate(data, expr)` | Valida datos | `validate(persona, '[ $$.nombre ? null : "requerido" ] ~> $filter($!=null)')` |
| `process(data, opts)` | Pipeline: filter→map→sort→limit | `process(data, { filter: '...', sort: '...', limit: 10 })` |
| `compile(expr)` | Compila y cachea expresión | `compile('[$.estado = "activo"]')` |

### 11.4 Expression Cache

Las expresiones JSONata se compilan y cachean automáticamente para evitar recompilación en llamadas repetidas:

```typescript
class JsonataService {
  private _expressionCache = new Map<string, jsonata.Expression>();

  compile(expression: string): jsonata.Expression {
    if (!this._expressionCache.has(expression)) {
      this._expressionCache.set(expression, jsonata(expression));
    }
    return this._expressionCache.get(expression)!;
  }
}
```

### 11.5 Expresiones JSONata Comunes

| Caso de Uso | Expresión |
|-------------|-----------|
| Filtrar por estado | `[$.estado = "activo"]` |
| Búsqueda por texto | `[$.nombre ~> $contains(/juan/i)]` |
| Renombrar campos | `[{"id": id, "nombre": nombre, "telefono": enc_telefono}]` |
| Ordenar por nombre | `$sort($, function($a, $b) { $a.nombre < $b.nombre })` |
| Sanitizar (remover enc_*) | `$map($, function($r) { $r ~> $filter(function($v, $k) { $k ~> $not($contains(/^enc_/)) }) })` |
| Contar activos | `$count($[estado="activo"])` |
| Agrupar por campo | `$$.grupo ~> $distinct ~> $map(function($g) { {"grupo": $g, "count": $count($$[grupo=$g])} })` |

### 11.6 Integración con getData

```typescript
// getData aplica JSONata automáticamente:
const activos = await dataService.getData('Personas', ssId, {
  filter: '[$.estado = "activo"]',
  sort: '$sort($, function($a, $b) { $a.nombre < $b.nombre })',
  limit: 20,
  offset: 0,
});

// Sanitizar para vista pública:
const publicData = await dataService.getData('Personas', ssId, {
  sanitize: true,
});
```

---

## 12. Referencias

- [Backend API Completa](./Backend_API_Completa.md)
- [Backend](./Backend.md)
- [Autenticación](./Autenticacion.md)
- [TanStack Query Docs](https://tanstack.com/query)
- [JSONata Docs](https://jsonata.org/)

---

*Documento actualizado el 2026-04-06 — v2.3.0*
