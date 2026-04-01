# Congre-Admin: DataService — Arquitectura y Diseño

> **Versión:** 1.0.0
> **Última actualización:** 2026-03-31
> **Dependencias:** TanStack Query v5, JSONata v2, Google Apps Script (GAS)

---

## 1. Resumen Ejecutivo

El DataService es la capa de abstracción del frontend que conecta la aplicación React con el backend GAS (Google Apps Script). Implementa una arquitectura de **tres capas** que combina fetching de datos, transformación con JSONata, y caché con TanStack Query.

### Arquitectura de Tres Capas

```
┌─────────────────────────────────────────────────────┐
│  Layer 4: CacheService (cacheService.ts)          │
│  - Memory + localStorage + 24h expiry             │
│  - Module ssId resolution                          │
│  - Config, perfil, permisos caching               │
├─────────────────────────────────────────────────────┤
│  Layer 3: TanStack Query Hooks (usePersonas, etc)│
│  - Pre-built queries con caché                     │
│  - Invalidación automática                         │
├─────────────────────────────────────────────────────┤
│  Layer 2: DataTransformService (jsonataService)   │
│  - filter(), sanitize(), map(), sort(), validate()│
├─────────────────────────────────────────────────────┤
│  Layer 1: DataService (dataService.ts)            │
│  - fetch(), getData(), saveData(), deleteData()   │
│  - Flexible URL detection (Script ID ↔ full URL)  │
│  - Module name resolution (personas → ssId)       │
└─────────────────────────────────────────────────────┘
```

### Principios de Diseño

1. **Separación de responsabilidades**: Cada capa tiene una función clara
2. **Flexibilidad**: Usar capas inferiores cuando se necesita control
3. **Conveniencia**: Capas superiores para casos comunes
4. **Seguridad**: Validación antes de guardar (ahorra cuota GAS)
5. **Rendimiento**: Caché con staleTime de 5 minutos

---

## 2. Configuración de Fetch para GAS (Workaround CORS)

> **Nota Importante:** Google Apps Script **no soporta** headers CORS personalizados. El método `ContentService.setHeaders()` es ignorado por GAS. La solución es la siguiente:

### Configuración del Fetch

```typescript
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
```

### Por qué funciona

| Opción | Propósito |
|--------|-----------|
| `mode: 'cors'` | Habilita explícitamente el modo CORS |
| `redirect: 'follow'` | Permite seguir los redirects 302 de GAS |
| `Content-Type: text/plain` | Evita preflight (OPTIONS) - es un "simple request" |

### Configuración del Backend

El backend **no necesita** headers CORS. Simplemente retorna JSON:

```javascript
function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  // NO usar .setHeaders() - GAS lo ignora
}
```

### Errores comunes a evitar

- ❌ No usar `Content-Type: application/json` - triggerea preflight
- ❌ No intentar agregar `Access-Control-Allow-Origin` - GAS lo ignora
- ❌ No usar `mode: 'no-cors'` - la respuesta será opaca (no se puede leer)

---

## 3. Tipos TypeScript

### 2.1 Estructura de Datos del Backend

Los tipos reflejan la estructura definida en `Backend_API_Completa.md`.

#### Tabla: `Usuarios`

```typescript
interface AuthConfig {
  default_method: 'password' | 'passkey' | 'totp' | 'email_otp';
  password_hash?: string;
  recovery_enabled: boolean;
  email_otp?: {
    enabled: boolean;
    created_at: string;
  };
  totp?: {
    enabled: boolean;
    secret?: string;
    created_at: string;
  };
  passkeys?: Passkey[];
}

interface Passkey {
  id: string;           // base64url encoded credential ID
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
  perfilId: string;
  wrapped_mk?: string;
  auth_config: AuthConfig;
  metadata: UserMetadata;
  created_at: string;
  _v: number;
  _ts: string;
  _deleted?: boolean;
}
```

#### Tabla: `Perfiles`

```typescript
type Permiso = 'R' | 'W' | 'RW';

interface Permisos {
  [modulo: string]: Permiso;
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

#### Tabla: `Registro_Plugins`

```typescript
interface PluginConfig {
  [key: string]: any;
}

interface Plugin {
  plugin_id: string;
  ssId: string;
  status: 'active' | 'suspended';
  config?: PluginConfig;
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

---

### 2.2 Tipos de Respuesta de la API

```typescript
// Respuesta genérica del backend
interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

// Para getData
interface GetDataResponse<T = any[]> {
  success: true;
  data: T;
}

// Para saveData con conflicto de versión
interface VersionConflictResponse {
  success: false;
  error: 'ERR_VERSION_CONFLICT';
  message: string;
  currentVersion: number;
}

// Para login
interface LoginResponse {
  success: true;
  sessionToken: string;
  wrapped_mk?: string;
  expiresAt: string;
  user: {
    id: string;
    username: string;
    perfilId: string;
  };
}

// Login requiere segundo paso
interface LoginStepResponse {
  success: false;
  step: 'email_otp' | 'totp' | 'passkey';
  availableMethods: string[];
  message: string;
}

// Para validateSession
interface ValidateSessionResponse {
  valid: boolean;
  userId?: string;
  username?: string;
  expiresAt?: string;
}

// Para getPerfiles
interface GetPerfilesResponse {
  success: true;
  perfiles: Perfil[];
}

// Para getAuthMethods
interface AuthMethodsResponse {
  success: true;
  methods: string[];
  defaultMethod: string;
  passkeys: Array<{
    id: string;
    deviceName: string;
    createdAt: string;
  }>;
  totp: { enabled: boolean };
  email_otp: { enabled: boolean };
  recovery_enabled: boolean;
}
```

---

### 2.3 Tipos del DataService

```typescript
// Opciones para getData
interface GetDataOptions {
  filter?: string;       // Expresión JSONata: 'estado = "activo"'
  map?: string;         // Transformación JSONata: '{nombre, telefono}'
  sanitize?: boolean;   // Eliminar campos enc_*
  sort?: string;        // Orden JSONata: 'nombre asc'
  limit?: number;
  offset?: number;
}

// Opciones para saveData
interface SaveDataOptions {
  expectedVersion?: number;
  onlyIfNew?: boolean;
  validate?: string;    // JSONata validation
}

// Tipos de acción
type DataAction = 'getData' | 'batchGetData' | 'saveData' | 'deleteData' | 'hardDelete' | 'restoreData';
type AuthAction = 'login' | 'register' | 'logout' | 'validateSession' | 'refreshSession';
type ProfileAction = 'getPerfiles' | 'createProfile' | 'updateProfile' | 'deleteProfile';
type ConfigAction = 'getConfig' | 'setConfig';
```

---

## 3. Layer 1: DataService

### 3.1 Propósito

DataService es el cliente HTTP que comunica con el backend GAS. Maneja:
- Detección flexible de URL (Script ID ↔ full URL)
- Inyección automática de sessionToken
- Manejo de errores del backend
- Retry logic

### 3.2 Detección Flexible de URL

El sistema acepta两种 formatos de URL:

```typescript
// Formato 1: Script ID (corto)
// Ejemplo: '1Wse1_PzTarnbnBediQTtU5wf5WW9hVc7wnIU9vRt2RTmSp-EIy06Jrx5'
// Se convierte automáticamente a:
// 'https://script.google.com/macros/s/1Wse1_PzTarnbnBediQTtU5wf5WW9hVc7wnIU9vRt2RTmSp-EIy06Jrx5/exec'

// Formato 2: URL completa (larga)
// 'https://script.google.com/macros/s/AKfycby.../exec'
// Se usa tal cual
```

**Ubicación de la URL:**
- `localStorage` key: `'congre_admin_api_url'`
- Configurada durante Setup Wizard

### 3.3 Métodos Principales

```typescript
class DataService {
  // === Métodos CRUD ===

  /**
   * Obtiene datos de una hoja
   * GET ?action=getData&sheet=NombreHoja&ssId=ID
   */
  async getData<T = any[]>(sheet: string, ssId: string): Promise<T>;

  /**
   * Obtiene múltiples hojas en una petición
   * GET ?action=batchGetData&sheets=H1,H2,H3&ssId=ID
   */
  async batchGetData<T = Record<string, any[]>>(
    sheets: string[], 
    ssId: string
  ): Promise<T>;

  /**
   * Guarda o actualiza un registro (upsert)
   * POST { action: 'saveData', sheet, ssId, payload, ... }
   */
  async saveData(
    sheet: string, 
    ssId: string, 
    payload: any,
    options?: SaveDataOptions
  ): Promise<ApiResponse>;

  /**
   * Borra lógicamente un registro
   * POST { action: 'deleteData', sheet, ssId, id }
   */
  async deleteData(
    sheet: string, 
    ssId: string, 
    id: string
  ): Promise<ApiResponse>;

  /**
   * Borra físicamente un registro
   * POST { action: 'hardDelete', sheet, ssId, id }
   */
  async hardDelete(
    sheet: string, 
    ssId: string, 
    id: string
  ): Promise<ApiResponse>;

  /**
   * Restaura un registro borrado
   * POST { action: 'restoreData', sheet, ssId, id }
   */
  async restoreData(
    sheet: string, 
    ssId: string, 
    id: string
  ): Promise<ApiResponse>;

  // === Métodos de Autenticación ===

  /**
   * Login de usuario
   * Soporta múltiples métodos: password, passkey, totp, email_otp
   */
  async login(payload: LoginPayload): Promise<LoginResponse | LoginStepResponse>;

  /**
   * Registro de nuevo usuario
   */
  async register(payload: RegisterPayload): Promise<ApiResponse & { user: User }>;

  /**
   * Cierra sesión
   */
  async logout(sessionToken: string): Promise<ApiResponse>;

  /**
   * Valida sesión actual
   */
  async validateSession(sessionToken: string): Promise<ValidateSessionResponse>;

  /**
   * Renueva token de sesión
   */
  async refreshSession(sessionToken: string): Promise<ApiResponse & { sessionToken: string }>;

  // === Métodos de Perfiles ===

  /**
   * Obtiene todos los perfiles
   */
  async getPerfiles(): Promise<GetPerfilesResponse>;

  /**
   * Crea perfil
   */
  async createProfile(payload: Partial<Perfil>): Promise<ApiResponse>;

  /**
   * Actualiza perfil
   */
  async updateProfile(payload: Partial<Perfil>): Promise<ApiResponse>;

  /**
   * Elimina perfil
   */
  async deleteProfile(profileId: string): Promise<ApiResponse>;

  // === Métodos de Configuración ===

  /**
   * Obtiene valor de configuración
   */
  async getConfig(key: string, ssId: string): Promise<Configuracion | null>;

  /**
   * Guarda configuración
   */
  async setConfig(
    key: string, 
    value: string, 
    ssId: string,
    isPublic?: boolean
  ): Promise<ApiResponse>;
}
```

### 3.4 Manejo de Errores

El backend retorna códigos de error prefixed con `ERR_`. DataService los parsea y lanza excepciones typed:

```typescript
// Códigos de error del backend
const ERROR_CODES = {
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
} as const;
```

---

### 3.5 Sistema de Caché

#### 3.5.1 Descripción

El DataService implementa un sistema de caché de **tres niveles**:

```
┌─────────────────────────────────────────────────────┐
│  READ: Memory (fast)                               │
│  ↓ (cache miss)                                    │
│  READ: localStorage                                │
│  ↓ (first load or stale)                           │
│  FETCH: GSheets (source of truth)                 │
│  ↓ (compare)                                       │
│  UPDATE: Memory + localStorage if different        │
└─────────────────────────────────────────────────────┘
```

#### 3.5.2 Datos en Caché

| Data | Key | Source Table | Cache Expiry |
|------|-----|--------------|--------------|
| Module ssIds | `congre_cache_modules` | `Registro_Plugins` | 24 horas |
| Config values | `congre_cache_config` | `Configuracion` | 24 horas |
| User perfil | `congre_cache_user_perfil` | `Perfiles` | 24 horas |
| User permisos | `congre_cache_user_permisos` | `Perfil.permisos` | 24 horas |
| Public ssId | `congre_cache_public_ss` | `Configuracion` (key: `ss_publico`) | 24 horas |

#### 3.5.3 Flujo de Inicialización

```typescript
// On app load: initializeCache()
1. Load all cached data from localStorage → Memory
2. Mark cache as "loaded" (may be stale)

// On login: refreshCacheOnLogin()
1. Check cache expiry (24h). If expired or missing:
2. Fetch fresh from GSheets (Registro_Plugins, Configuracion, Perfiles)
3. Compare with memory cache
4. Update if different

// On logout: clearAllCache()
1. Clear memory cache
2. Clear all localStorage cache keys
```

#### 3.5.4 Resolución de Módulos

```typescript
async resolveModule(moduleOrSsId: string): Promise<string> {
  // Direct ssId (26+ chars)
  if (moduleOrSsId.length > 20) return moduleOrSsId;
  
  // From cache (module name → ssId)
  const cachedSsId = cacheService.getModuleSsId(moduleOrSsId);
  if (cachedSsId) return cachedSsId;
  
  // Fetch from Registro_Plugins, cache, return
  const ssId = await this.fetchModuleSsId(moduleOrSsId);
  cacheService.setModuleSsId(moduleOrSsId, ssId);
  return ssId;
}
```

---

## 4. Layer 2: DataTransformService

### 4.1 Propósito

DataTransformService aplica transformaciones JSONata sobre los datos obtenidos del backend. Permite:
- Filtrado avanzado
- Transformación de campos
- Sanitización (eliminar campos sensibles)
- Validación antes de guardar
- Ordenamiento

### 4.2 Métodos

```typescript
class DataTransformService {
  /**
   * Evalúa expresión JSONata sobre datos
   */
  evaluate<T = any>(expression: string, data: any): T;

  /**
   * Filtra datos usando expresión JSONata
   * @example filter(data, 'estado = "activo"')
   */
  filter<T>(data: T[], filterExpr: string): T[];

  /**
   * Mapea/transforma campos
   * @example map(data, '{nombre, telefono: enc_telefono}')
   */
  map<T, R>(data: T[], mapExpr: string): R[];

  /**
   * Ordena datos
   * @example sort(data, 'nombre asc')
   */
  sort<T>(data: T[], sortExpr: string): T[];

  /**
   * Sanitiza: elimina todos los campos enc_*
   * Útil para vista pública
   */
  sanitize<T>(data: T): T;
  sanitize<T>(data: T[]): T[];

  /**
   * Valida datos contra expresión JSONata
   * @example validate(data, '$count(errors) = 0')
   * Retorna array de errores (vacío = válido)
   */
  validate<T>(data: T, validationExpr: string): string[];

  /**
   * Combina: filtra + mapea + ordena + limita
   */
  process<T>(
    data: T[], 
    options: {
      filter?: string;
      map?: string;
      sort?: string;
      limit?: number;
      offset?: number;
    }
  ): T[];
}
```

### 4.3 Expresiones JSONata Comunes

#### Filtrar por estado
```jsonata
$filter(personas, function($p) { $p.estado = "activo" })
```

#### Filtrar por grupo
```jsonata
$filter(personas, function($p) { $p.grupo = "A" })
```

#### Búsqueda texto
```jsonata
$filter(personas, function($p) { $p.nombre =~ /juan/i })
```

#### Sanitizar campos cifrados
```jsonata
$map(personas, function($r) { 
  $merge([$filter($r, function($v, $k) { not($k =~ "^enc_") }), {}]) 
})
```

#### Mapear con renombrado
```jsonata
$map(personas, function($p) { 
  {
    id: $p.id,
    nombre: $p.nombre,
    telefono: $p.enc_telefono,
    direccion: $p.enc_direccion
  }
})
```

#### Ordenar
```jsonata
$sort(personas, function($a, $b) { $a.nombre < $b.nombre })
```

---

## 5. Layer 3: TanStack Query Hooks

### 5.1 Propósito

Los hooks proporcionan una capa de conveniencia sobre DataService:
- Fetching automático con caché
- Estados de loading/error
- Invalidación automática tras mutaciones
- Keys consistentes para caché

### 5.2 Query Keys (Flat)

```typescript
// Keys planos (una cache por tipo de dato)
const QUERY_KEYS = {
  personas: ['personas'],
  perfiles: ['perfiles'],
  config: (key: string) => ['config', key] as const,
  session: ['session'],
  authMethods: ['authMethods'],
} as const;
```

### 5.3 Hooks Predefinidos

```typescript
// === usePersonas ===

function usePersonas(ssId: string | undefined) {
  // Query: getData('Personas', ssId)
  // Key: ['personas']
  // StaleTime: 5 minutos
}

function usePersonaFilter(ssId: string | undefined, filters: PersonaFilters) {
  // Obtiene personas + aplica JSONata (filter, search, sort)
  // Filtros: grupo?, estado?, search?
}

function useActivos(ssId: string | undefined) {
  // Filtra automáticamente: estado = "activo"
}

function useSavePersona() {
  // Mutation: saveData + invalidateQueries(['personas'])
}

function useDeletePersona() {
  // Mutation: deleteData + invalidateQueries(['personas'])
}

// === usePerfiles ===

function usePerfiles() {
  // Query: getPerfiles()
  // Key: ['perfiles']
}

function useSavePerfil() {
  // Mutation: createProfile/updateProfile + invalidate
}

function useDeletePerfil() {
  // Mutation: deleteProfile + invalidate
}

// === useConfig ===

function useConfig(ssId: string | undefined, key: string) {
  // Query: getConfig(key, ssId)
  // Key: ['config', key]
}

function useSetConfig() {
  // Mutation: setConfig + invalidate(['config', key])
}

// === useSession ===

function useSession() {
  // Query: validateSession(token)
  // Key: ['session']
  // No cache - siempre refetch
}

function useLogout() {
  // Mutation: logout + clear cache + redirect
}

// === useAuthMethods ===

function useAuthMethods() {
  // Query: getAuthMethods()
  // Key: ['authMethods']
}
```

### 5.4 Opciones por Defecto

```typescript
const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000,  // 5 minutos
  retry: 1,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
};

const defaultMutationOptions = {
  retry: 0,
  onError: (error) => {
    // Mostrar toast de error
  },
};
```

---

## 6. Servicios Adicionales

### 6.1 AuthService

Servicios de autenticación separados (para modularidad):

```typescript
class AuthService {
  // Login con método específico
  async loginWithPassword(username: string, password: string): Promise<LoginResponse>;
  async loginWithPasskey(username: string, assertion: any): Promise<LoginResponse>;
  async loginWithTOTP(username: string, code: string): Promise<LoginResponse>;
  async loginWithEmailOTP(username: string, code: string): Promise<LoginResponse>;

  // Registro
  async register(username: string, password: string, perfilId: string): Promise<ApiResponse>;

  // Gestión de auth
  async setupTOTP(username: string, password: string): Promise<{ secret: string; otpURI: string }>;
  async confirmTOTP(username: string, code: string): Promise<ApiResponse>;
  async setupPasskey(username: string, deviceName: string, origin: string): Promise<any>;
  async confirmPasskey(username: string, attestation: any): Promise<ApiResponse>;
  async deletePasskey(passkeyId: string): Promise<ApiResponse>;

  // Cambio de contraseña
  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse>;
}
```

### 6.2 PublicService

Consumo de datos públicos via `/gviz/tq` (sin autenticación):

```typescript
class PublicService {
  /**
   * Obtiene datos públicos directamente del GSheet
   * No usa GAS, usa Google Visualization API
   */
  async getPublicData<T = any[]>(
    ssId: string, 
    sheet: string,
    query?: string  // SQL-like query
  ): Promise<T>;

  /**
   * Obtiene múltiples hojas públicas
   */
  async batchGetPublicData(
    ssId: string,
    sheets: string[]
  ): Promise<Record<string, any[]>>;
}
```

**Nota**: PublicService es para la app pública (`/`). No inyecta sessionToken ni maneja errores de autenticación.

---

## 7. Integración con AuthContext

### 7.1 Flujo Actual (Sin DataService)

```
User → Login.tsx → AuthContext.login() → localStorage
```

### 7.2 Flujo Propuesto (Con DataService)

```
User → Login.tsx → authService.login() 
                    ↓
              AuthContext.setSession()
                    ↓
              localStorage + hooks disponibles
```

### 7.3 Cambios en AuthContext

**Extraer a authService:**
- `login()` → authService.login()
- `logout()` → authService.logout()
- `validateSession()` → authService.validateSession()

**Mantener en AuthContext:**
- `user` state
- `isAuthenticated` derived
- `sessionToken` getter
- `wrapped_mk` getter

---

## 8. Uso en Componentes

### 8.1 Ejemplo: Lista de Personas

```typescript
import { usePersonaFilter, useSavePersona, useDeletePersona } from '@/hooks/usePersonas';

interface Props {
  ssId: string;
}

export function PersonaList({ ssId }: Props) {
  const [search, setSearch] = useState('');
  
  const { data: personas, isLoading, error } = usePersonaFilter(ssId, {
    estado: 'activo',
    search,
  });

  const savePersona = useSavePersona();
  const deletePersona = useDeletePersona();

  const handleDelete = async (id: string) => {
    await deletePersona.mutateAsync({ ssId, id });
  };

  if (isLoading) return <Skeleton />;
  if (error) return <Alert>{error.message}</Alert>;

  return (
    <DataTable
      data={personas}
      onDelete={handleDelete}
    />
  );
}
```

### 8.2 Ejemplo: Raw Fetch + JSONata

```typescript
import { dataService } from '@/services/dataService';
import { dataTransformService } from '@/services/dataTransformService';

async function ejemploAvanzado(ssId: string) {
  // Layer 1: Fetch raw
  const raw = await dataService.getData('Personas', ssId);
  
  // Layer 2: Apply JSONata
  const activos = dataTransformService.filter(raw, 'estado = "activo"');
  const sanitized = dataTransformService.sanitize(activos);
  const ordenados = dataTransformService.sort(sanitized, 'nombre asc');
  
  return ordenados;
}
```

---

## 9. Implementación Recomendada

### Orden de Implementación

1. **Types** (`src/types/*.ts`) — Interfaces primero
2. **cacheService.ts** — Memory + localStorage with 24h expiry
3. **dataService.ts** — Cliente HTTP + module resolution
4. **dataTransformService.ts** — JSONata wrapper
5. **authService.ts** — Auth operations
6. **publicService.ts** — `/gviz/tq` fetcher
7. **Hooks** — TanStack Query wrappers
8. **main.tsx** — Add QueryClientProvider
9. **AuthContext** — Integrate cache on login/logout

### Dependencies Internas

```
types/            ← Dependencias externas (ninguna)
    ↑
cacheService.ts   ← types/, idb-keyval
    ↑
dataService.ts    ← types/, cacheService
    ↑
dataTransformService.ts ← types/, jsonata
    ↑
hooks/            ← dataService, dataTransformService, @tanstack/react-query
```

---

## 10. Configuración de main.tsx

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/admin/*" element={
              <AuthProvider>
                <AdminApp />
              </AuthProvider>
            } />
            <Route path="/*" element={<PublicApp />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

---

## 11. Próximos Pasos

- [ ] Implementar tipos en `src/types/`
- [ ] Implementar `dataService.ts`
- [ ] Implementar `dataTransformService.ts`
- [ ] Implementar `authService.ts`
- [ ] Implementar `publicService.ts`
- [ ] Implementar hooks en `src/hooks/`
- [ ] Agregar QueryClientProvider a `main.tsx`
- [ ] Refactorizar AuthContext para usar authService

---

## 12. Referencias

- [Backend API Completa](./Backend_API_Completa.md)
- [Autenticación](./Autenticacion.md)
- [TanStack Query Docs](https://tanstack.com/query)
- [JSONata Docs](https://jsonata.org/)
- [Estructura del Proyecto](./Estructura_Proyecto.md)
- [Tecnología](./Tecnologia.md)
