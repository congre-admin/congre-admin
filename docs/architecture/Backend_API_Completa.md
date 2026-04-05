# Congre-Admin: Documentación Técnica del Backend API

> **Versión:** 2.1.0
> **Última actualización:** 2026-04-04
> **Archivo fuente:** `backend/src/api.gs`
> **Plataforma:** Google Apps Script (GAS)

---

## 1. Resumen Ejecutivo

El Backend de Congre-Admin es un proveedor de servicios implementado como Google Apps Script que utiliza Google Sheets como base de datos distribuida. El sistema sigue una arquitectura de **Segmentación Física de Datos** donde cada módulo/plugin tiene su propio spreadsheet.

### Cambios en v2.1

| Cambio | Descripción |
|--------|-------------|
| **Permisos granulares** | Formato jerárquico: `"core":{"configuracion":"RW","*":"R"}`. Backward compatible con formato plano `"core":"RW"` |
| **Módulo dinámico** | Módulo derivado de `Registro_Plugins` (ssId → plugin_id). Zero valores hardcoded |
| **Setup mode** | `batchExecute` soporta `isSetup: true` para bypass de sesión durante instalación |
| **Module resolution** | Frontend resuelve módulo desde caché de `Registro_Plugins`, envía en cada request |

### Cambios en v2.0

| Cambio | Descripción |
|--------|-------------|
| **`batchExecute`** | Nueva función unificada que reemplaza `batchGetData`, `batchSaveData`, `batchDeleteData`, `batchInitSheet` |
| **Zero Script Properties** | Eliminada dependencia de `getCurrentSsId()`. Todo `ssId` se pasa explícitamente |
| **CRUD protegido** | Todas las operaciones de escritura requieren sesión válida + permisos RBAC |
| **Funciones eliminadas** | `disableTOTP`, `deleteAccount`, `updateAuthConfig`, `getPerfiles`, `getPermisos`, `checkPermission`, `createProfile`, `updateProfile`, `deleteProfile` |
| **Optimización** | `softDeleteRow` usa 1× `setValues()` en lugar de 3× `setValue()` |
| **~43% reducción** | De 3,053 a ~1,750 líneas de código |

### Características Principales

| Característica | Implementación |
|----------------|----------------|
| **Autenticación** | Username + Password (SHA-256) + TOTP / Email OTP / Passkey |
| **Gestión de Sesiones** | Token UUID con índice híbrido (memoria + caché) |
| **Permisos** | RBAC basado en perfiles con permisos por módulo |
| **Versionado** | Last Write Wins con detección de conflictos |
| **Borrado** | Soft Delete (borrado lógico) |
| **Caché** | CacheService con TTL configurable + caché intra-batch |
| **Rate Limiting** | Por usuario en acciones de autenticación |
| **TOTP** | Implementación nativa GAS (sin librerías externas) |
| **Batch Orchestration** | `batchExecute` con modos `continue` y `fail-fast` |
| **Drive Folder** | Carpeta Drive por instalación con subfolders y gestión de archivos |
| **Batch File Ops** | File operations (upload, download, list, delete, share, move) available inside `batchExecute` |

---

## 2. Estructura del GSheet Core

El Core es el orquestador central que contiene la configuración maestra del sistema.

### 2.1 Tablas Obligatorias

#### Tabla: `Usuarios`
Almacena las credenciales y configuración de usuarios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único del usuario |
| `username` | string | Nombre de usuario (único) |
| `wrapped_mk` | string | Master Key cifrada con la contraseña |
| `perfilId` | string | ID del perfil asignado (ej: `p_admin`) |
| `auth_config` | JSON | Objeto con configuración de autenticación |
| `metadata` | JSON | Objeto con metadatos del usuario |
| `created_at` | ISO 8601 | Fecha de creación |
| `_v` | número | Versión del registro |
| `_ts` | ISO 8601 | Timestamp de última modificación |
| `_deleted` | boolean | Borrado lógico |

> **Nota:** La contraseña se verifica comparando el hash SHA-256 del input con `password_hash` dentro de `auth_config`. Los passkeys se almacenan en el array `passkeys` dentro de `auth_config`.

##### Estructura del campo `auth_config`

```json
{
  "default_method": "passkey",
  "password_hash": "sha256_hash_de_la_contraseña",
  "recovery_enabled": true,
  "email_otp": {
    "enabled": true,
    "created_at": "2026-03-29T10:56:40.158Z"
  },
  "totp": {
    "enabled": true,
    "secret": "REBZZYCVNCYWVNUBRENZ",
    "created_at": "2026-03-29T23:45:40.210Z"
  },
  "passkeys": [
    {
      "id": "base64url_encoded_credential_id",
      "public_key": "",
      "device_name": "Windows PC",
      "created_at": "2026-03-30T02:25:43.497Z"
    }
  ]
}
```

##### Estructura del campo `metadata`

```json
{
  "last_login": "2026-03-30T10:00:00Z",
  "last_password_change": "2026-03-01T08:30:00Z",
  "failed_login_attempts": 0,
  "created_from_ip": "192.168.1.1"
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `last_login` | ISO 8601 | Fecha y hora del último inicio de sesión |
| `last_password_change` | ISO 8601 | Fecha y hora del último cambio de contraseña |
| `failed_login_attempts` | número | Contador de intentos de inicio de sesión fallidos |
| `created_from_ip` | string | Dirección IP desde donde se creó la cuenta |

#### Tabla: `Perfiles`
Define los perfiles de usuario y sus permisos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID del perfil (ej: `p_admin`, `p_secretario`) |
| `nombre` | string | Nombre descriptivo |
| `permisos` | JSON | Mapa de permisos por módulo |
| `descripcion` | string | Descripción del perfil |
| `_v` | número | Versión del registro |
| `_ts` | ISO 8601 | Timestamp de última modificación |
| `_deleted` | boolean | Borrado lógico |

**Permisos soportados:**
- `R` - Solo lectura
- `W` - Solo escritura
- `RW` - Lectura y escritura

#### Tabla: `Registro_Plugins`
Mapea los módulos con sus respectivos spreadsheets.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `plugin_id` | string | Identificador del plugin |
| `ssId` | string | ID del Google Sheet del plugin |
| `status` | string | Estado: `active`, `suspended` |
| `config` | JSON | Configuración específica del plugin |
| `_v` | número | Versión del registro |
| `_ts` | ISO 8601 | Timestamp de última modificación |
| `_deleted` | boolean | Borrado lógico |

#### Tabla: `Configuracion`
Almacena la configuración global del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `clave` | string | Identificador de la configuración |
| `valor` | string | Valor de la configuración |
| `is_public` | boolean | Si es accesible sin login |
| `_v` | número | Versión del registro |
| `_ts` | ISO 8601 | Timestamp de última modificación |
| `_deleted` | boolean | Borrado lógico |

#### Tabla: `Sistema_Migraciones`
Registra las migraciones de esquema ejecutadas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID de la migración |
| `nombre` | string | Nombre de la migración |
| `version` | string | Versión del esquema |
| `ejecutada_en` | ISO 8601 | Fecha de ejecución |
| `estado` | string | Estado: `success`, `failed`, `pending` |
| `error` | string | Mensaje de error (si aplica) |
| `_v` | número | Versión del registro |
| `_ts` | ISO 8601 | Timestamp de última modificación |

#### Tabla: `Logs_Accesos`
Registra todos los intentos de acceso (auto-creada por `logAccess`).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `timestamp` | ISO 8601 | Fecha y hora |
| `username` | string | Usuario |
| `success` | YES/NO | Si fue exitoso |
| `details` | string | Detalles adicionales |
| `ip` | string | IP del cliente |

---

## 3. Referencia de la API

### 3.1 Estructura de Petición

Todas las peticiones se envían vía `POST` al endpoint del GAS:

```json
{
  "action": "nombre_de_accion",
  "payload": {
    "ssId": "ID_DEL_SPREADSHEET",
    "coreSsId": "ID_DEL_CORE_SPREADSHEET",
    "module": "nombre_del_modulo",
    "sessionToken": "TOKEN_DE_SESION"
  },
  "sheet": "NOMBRE_DE_HOJA",
  "expectedVersion": NUMERO
}
```

> **Nota v2.0:** `ssId` y `sessionToken` pueden estar en `payload` o al nivel superior de la petición. El backend los extrae de ambos lugares.

> **Nota v2.1:** `coreSsId` y `module` se envían automáticamente desde el frontend en cada request. `coreSsId` permite derivar el módulo dinámicamente. `module` se resuelve desde el mapa de `Registro_Plugins` cacheado en `localStorage`.

### 3.2 Acciones Disponibles

#### A. Acciones de Datos (Requieren sesión + RBAC para escritura)

##### `getData`
Obtiene datos de una hoja específica. Valida permisos si se proporciona sessionToken.

```javascript
{
  "action": "getData",
  "payload": { "ssId": "ID_SPREADSHEET" },
  "sheet": "Personas"
}

// Response
{
  "success": true,
  "data": [
    { "id": "uuid-1", "nombre": "Valor", "_v": 1, "_ts": "...", "_deleted": false },
    { "id": "uuid-2", "nombre": "Otro", "_v": 3, "_ts": "...", "_deleted": false }
  ]
}
```

##### `batchExecute` (NUEVO — v2.0)
Ejecuta múltiples operaciones en una sola llamada API. Reemplaza `batchGetData`, `batchSaveData`, `batchDeleteData`, `batchInitSheet`.

**Operaciones de hoja:** `read`, `readById`, `save`, `delete`, `hardDelete`, `restore`, `initSheet`

**Operaciones de archivo (Drive):** `uploadFile`, `downloadFile`, `listFolderFiles`, `deleteFile`, `setFileSharing`, `moveFileToFolder`

**Modos de ejecución:**
- `continue` (default): Ejecuta todas las operaciones, retorna éxito parcial
- `fail-fast`: Detiene al primer error

**Modo setup (v2.1):**
- `isSetup: true`: Bypass de sesión y RBAC para operaciones `initSheet` y `save` únicamente. Usado durante la instalación inicial.

```javascript
{
  "action": "batchExecute",
  "payload": {
    "ssId": "ID_SPREADSHEET",
    "coreSsId": "CORE_SS_ID",
    "module": "core",
    "folderId": "DRIVE_FOLDER_ID",
    "sessionToken": "TOKEN",
    "mode": "continue",
    "isSetup": false,
    "operations": [
      { "op": "read", "sheet": "Configuracion" },
      { "op": "read", "sheet": "Perfiles" },
      { "op": "save", "sheet": "Personas", "data": { "id": "p_001", "nombre": "Juan" } },
      { "op": "delete", "sheet": "Registros", "id": "r_045" },
      { "op": "initSheet", "sheet": "NuevaHoja", "headers": ["id", "nombre", "_v", "_ts", "_deleted"] },
      { "op": "uploadFile", "subfolder": "documentos", "fileName": "reporte.pdf", "mimeType": "application/pdf", "content": "base64..." },
      { "op": "listFolderFiles", "subfolder": "documentos" },
      { "op": "setFileSharing", "fileId": "drive_file_id", "access": "ANYONE_WITH_LINK", "permission": "VIEW" }
    ]
  }
}

// Response
{
  "success": true,
  "results": [
    { "index": 0, "op": "read", "sheet": "Configuracion", "success": true, "data": [...] },
    { "index": 1, "op": "read", "sheet": "Perfiles", "success": true, "data": [...] },
    { "index": 2, "op": "save", "sheet": "Personas", "success": true },
    { "index": 3, "op": "delete", "sheet": "Registros", "success": true },
    { "index": 4, "op": "initSheet", "sheet": "NuevaHoja", "success": true }
  ],
  "totalOps": 5,
  "succeeded": 5,
  "failed": 0
}
```

**Migración desde funciones batch anteriores:**

| Antes (v1.x) | Ahora (v2.0) |
|-------------|-------------|
| `batchGetData` con `sheets: ["A","B"]` | `batchExecute` con ops `[{op:"read",sheet:"A"},{op:"read",sheet:"B"}]` |
| `batchSaveData` con `rows: [...]` | `batchExecute` con ops `[{op:"save",sheet:"X",data:{...}}, ...]` |
| `batchDeleteData` con `ids: [...]` | `batchExecute` con ops `[{op:"delete",sheet:"X",id:"..."}, ...]` |
| `batchInitSheet` con `tables: [...]` | `batchExecute` con ops `[{op:"initSheet",sheet:"X",headers:[...]}, ...]` |

**Límites:**
- Máximo 50 operaciones por llamada (`ERR_BATCH_TOO_LARGE`) — incluye ops de hoja y archivo combinadas
- Todas las operaciones apuntan al mismo `ssId` y `folderId`
- RBAC se valida antes de ejecutar cualquier operación (pre-check)
- Caché intra-batch: cada hoja se lee una vez y se reutiliza
- Archivos: max 37MB por upload, MIME type debe estar en whitelist

**Operaciones de archivo en batch:**

| Op | Parámetros | RBAC | Response data |
|----|-----------|------|---------------|
| `uploadFile` | `subfolder`, `fileName`, `mimeType`, `content` (base64) | `write` en `core` | `{ fileId, fileUrl, fileName, size }` |
| `downloadFile` | `fileId` | `read` en `core` | `{ fileName, mimeType, size, content }` |
| `listFolderFiles` | `subfolder` (opcional) | `read` en `core` | `{ files: [...] }` |
| `deleteFile` | `fileId` | `write` en `core` | — |
| `setFileSharing` | `fileId`, `access`, `permission` | `write` en `core` | `{ fileId, access, permission, shareUrl }` |
| `moveFileToFolder` | `fileId`, `subfolder` | `write` en `core` | `{ fileId, fileName, folderId, fileUrl }` |

##### `saveData`
Guarda o actualiza un registro (operación upsert). Requiere sesión + permiso `write`.

```javascript
{
  "action": "saveData",
  "sheet": "Personas",
  "payload": { "ssId": "ID_SPREADSHEET", "sessionToken": "TOKEN" },
  "payload": {
    "id": "uuid-o-nuevo",
    "nombre": "Juan Pérez"
  },
  "expectedVersion": 1
}

// Response - Éxito
{ "success": true, "message": "Datos guardados" }

// Response - Conflicto de versión
{ "success": false, "error": "ERR_VERSION_CONFLICT" }
```

##### `deleteData`
Marca un registro como borrado (soft delete). Requiere sesión + permiso `write`.

```javascript
{
  "action": "deleteData",
  "sheet": "Personas",
  "payload": { "ssId": "ID_SPREADSHEET", "sessionToken": "TOKEN", "id": "UUID" }
}

// Response
{ "success": true, "message": "Borrado lógico realizado" }
```

##### `hardDelete`
Borrado físico (definitivo). Requiere sesión + permiso `write`.

```javascript
{
  "action": "hardDelete",
  "sheet": "Personas",
  "payload": { "ssId": "ID_SPREADSHEET", "sessionToken": "TOKEN", "id": "UUID" }
}
```

##### `restoreData`
Restaura un registro borrado lógicamente. Requiere sesión + permiso `write`.

```javascript
{
  "action": "restoreData",
  "sheet": "Personas",
  "payload": { "ssId": "ID_SPREADSHEET", "sessionToken": "TOKEN", "id": "UUID" }
}
```

##### `initSheet`
Inicializa una hoja con cabeceras. Requiere sesión + permiso `write`.

```javascript
{
  "action": "initSheet",
  "sheet": "NuevaHoja",
  "payload": { "ssId": "ID_SPREADSHEET", "sessionToken": "TOKEN" },
  "headers": ["id", "nombre", "_v", "_ts", "_deleted"],
  "preserveExisting": false
}
```

##### `clearSheet`
Limpia el contenido de una hoja manteniendo las cabeceras. Requiere sesión + permiso `write`.

```javascript
{
  "action": "clearSheet",
  "sheet": "Personas",
  "payload": { "ssId": "ID_SPREADSHEET", "sessionToken": "TOKEN" }
}
```

#### B. Acciones de Autenticación

##### `register`
Crea un nuevo usuario.

```javascript
{
  "action": "register",
  "payload": {
    "ssId": "CORE_SS_ID",
    "username": "admin",
    "email": "admin@congregacion.com",
    "password": "MiContraseña123!",
    "wrapped_mk": "MASTER_KEY_CIFRADA",
    "perfilId": "p_admin"
  }
}
```

##### `login`
Autentica al usuario. La contraseña siempre es el primer paso.

```javascript
// Paso 1: username + password
{
  "action": "login",
  "payload": {
    "ssId": "CORE_SS_ID",
    "username": "admin",
    "password": "MiContraseña123!"
  }
}

// Response: requiere segundo factor
{
  "success": false,
  "step": "totp",
  "availableMethods": ["passkey", "totp", "email_otp"],
  "message": "Ingrese su código"
}

// Paso 2: Con segundo factor
{
  "action": "login",
  "payload": {
    "ssId": "CORE_SS_ID",
    "username": "admin",
    "password": "MiContraseña123!",
    "method": "totp",
    "code": "123456"
  }
}

// Response exitoso
{
  "success": true,
  "sessionToken": "uuid_token",
  "wrapped_mk": "MASTER_KEY_CIFRADA",
  "expiresAt": "2026-04-04T10:00:00Z",
  "user": { "id": "uuid", "username": "admin", "perfilId": "p_admin" }
}
```

##### `challenge`
Genera un desafío para Passkey/WebAuthn durante el login.

```javascript
{
  "action": "challenge",
  "payload": {
    "ssId": "CORE_SS_ID",
    "username": "admin",
    "origin": "https://congre-admin.github.io"
  }
}

// Response
{
  "success": true,
  "challenge": "base64_encoded_challenge",
  "rpId": "congre-admin.github.io",
  "timeout": 60000,
  "allowCredentials": [{ "id": "credential_id", "type": "public-key" }],
  "userVerification": "preferred"
}
```

##### `setupTOTP`
Genera secreto TOTP para configurar Google Authenticator.

```javascript
{
  "action": "setupTOTP",
  "payload": {
    "ssId": "CORE_SS_ID",
    "username": "admin",
    "password": "MiContraseña123!"
  }
}

// Response
{
  "success": true,
  "secret": "JBSWY3DPEHPK3PXP",
  "otpURI": "otpauth://totp/CongreAdmin:admin?secret=JBSWY3DPEHPK3PXP&issuer=CongreAdmin&algorithm=SHA1&digits=6&period=30"
}
```

##### `confirmTOTP`
Confirma la configuración de TOTP.

```javascript
{
  "action": "confirmTOTP",
  "payload": {
    "ssId": "CORE_SS_ID",
    "username": "admin",
    "password": "MiContraseña123!",
    "code": "123456"
  }
}
```

##### `setupPasskey`
Genera un desafío para registrar un nuevo passkey.

```javascript
{
  "action": "setupPasskey",
  "payload": {
    "ssId": "CORE_SS_ID",
    "username": "admin",
    "password": "MiContraseña123!",
    "deviceName": "Windows PC",
    "origin": "https://congre-admin.github.io"
  }
}
```

##### `confirmPasskey`
Confirma el registro de un passkey.

```javascript
{
  "action": "confirmPasskey",
  "payload": {
    "ssId": "CORE_SS_ID",
    "username": "admin",
    "password": "MiContraseña123!",
    "attestation": {
      "id": "credential_id_from_browser",
      "response": { "publicKey": "" }
    }
  }
}
```

##### `deletePasskey`
Elimina un passkey registrado. Requiere sesión.

```javascript
{
  "action": "deletePasskey",
  "payload": {
    "ssId": "CORE_SS_ID",
    "sessionToken": "TOKEN",
    "passkeyId": "id_del_passkey"
  }
}
```

##### `requestOTP`
Envía código OTP por email.

```javascript
{
  "action": "requestOTP",
  "payload": {
    "ssId": "CORE_SS_ID",
    "username": "admin"
  }
}
```

##### `getAuthMethods`
Obtiene métodos de autenticación habilitados. Requiere sesión.

```javascript
{
  "action": "getAuthMethods",
  "payload": {
    "ssId": "CORE_SS_ID",
    "sessionToken": "TOKEN"
  }
}

// Response
{
  "success": true,
  "methods": ["passkey", "totp", "email_otp"],
  "defaultMethod": "passkey",
  "passkeys": [...],
  "totp": { "enabled": true },
  "email_otp": { "enabled": true },
  "recovery_enabled": true
}
```

##### `setDefaultAuthMethod` (NUEVO — v2.0)
Establece el método de autenticación predeterminado. Requiere sesión.

```javascript
{
  "action": "setDefaultAuthMethod",
  "payload": {
    "ssId": "CORE_SS_ID",
    "sessionToken": "TOKEN",
    "method": "totp"
  }
}
```

##### `changePassword`
Cambia la contraseña del usuario. Requiere sesión.

```javascript
{
  "action": "changePassword",
  "payload": {
    "ssId": "CORE_SS_ID",
    "sessionToken": "TOKEN",
    "old_password": "actual",
    "new_password": "nueva"
  }
}
```

##### `requestPasswordReset`
Solicita email de restablecimiento de contraseña.

```javascript
{
  "action": "requestPasswordReset",
  "payload": {
    "ssId": "CORE_SS_ID",
    "username": "admin"
  }
}
```

##### `confirmPasswordReset` (NUEVO — v2.0, renombrada de `resetPassword`)
Restablece la contraseña con un token de recuperación.

```javascript
{
  "action": "confirmPasswordReset",
  "payload": {
    "ssId": "CORE_SS_ID",
    "userId": "uuid-usuario",
    "token": "reset_token",
    "newPassword": "NuevaContraseña123!"
  }
}
```

##### `validateSession`
Valida un token de sesión.

```javascript
{
  "action": "validateSession",
  "payload": {
    "ssId": "CORE_SS_ID",
    "sessionToken": "TOKEN"
  }
}

// Response
{ "valid": true, "userId": "uuid-usuario" }
```

##### `refreshSession`
Renueva el token de sesión.

```javascript
{
  "action": "refreshSession",
  "payload": { "sessionToken": "TOKEN" }
}
```

##### `logout`
Cierra la sesión actual.

```javascript
{
  "action": "logout",
  "payload": { "sessionToken": "TOKEN" }
}
```

#### C. Acción de Instalación

##### `install`
Crea los spreadsheets Core y Público.

```javascript
{
  "action": "install",
  "payload": {
    "nombreCongregacion": "Congregación Central",
    "nombreMostrar": "Co. Central"
  }
}

// Response
{
  "success": true,
  "ssId": "CORE_SS_ID",
  "ssUrl": "https://docs.google.com/spreadsheets/d/...",
  "publicSsId": "PUBLIC_SS_ID",
  "publicSsUrl": "https://docs.google.com/spreadsheets/d/...",
  "nombreCongregacion": "Congregación Central",
  "nombreMostrar": "Co. Central"
}
```

---

## 4. Sistema de Permisos RBAC

### 4.1 Estructura de Perfiles

| Perfil ID | Nombre | Permisos |
|-----------|--------|----------|
| `p_admin` | Super-Admin | RW en todos los módulos |
| `p_secretario` | Secretario | Granular: core R, personas RW, registros RW, anuncios RW, reuniones R, predicación R |
| `p_comite` | Comité de Servicio | Granular: core R, personas R, registros R, reuniones R, predicación R |
| `p_super_grupo` | Superintendente de Grupo | Granular: core R, personas R, registros RW, reuniones R |
| `p_siervo_territorios` | Siervo de Territorios | Granular: core R, predicación RW |
| `p_publicador` | Publicador | Granular: core R, reuniones R, predicación R |

### 4.2 Formato de Permisos (v2.1 — Granular)

Los permisos soportan dos formatos: **plano** (flat) y **granular** (jerárquico).

#### Formato Plano (v1.x / v2.0 — Backward Compatible)

```json
{
  "core": "RW",
  "personas": "RW",
  "registros": "RW",
  "predicacion": "R"
}
```

Todos los sheets dentro de un módulo reciben el mismo permiso.

#### Formato Granular (v2.1)

```json
{
  "core": {
    "configuracion": "RW",
    "usuarios": "R",
    "perfiles": "R",
    "plugins": "R",
    "migraciones": "R",
    "*": "R"
  },
  "personas": "RW",
  "registros": "RW"
}
```

**Reglas de resolución:**

1. Si el valor del módulo es un **string** (`"RW"`) → todas las sheets del módulo reciben ese permiso
2. Si el valor es un **objeto** → se busca la clave que coincida con `sheetName.toLowerCase()`
3. Si no hay coincidencia → se usa `"*"` como fallback
4. Si no hay `"*"` → permiso denegado

| Formato de permiso | Sheet: `Configuracion` | Sheet: `Usuarios` | Sheet: `Perfiles` |
|-------------------|----------------------|-------------------|-------------------|
| `"core":"RW"` | RW | RW | RW |
| `"core":{"*":"R"}` | R | R | R |
| `"core":{"configuracion":"RW","*":"R"}` | RW | R | R |
| `"core":{"configuracion":"RW"}` | RW | Denegado | Denegado |

**Claves granulares por defecto** (convention: `sheetName.toLowerCase()`):

| Sheet | Clave Granular |
|-------|---------------|
| `Configuracion` | `configuracion` |
| `Usuarios` | `usuarios` |
| `Perfiles` | `perfiles` |
| `Registro_Plugins` | `registro_plugins` |
| `Sistema_Migraciones` | `sistema_migraciones` |

### 4.3 Resolución de Módulo

El módulo se determina dinámicamente, sin valores hardcoded:

1. **Si `ssId === coreSsId`** → módulo = `"core"`
2. **Si no** → buscar en `Registro_Plugins` la fila donde `ssId` coincida → módulo = `plugin_id`
3. **Si no se encuentra** → módulo = `ssId` (fallback, probablemente denegado)

El frontend resuelve el módulo al inicio de la sesión:
- Llama `refreshModuleMap()` que consulta `Registro_Plugins`
- Almacena el mapa en `localStorage: congre_module_map`
- En cada request, envía `module` en el payload

### 4.4 Validación de Permisos

> **Nota v2.0:** Las funciones `getPerfiles`, `getPermisos`, `checkPermission`, `createProfile`, `updateProfile`, `deleteProfile` han sido **eliminadas**. El frontend gestiona perfiles directamente mediante `batchExecute` con operaciones `read`/`save`/`delete` en las hojas `Perfiles` y `Usuarios`.

Los permisos se validan internamente en el backend para cada operación de escritura. El frontend puede leer la tabla `Perfiles` directamente para mostrar la matriz de permisos en la UI.

### 4.5 Mapeo de Acciones a Permisos

| Acción requerida | Permiso necesario |
|-----------------|-------------------|
| `read` | `R` o `RW` |
| `write` | `W` o `RW` |
| `delete` | `RW` |

---

## 5. Instalación

### 5.1 Flujo de Instalación (v2.1)

```javascript
// Paso 1: Crear spreadsheets y carpeta Drive
{
  "action": "install",
  "payload": { "nombreCongregacion": "Congregación Central" }
}
// Response: { ssId, ssUrl, publicSsId, publicSsUrl, folderId, folderUrl }

// Paso 2: Inicializar tablas y datos con batchExecute (modo setup)
{
  "action": "batchExecute",
  "payload": {
    "ssId": "CORE_SS_ID",
    "isSetup": true,
    "operations": [
      { "op": "initSheet", "sheet": "Usuarios", "headers": ["id","username","email","wrapped_mk","perfilId","auth_config","metadata","created_at","_v","_ts","_deleted"] },
      { "op": "initSheet", "sheet": "Perfiles", "headers": ["id","nombre","permisos","descripcion","_v","_ts","_deleted"] },
      { "op": "initSheet", "sheet": "Configuracion", "headers": ["clave","valor","is_public","_v","_ts","_deleted"] },
      { "op": "initSheet", "sheet": "Registro_Plugins", "headers": ["plugin_id","ssId","status","config","_v","_ts","_deleted"] },
      { "op": "initSheet", "sheet": "Sistema_Migraciones", "headers": ["id","nombre","version","ejecutada_en","estado","error","_v","_ts","_deleted"] },
      { "op": "initSheet", "sheet": "Logs_Accesos", "headers": ["timestamp","username","success","details","ip"] },
      { "op": "save", "sheet": "Perfiles", "data": { "id": "p_admin", "nombre": "Super-Admin", "permisos": {"core":"RW","personas":"RW","registros":"RW","reuniones":"RW","predicacion":"RW","anuncios":"RW"}, "descripcion": "Administrador total" } },
      { "op": "save", "sheet": "Perfiles", "data": { "id": "p_secretario", "nombre": "Secretario", "permisos": {"core":{"configuracion":"R","usuarios":"R","perfiles":"R","*":"R"},"personas":"RW","registros":"RW","reuniones":"R","predicacion":"R","anuncios":"RW"}, "descripcion": "Secretario de congregación" } }
    ]
  }
}
```

> **Nota v2.1:** El modo `isSetup: true` permite `initSheet` y `save` sin sesión. Operaciones `delete`, `hardDelete`, `restore` están bloqueadas en setup mode.

### 5.2 Funciones Eliminadas

| Función Eliminada | Reemplazo |
|-------------------|-----------|
| `initCoreTables` | `batchExecute` con ops `initSheet` |
| `seedPerfiles` | `batchExecute` con ops `save` en `Perfiles` |
| `seedConfiguracion` | `batchExecute` con ops `save` en `Configuracion` |
| `batchInitSheet` | `batchExecute` con ops `initSheet` |
| `batchSaveData` | `batchExecute` con ops `save` |
| `batchDeleteData` | `batchExecute` con ops `delete` |
| `batchGetData` | `batchExecute` con ops `read` |
| `getHistory` | `batchExecute` con op `read` (frontend filtra) |
| `getPerfiles` | `batchExecute` con op `read` en `Perfiles` |
| `getPermisos` | `batchExecute` con op `read` en `Usuarios` + `Perfiles` |
| `checkPermission` | Validación directa en frontend |
| `createProfile` | `batchExecute` con op `save` en `Perfiles` |
| `updateProfile` | `batchExecute` con op `save` en `Perfiles` |
| `deleteProfile` | `batchExecute` con op `delete` en `Perfiles` |
| `disableTOTP` | `batchExecute` con op `save` en `Usuarios` (actualizar auth_config.totp.enabled = false) |
| `deleteAccount` | `batchExecute` con op `delete` en `Usuarios` |
| `updateAuthConfig` | `batchExecute` con op `save` en `Usuarios` |
| `deleteSheet` | No disponible (usar Google Sheets UI) |
| `actionResetPassword` | Renombrada a `confirmPasswordReset` |

---

## 6. Gestión de Archivos — Drive Folder System

### 6.1 Estructura de Carpeta

Cada instalación tiene una carpeta Drive dedicada con subfolders:

```
CongreAdmin-[Nombre]/
├── CongreAdmin-[Nombre]-Core.gsheet
├── CongreAdmin-[Nombre]-Public.gsheet
├── backups/          ← Backups manuales, archivos de exportación
├── documentos/       ← Documentos subidos (PDFs, imágenes, etc.)
└── exportaciones/    ← Reportes generados, exportaciones
```

### 6.2 Acciones de Archivo (Standalone)

Las siguientes acciones están disponibles como endpoints independientes. Usan la misma lógica interna que las operaciones de `batchExecute`.

> **Nota:** Todas requieren sesión válida + permiso `write` en `core`. Max 37MB por upload. MIME types permitidos: PDF, imágenes (JPEG, PNG, GIF, SVG, WebP), texto (TXT, CSV, HTML), JSON, ZIP, Office (DOCX, XLSX, DOC, XLS), ODF (ODT, ODS), audio (MP3, WAV, OGG), video (MP4, WebM).

#### `uploadFile`
Sube un archivo codificado en base64 a la carpeta Drive.

```javascript
{
  "action": "uploadFile",
  "payload": {
    "ssId": "CORE_SS_ID",
    "sessionToken": "TOKEN",
    "folderId": "DRIVE_FOLDER_ID",
    "subfolder": "documentos",
    "fileName": "reporte.pdf",
    "mimeType": "application/pdf",
    "content": "base64_encoded_content"
  }
}

// Response
{
  "success": true,
  "fileId": "new_file_id",
  "fileUrl": "https://drive.google.com/file/d/.../view",
  "fileName": "reporte.pdf",
  "size": 1024000
}
```

#### `downloadFile`
Descarga un archivo de Drive como contenido base64.

```javascript
{
  "action": "downloadFile",
  "payload": {
    "ssId": "CORE_SS_ID",
    "sessionToken": "TOKEN",
    "fileId": "FILE_ID"
  }
}

// Response
{
  "success": true,
  "fileName": "reporte.pdf",
  "mimeType": "application/pdf",
  "size": 1024000,
  "content": "base64_encoded_content"
}
```

#### `listFolderFiles`
Lista archivos en la carpeta de instalación (opcionalmente filtrado por subfolder).

```javascript
{
  "action": "listFolderFiles",
  "payload": {
    "ssId": "CORE_SS_ID",
    "sessionToken": "TOKEN",
    "folderId": "DRIVE_FOLDER_ID",
    "subfolder": "documentos"
  }
}

// Response
{
  "success": true,
  "files": [
    {
      "id": "file_id",
      "name": "reporte.pdf",
      "mimeType": "application/pdf",
      "size": 1024000,
      "created": "2026-04-03T...",
      "modified": "2026-04-03T...",
      "url": "https://drive.google.com/file/d/.../view",
      "shared": true,
      "access": "ANYONE_WITH_LINK",
      "permission": "VIEW"
    }
  ]
}
```

#### `deleteFile`
Elimina (envía a papelera) un archivo de Drive.

```javascript
{
  "action": "deleteFile",
  "payload": {
    "ssId": "CORE_SS_ID",
    "sessionToken": "TOKEN",
    "fileId": "FILE_ID"
  }
}

// Response
{ "success": true, "message": "Archivo eliminado" }
```

#### `setFileSharing`
Establece permisos de compartición en un archivo.

```javascript
{
  "action": "setFileSharing",
  "payload": {
    "ssId": "CORE_SS_ID",
    "sessionToken": "TOKEN",
    "fileId": "FILE_ID",
    "access": "ANYONE_WITH_LINK",
    "permission": "VIEW"
  }
}

// Response
{
  "success": true,
  "fileId": "FILE_ID",
  "access": "ANYONE_WITH_LINK",
  "permission": "VIEW",
  "shareUrl": "https://drive.google.com/file/d/.../view?usp=sharing"
}
```

**Valores de `access`:** `PRIVATE`, `ANYONE_WITH_LINK`, `DOMAIN`, `ANYONE`
**Valores de `permission`:** `VIEW`, `COMMENT`, `EDIT`

#### `moveFileToFolder`
Mueve un archivo a la carpeta de instalación (o subfolder).

```javascript
{
  "action": "moveFileToFolder",
  "payload": {
    "ssId": "CORE_SS_ID",
    "sessionToken": "TOKEN",
    "folderId": "DRIVE_FOLDER_ID",
    "subfolder": "backups",
    "fileId": "FILE_ID"
  }
}

// Response
{
  "success": true,
  "fileId": "FILE_ID",
  "fileName": "backup.zip",
  "folderId": "subfolder_id",
  "fileUrl": "https://drive.google.com/file/d/.../view"
}
```

### 6.3 Operaciones de Archivo en `batchExecute`

Las mismas operaciones de archivo están disponibles dentro de `batchExecute`, permitiendo mezclar operaciones de hoja y archivo en una sola llamada API. Ver sección 3.2 para detalles completos.

### 6.4 Códigos de Error de Archivo

| Código | Descripción |
|--------|-------------|
| `ERR_FOLDER_NOT_FOUND` | La carpeta Drive no existe |
| `ERR_SUBFOLDER_NOT_FOUND` | El subfolder solicitado no existe |
| `ERR_FILE_NOT_FOUND` | El archivo no existe |
| `ERR_FILE_TOO_LARGE` | El archivo excede 37MB |
| `ERR_INVALID_MIMETYPE` | Tipo de archivo no permitido |
| `ERR_INVALID_BASE64` | El contenido no es base64 válido |

---

## 7. Sistema de Caché

### 6.1 TTL Configurable

| Constante | Valor | Uso |
|-----------|-------|-----|
| `CACHE_TTL_DATA` | 600s (10 min) | Datos de hojas |
| `CACHE_TTL_LOOKUP` | 300s (5 min) | Búsquedas de usuarios/perfiles |

### 6.2 Funciones de Caché

```javascript
// Obtener datos cacheados
getCachedSheetData(ss, sheetName)

// Invalidar caché específico
clearCache(ssId, sheetName)

// Invalidar por patrón (no-op — expira automáticamente)
invalidateCache('u:')    // Solo log, no invalida realmente
```

> **Nota v2.0:** `invalidateCache(pattern)` es un no-op. GAS CacheService no soporta invalidación por patrón. La expiración es automática por TTL.

### 6.3 Caché Intra-Batch (NUEVO)
`batchExecute` implementa un caché en memoria dentro de una sola ejecución: cada hoja se carga una vez y se reutiliza para todas las operaciones del lote. Las hojas modificadas se escriben al final de la ejecución en un solo `setValues()`.

---

## 8. Funciones TOTP (Implementación Nativa GAS)

El sistema implementa TOTP sin librerías externas usando `Utilities.computeHmacSignature()`.

```javascript
// Convierte base32 a hex
base32tohex(base32)

// Genera código TOTP
generateTOTP(secret, timeStepSeconds, digits)

// Genera código TOTP en timestamp específico
generateTOTPAtTime(secret, timestamp, timeStepSeconds, digits)

// Verifica código TOTP (con ventana de ±1 periodo)
verifyTOTP(secret, code)

// Hashea contraseña con SHA-256
hashPassword(password)

// Verifica contraseña hasheada
verifyPassword(password, hash)
```

**Detalles técnicos:**
- Algoritmo: HMAC-SHA1 (RFC 6238)
- Dígitos: 6
- Periodo: 30 segundos
- Ventana de verificación: ±1 periodo (tolerancia de 60 segundos)
- Secret: Base32, 20 bytes (160 bits)

---

## 9. Versionado y Conflictos

### 8.1 Campos de Sistema

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_v` | número | Versión incremental del registro |
| `_ts` | ISO 8601 | Timestamp de última modificación |
| `_deleted` | boolean | Borrado lógico |

### 8.2 Last Write Wins

El sistema incrementa `_v` automáticamente en cada escritura. El cliente puede enviar `expectedVersion` para detección de conflictos.

---

## 10. Rate Limiting

```javascript
// Máximo 5 intentos por minuto por username
checkRateLimit('login:usuario@email.com', 5, 60)
```

**Respuesta cuando está bloqueado:**
```javascript
{
  "success": false,
  "error": "ERR_RATE_LIMITED: Demasiados intentos. Intenta más tarde.",
  "retryAfter": 45
}
```

---

## 11. Códigos de Error

| Código | Descripción |
|--------|-------------|
| `ERR_AUTH_INVALID` | Credenciales inválidas o sesión expirada |
| `ERR_AUTH_REQUIRED` | Se requiere autenticación |
| `ERR_PERMISSION_DENIED` | Usuario no tiene permisos |
| `ERR_VERSION_CONFLICT` | Conflicto de versiones |
| `ERR_RATE_LIMITED` | Demasiados intentos |
| `ERR_USER_EXISTS` | Usuario ya existe |
| `ERR_USER_NOT_FOUND` | Usuario no encontrado |
| `ERR_SESSION_EXPIRED` | Sesión expirada |
| `ERR_SESSION_NOT_FOUND` | Sesión no encontrada |
| `ERR_RESOURCE_NOT_FOUND` | Hoja o recurso no encontrado |
| `ERR_TOTP_NOT_CONFIGURED` | TOTP no configurado |
| `ERR_TOTP_EXPIRED` | Configuración TOTP expirada |
| `ERR_NO_PENDING_TOTP` | No hay configuración TOTP pendiente |
| `ERR_CODE_REQUIRED` | Se requiere código de verificación |
| `ERR_EMAIL_OTP_NOT_CONFIGURED` | Email OTP no configurado |
| `ERR_EMAIL_SEND` | Error al enviar email |
| `ERR_PASSKEY_NOT_CONFIGURED` | Passkey no configurado |
| `ERR_PASSKEY_REQUIRED` | Se requiere autenticación con passkey |
| `ERR_PASSKEY_NOT_FOUND` | Passkey no encontrado |
| `ERR_PASSKEY_SETUP_EXPIRED` | Configuración de passkey expirada |
| `ERR_FOLDER_NOT_FOUND` | Carpeta Drive no encontrada |
| `ERR_SUBFOLDER_NOT_FOUND` | Subfolder no encontrado |
| `ERR_FILE_NOT_FOUND` | Archivo no encontrado |
| `ERR_FILE_TOO_LARGE` | Archivo excede 37MB |
| `ERR_INVALID_MIMETYPE` | Tipo de archivo no permitido |
| `ERR_INVALID_BASE64` | Contenido no es base64 válido |
| `ERR_INVALID_CREDENTIALS` | Usuario o contraseña incorrectos |
| `ERR_PASSWORD_REQUIRED` | Se requiere contraseña |
| `ERR_PASSWORD_WEAK` | Contraseña no cumple requisitos |
| `ERR_SS_ID_REQUIRED` | Se requiere ssId |
| `ERR_INVALID_TOKEN` | Token inválido o expirado |
| `ERR_TOKEN_EXPIRED` | Token expirado |
| `ERR_INVALID_REQUEST` | Datos incompletos |
| `ERR_BATCH_EMPTY` | No se proporcionaron operaciones |
| `ERR_BATCH_TOO_LARGE` | Máximo 50 operaciones por llamada |
| `ERR_SKIPPED` | Operación omitida (fail-fast mode) |
| `ERR_UNKNOWN_OP` | Operación desconocida |

---

## 12. Índice Híbrido de Sesiones

### 11.1 Arquitectura

1. **Nivel 1 (Memoria):** Variable global `_sessionIndex` — acceso instantáneo
2. **Nivel 2 (Caché):** ScriptCache — persiste entre ejecuciones
3. **Nivel 3 (Backup):** UserProperties — almacenamiento persistente

### 11.2 Funciones

```javascript
_loadSessionIndex()       // Carga el índice
_saveSessionIndex()       // Persiste el índice
_addToSessionIndex()      // Agrega sesión
_removeFromSessionIndex() // Elimina sesión
_findSessionInProperties() // Fallback: busca en PropertiesService
```

---

## 13. Notas de Implementación

### 12.1 Optimizaciones de Quota (v2.0)

- **`batchExecute` con caché intra-batch:** Cada hoja se lee una vez por lote, se acumulan cambios y se escriben con un solo `setValues()`
- **`softDeleteRow` optimizado:** Usa 1× `setValues()` en lugar de 3× `setValue()` (reducción de 4 a 2 llamadas API)
- **Dispatch map:** Router basado en mapa en lugar de cadena if-else
- **Código reducido:** ~1,750 líneas (de 3,053) — 43% menos

### 12.2 Validaciones

- Las validaciones de esquema se ejecutan en el **Frontend** mediante JSONata
- El backend solo persiste los datos recibidos
- Todas las operaciones de escritura validan sesión + RBAC

### 12.3 Multi-Tenancy

> **Importante v2.0:** El backend **NO usa Script Properties** para estado de la aplicación. El `ssId` se pasa explícitamente en cada petición. Esto permite múltiples instalaciones independientes sin conflicto.

Las únicas propiedades almacenadas en `PropertiesService` son:
- **Sesiones:** `sessions_<userId>` — efímeras, por diseño
- **Tokens temporales:** `totp_pending_<username>`, `passkey_challenge_<username>`, `passkey_setup_<username>`, `otp_<username>`, `pwd_reset_<userId>` — todos con expiración automática

### 12.4 Email con MailApp

- Límite: 100 emails/día (cuentas gratuitas), mayor para Workspace
- El email se envía desde la cuenta del propietario del script
- La dirección de destino se resuelve del campo `email` del usuario, o usa `username` como fallback

### 12.5 CORS y Configuración de Fetch

```javascript
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify(body),
  mode: 'cors',
  redirect: 'follow'
});
```

---

## 14. Ejemplo de Uso Completo

### 13.1 Inicialización

```javascript
// 1. Instalar el sistema
{ "action": "install", "payload": { "nombreCongregacion": "Mi Congregación" } }

// 2. Inicializar tablas y datos con batchExecute
{
  "action": "batchExecute",
  "payload": {
    "ssId": "CORE_SS_ID",
    "operations": [
      { "op": "initSheet", "sheet": "Usuarios", "headers": ["id","username","email","wrapped_mk","perfilId","auth_config","metadata","created_at","_v","_ts","_deleted"] },
      { "op": "initSheet", "sheet": "Perfiles", "headers": ["id","nombre","permisos","descripcion","_v","_ts","_deleted"] },
      { "op": "initSheet", "sheet": "Configuracion", "headers": ["clave","valor","is_public","_v","_ts","_deleted"] },
      { "op": "save", "sheet": "Perfiles", "data": { "id": "p_admin", "nombre": "Super-Admin", "permisos": {"core":"RW","personas":"RW"}, "descripcion": "Admin" } },
      { "op": "save", "sheet": "Configuracion", "data": { "clave": "nombre_congregacion", "valor": "Mi Congregación", "is_public": true } }
    ]
  }
}
```

### 13.2 Autenticación

```javascript
// Login
{
  "action": "login",
  "payload": {
    "ssId": "CORE_SS_ID",
    "username": "admin@congregacion.com",
    "password": "MiContraseña123!",
    "method": "email_otp",
    "code": "123456"
  }
}
```

### 13.3 Lectura y Escritura con batchExecute

```javascript
// Leer múltiples hojas + guardar datos en una sola llamada
{
  "action": "batchExecute",
  "payload": {
    "ssId": "CORE_SS_ID",
    "sessionToken": "TOKEN",
    "operations": [
      { "op": "read", "sheet": "Configuracion" },
      { "op": "read", "sheet": "Perfiles" },
      { "op": "save", "sheet": "Personas", "data": { "id": "nuevo-uuid", "nombre": "Juan Pérez" } }
    ]
  }
}
```

---

## 15. Glosario

| Término | Definición |
|---------|------------|
| **GAS** | Google Apps Script |
| **GSheet** | Google Sheets |
| **RBAC** | Role-Based Access Control |
| **TOTP** | Time-based One-Time Password |
| **OTP** | One-Time Password |
| **MK** | Master Key (clave maestra del usuario) |
| **Wrapped MK** | MK cifrada con la contraseña del usuario |
| **Soft Delete** | Borrado lógico (marcar como eliminado) |
| **Last Write Wins** | Estrategia de resolución de conflictos |
| **TTL** | Time To Live (tiempo de vida del caché) |
| **ssId** | Spreadsheet ID — identificador de un Google Sheet |

---

## 16. Archivos Relacionados

- `backend/src/api.gs` — Implementación fuente (~1,750 líneas)
- `backend/data/seed_perfiles.json` — Perfiles base para instalación
- `docs/architecture/Backend.md` — Especificación de la interfaz
- `docs/architecture/Core.md` — Arquitectura del núcleo del sistema
- `docs/architecture/Autenticacion.md` — Sistema de autenticación y flujos
- `docs/architecture/Arquitectura.md` — Arquitectura general
- `docs/architecture/Tecnologia.md` — Especificación tecnológica
- `docs/architecture/DataService.md` — Cliente frontend (DataService, JSONata, TanStack Query)
- `docs/architecture/Instalacion.md` — Guía de instalación
- `docs/PLAN_DESARROLLO.md` — Plan de desarrollo
- `docs/CHANGELOG.md` — Historial de cambios

---

*Documento actualizado el 2026-04-03 — v2.0.0*
