# Congre-Admin: Documentación Técnica del Backend API

> **Versión:** 1.0.0
> **Última actualización:** 2026-03-24
> **Archivo fuente:** `backend/src/api.gs`
> **Plataforma:** Google Apps Script (GAS)

---

## 1. Resumen Ejecutivo

El Backend de Congre-Admin es un proveedor de servicios implementado como Google Apps Script que utiliza Google Sheets como base de datos distribuida. El sistema sigue una arquitectura de **Segmentación Física de Datos** donde cada módulo/plugin tiene su propio spreadsheet.

### Características Principales

| Característica | Implementación |
|----------------|----------------|
| **Autenticación** | Zero-Knowledge con soporte para Passkeys, TOTP y OTP por Email |
| **Gestión de Sesiones** | Token JWT con índice híbrido (memoria + caché) |
| **Permisos** | RBAC basado en perfiles con permisos por módulo |
| **Versionado** | Last Write Wins con detección de conflictos |
| **Borrado** | Soft Delete (borrado lógico) |
| **Caché** | CacheService con TTL configurable |
| **Rate Limiting** | Por usuario/IP en acciones de autenticación |

---

## 2. Estructura del GSheet Core

El Core es el orquestador central que contiene la configuración maestra del sistema.

### 2.1 Tablas Obligatorias

#### Tabla: `Usuarios`
Almacena las credenciales y configuración de usuarios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único del usuario |
| `username` | string | Correo electrónico (único) |
| `wrapped_mk` | string | Master Key cifrada con TOTP |
| `perfilId` | string | ID del perfil asignado (ej: `p_admin`) |
| `personaId` | UUID | (Opcional) ID de la persona asociada |
| `auth_factor` | string | Factor de autenticación: `passkey`, `totp`, `email` |
| `totp_secret` | string | Secreto para Google Authenticator |
| `public_key` | string | Clave pública para Passkeys |
| `created_at` | ISO 8601 | Fecha de creación |
| `_v` | número | Versión del registro |
| `_ts` | ISO 8601 | Timestamp de última modificación |
| `_deleted` | boolean | Borrado lógico |

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

---

## 3. Referencia de la API

### 3.1 Estructura de Petición

Todas las peticiones se envían vía `POST` al endpoint del GAS:

```json
{
  "action": "nombre_de_accion",
  "ssId": "ID_DEL_SPREADSHEET",
  "sheet": "NOMBRE_DE_HOJA",
  "sessionToken": "TOKEN_DE_SESION",
  "payload": { },
  "expectedVersion": NUMERO
}
```

### 3.2 Acciones Disponibles

#### A. Acciones de Datos

##### `getData` (GET)
Obtiene datos de una hoja específica.

```javascript
// GET request
?action=getData&sheet=NombreHoja&ssId=ID_SPREADSHEET

// Response
{
  "success": true,
  "data": [
    { "id": "uuid-1", "nombre": "Valor", ... },
    { "id": "uuid-2", "nombre": "Otro", ... }
  ]
}
```

##### `batchGetData` (GET)
Obtiene múltiples hojas en una sola petición.

```javascript
// GET request
?action=batchGetData&sheets=Hoja1,Hoja2,Hoja3&ssId=ID_SPREADSHEET

// Response
{
  "success": true,
  "Hoja1": [ ... ],
  "Hoja2": [ ... ],
  "Hoja3": [ ... ]
}
```

##### `saveData`
Guarda o actualiza un registro (operación upsert).

```javascript
// POST request
{
  "action": "saveData",
  "sheet": "Personas",
  "ssId": "ID_SPREADSHEET",
  "payload": {
    "id": "uuid-o-nuevo",
    "nombre": "Juan Pérez",
    "_v": 1
  },
  "expectedVersion": 1,
  "onlyIfNew": false
}

// Response - Éxito
{
  "success": true
}

// Response - Conflicto de versión
{
  "success": false,
  "error": "ERR_VERSION_CONFLICT",
  "message": "El registro fue modificado por otro usuario",
  "currentVersion": 3
}
```

**Parámetros:**
- `payload.id`: ID del registro (si es nuevo, se genera UUID automáticamente)
- `expectedVersion`: Versión esperada para detección de conflictos
- `onlyIfNew`: Si `true`, solo inserta si no existe

##### `deleteData`
Marca un registro como borrado (soft delete).

```javascript
// POST request
{
  "action": "deleteData",
  "sheet": "Personas",
  "ssId": "ID_SPREADSHEET",
  "id": "UUID_DEL_REGISTRO"
}

// Response
{
  "success": true,
  "message": "Borrado lógico realizado"
}
```

##### `hardDelete`
Borrado físico (definitivo).

```javascript
// POST request
{
  "action": "hardDelete",
  "sheet": "Personas",
  "ssId": "ID_SPREADSHEET",
  "id": "UUID_DEL_REGISTRO"
}
```

##### `restoreData`
Restaura un registro borrado lógicamente.

```javascript
// POST request
{
  "action": "restoreData",
  "sheet": "Personas",
  "ssId": "ID_SPREADSHEET",
  "id": "UUID_DEL_REGISTRO"
}
```

##### `getHistory`
Obtiene el historial de versiones de un registro.

```javascript
// POST request
{
  "action": "getHistory",
  "sheet": "Personas",
  "ssId": "ID_SPREADSHEET",
  "id": "UUID_DEL_REGISTRO",
  "sessionToken": "TOKEN_DE_SESION"
}

// Response
{
  "success": true,
  "history": [
    { "_v": 3, "_ts": "2026-03-24T10:00:00Z", "nombre": "Juan" },
    { "_v": 2, "_ts": "2026-03-23T15:30:00Z", "nombre": "J" },
    { "_v": 1, "_ts": "2026-03-22T09:00:00Z", "nombre": "J." }
  ]
}
```

#### B. Acciones de Estructura

##### `initSheet`
Inicializa una hoja con cabeceras.

```javascript
{
  "action": "initSheet",
  "ssId": "ID_SPREADSHEET",
  "sheet": "NuevaHoja",
  "headers": ["id", "nombre", "descripcion", "_v", "_ts"],
  "preserveExisting": false
}
```

##### `clearSheet`
Limpia el contenido de una hoja manteniendo las cabeceras.

##### `deleteSheet`
Elimina una hoja del spreadsheet.

---

## 4. Autenticación y Seguridad

### 4.1 Flujo de Autenticación

```
1. Usuario envía username
2. Servidor verifica credentials
3. Servidor genera sessionToken
4. Cliente usa sessionToken en peticiones subsiguientes
```

### 4.2 Acciones de Autenticación

#### `register`
Crea un nuevo usuario.

```javascript
{
  "action": "register",
  "payload": {
    "username": "usuario@email.com",
    "wrapped_mk": "MASTER_KEY_CIFRADA",
    "perfilId": "p_publicador",
    "auth_factor": "email",
    "totp_secret": "SECRETO_TOTP",
    "public_key": "CLAVE_PUBLICA_PASSKEY"
  }
}
```

#### `login`
Autentica al usuario.

```javascript
{
  "action": "login",
  "payload": {
    "username": "usuario@email.com",
    "code": "123456",  // Código OTP
    "authType": "email"  // o "totp"
  }
}

// Response
{
  "success": true,
  "sessionToken": "uuid_token",
  "wrapped_mk": "MASTER_KEY_CIFRADA",
  "expiresAt": "2026-03-25T10:00:00Z",
  "user": {
    "id": "uuid-usuario",
    "username": "usuario@email.com",
    "perfilId": "p_admin"
  }
}
```

#### `challenge`
Genera un desafío para Passkey/WebAuthn.

#### `requestOTP`
Envía un código OTP por email.

```javascript
{
  "action": "requestOTP",
  "payload": {
    "username": "usuario@email.com"
  }
}
```

#### `logout`
Cierra la sesión actual.

```javascript
{
  "action": "logout",
  "payload": {
    "sessionToken": "TOKEN_A_CERRAR"
  }
}
```

#### `validateSession`
Valida un token de sesión.

```javascript
{
  "action": "validateSession",
  "sessionToken": "TOKEN_A_VALIDAR"
}

// Response
{
  "valid": true,
  "userId": "uuid-usuario",
  "username": "usuario@email.com",
  "expiresAt": "2026-03-25T10:00:00Z"
}
```

#### `refreshSession`
Renueva el token de sesión.

#### `getActiveSessions`
Obtiene las sesiones activas de un usuario.

#### `invalidateAllSessions`
Cierra todas las sesiones de un usuario.

---

## 5. Sistema de Permisos RBAC

### 5.1 Estructura de Perfiles

El sistema implementa Control de Acceso Basado en Roles (RBAC) con los siguientes perfiles predefinidos:

| Perfil ID | Nombre | Permisos |
|-----------|--------|----------|
| `p_admin` | Super-Admin | RW en todos los módulos |
| `p_secretario` | Secretario | RW en personas, registros, anuncios; R en reuniones, predicación |
| `p_comite` | Comité de Servicio | R en personas, registros, reuniones, predicación |
| `p_super_grupo` | Superintendente de Grupo | R en personas; RW en registros; R en reuniones |
| `p_siervo_territorios` | Siervo de Territorios | RW en predicación |
| `p_publicador` | Publicador | R en reuniones, predicación |

### 5.2 Acciones de Permisos

#### `getPerfiles`
Obtiene todos los perfiles disponibles.

```javascript
{
  "action": "getPerfiles"
}

// Response
{
  "success": true,
  "perfiles": [
    { "id": "p_admin", "nombre": "Super-Admin", "permisos": {...} },
    ...
  ]
}
```

#### `getPermisos`
Obtiene los permisos de un usuario específico.

```javascript
{
  "action": "getPermisos",
  "payload": {
    "userId": "UUID_USUARIO"
  }
}
```

#### `checkPermission`
Verifica si un usuario tiene permiso para una acción.

```javascript
{
  "action": "checkPermission",
  "payload": {
    "userId": "UUID_USUARIO",
    "username": "usuario@email.com",
    "action": "read",  // read, write, delete
    "modulo": "personas"
  }
}

// Response
{
  "allowed": true
}

// O
{
  "allowed": false,
  "error": "ERR_PERMISSION_DENIED"
}
```

---

## 6. Instalación

### 6.1 Proceso de Instalación

#### `install`
Inicializa el sistema completo creando el Core Spreadsheet.

```javascript
{
  "action": "install",
  "payload": {
    "nombreCongregacion": "Congregación Central",
    "adminUsername": "admin@email.com"
  }
}

// Response
{
  "success": true,
  "ssId": "ID_DEL_SPREADSHEET_CREADO",
  "ssUrl": "https://docs.google.com/spreads/d/...",
  "message": "Instalación completada exitosamente"
}
```

#### `createSpreadsheet`
Crea un nuevo Google Spreadsheet.

#### `initCoreTables`
Inicializa las tablas del Core.

#### `seedPerfiles`
Inyecta los perfiles base.

#### `seedConfiguracion`
Inyecta la configuración inicial.

---

## 7. Sistema de Caché

### 7.1 TTL Configurable

| Constante | Valor | Uso |
|-----------|-------|-----|
| `CACHE_TTL_DATA` | 600s (10 min) | Datos de hojas (batch) |
| `CACHE_TTL_LOOKUP` | 300s (5 min) | Búsquedas de usuarios/perfiles |

### 7.2 Funciones de Caché

```javascript
// Obtener datos cacheados
getCachedSheetData(ss, sheetName)

// Invalidar caché específico
clearCache(ssId, sheetName)

// Invalidar por patrón
invalidateCache('u:')    // Todos los usuarios
invalidateCache('p:')    // Todos los perfiles
invalidateCache('p:all') // Cache de perfiles completo
```

---

## 8. Versionado y Conflictos

### 8.1 Campos de Sistema

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_v` | número | Versión incremental del registro |
| `_ts` | ISO 8601 | Timestamp de última modificación |
| `_deleted` | boolean | Borrado lógico |

### 8.2 Last Write Wins

El sistema implementa detección de conflictos:

1. El cliente envía `expectedVersion` con el payload
2. El servidor compara con la versión actual
3. Si la versión del servidor es mayor, retorna error `ERR_VERSION_CONFLICT`
4. El cliente debe reintentar con los datos actualizados

```javascript
// Response cuando hay conflicto
{
  "success": false,
  "error": "ERR_VERSION_CONFLICT",
  "message": "El registro fue modificado por otro usuario",
  "currentVersion": 5
}
```

---

## 9. Rate Limiting

### 9.1 Implementación

El sistema implementa rate limiting usando CacheService:

```javascript
// Máximo 5 intentos por minuto por username
checkRateLimit('login:usuario@email.com', 5, 60)
```

### 9.2 Respuesta cuando está bloqueado

```javascript
{
  "success": false,
  "error": "ERR_RATE_LIMITED: Demasiados intentos. Intenta más tarde.",
  "retryAfter": 45
}
```

---

## 10. Códigos de Error

| Código | Descripción |
|--------|-------------|
| `ERR_AUTH_INVALID` | Credenciales inválidas o sesión expirada |
| `ERR_AUTH_REQUIRED` | Se requiere autenticación |
| `ERR_PERMISSION_DENIED` | Usuario no tiene permisos |
| `ERR_VERSION_CONFLICT` | Conflicto de versiones |
| `ERR_RATE_LIMITED` | Demasiados intentos |
| `ERR_USER_EXISTS` | Usuario ya existe |
| `ERR_USER_NOT_FOUND` | Usuario no encontrado |
| `ERR_EMAIL_SEND` | Error al enviar email |
| `ERR_SESSION_EXPIRED` | Sesión expirada |
| `ERR_SESSION_NOT_FOUND` | Sesión no encontrada |
| `ERR_RESOURCE_NOT_FOUND` | Hoja o recurso no encontrado |
| `ERR_OTP_REQUIRED` | Se requiere código OTP |
| `ERR_OTP_INVALID` | Código OTP inválido |

---

## 11. Índice Híbrido de Sesiones

### 11.1 Arquitectura

El sistema usa un índice híbrido para validar sesiones:

1. **Nivel 1 (Memoria):** Variable global `_sessionIndex` - acceso instantáneo
2. **Nivel 2 (Caché):** ScriptCache - persiste entre ejecuciones
3. **Nivel 3 (Backup):** UserProperties - almacenamiento persistente

### 11.2 Funciones

```javascript
_loadSessionIndex()     // Carga el índice
_saveSessionIndex()     // Persiste el índice
_addToSessionIndex()   // Agrega sesión
_removeFromSessionIndex() // Elimina sesión
```

---

## 12. Tablas de Sistema Adicionales

### 12.1 Logs_Accesos

Registra todos los intentos de acceso.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `timestamp` | ISO 8601 | Fecha y hora |
| `username` | string | Usuario |
| `success` | YES/NO | Si fue exitoso |
| `details` | string | Detalles adicionales |
| `ip` | string | IP del cliente |

---

## 13. Notas de Implementación

### 13.1 Optimizaciones de Quota

- **Lectura única:** `saveData` pasa filas existentes a `updateOrInsert` para evitar doble lectura
- **Caché de Spreadsheet:** El objeto Spreadsheet se cachea en memoria
- **Índice de sesiones:** Validación O(1) en lugar de O(n)
- **TTL diferenciado:** Datos de hojas (10 min) vs búsquedas (5 min)

### 13.2 Validaciones

- Las validaciones de esquema se ejecutan en el **Frontend** mediante JSONata
- El backend solo persiste los datos recibidos
- Se aplica sanitización básica (eliminación de campos `enc_` si es necesario)

### 13.3 Configuración Requerida

El script debe tener configurada la propiedad:

```
CORE_SS_ID = "ID_DEL_SPREADSHEET_CORE"
```

---

## 14. Ejemplo de Uso Completo

### 14.1 Inicialización

```javascript
// 1. Instalar el sistema
{
  "action": "install",
  "payload": {
    "nombreCongregacion": "Mi Congregación"
  }
}

// 2. Resultado: Core Spreadsheet creado con todas las tablas
```

### 14.2 Autenticación

```javascript
// 1. Solicitar código OTP
{
  "action": "requestOTP",
  "payload": {
    "username": "admin@congregacion.com"
  }
}

// 2. El usuario recibe el código por email

// 3. Iniciar sesión
{
  "action": "login",
  "payload": {
    "username": "admin@congregacion.com",
    "code": "123456",
    "authType": "email"
  }
}

// 4. Response: sessionToken para usar en peticiones subsecuentes
```

### 14.3 Lectura de Datos

```javascript
// Obtener datos de personas
{
  "action": "getData",
  "sheet": "Personas",
  "ssId": "ID_DEL_SPREADSHEET"
}
```

### 14.4 Guardar Datos

```javascript
// Guardar nueva persona
{
  "action": "saveData",
  "sheet": "Personas",
  "ssId": "ID_DEL_SPREADSHEET",
  "sessionToken": "TOKEN",
  "payload": {
    "id": "nuevo-uuid",
    "nombre": "Juan Pérez",
    "telefono": "+1234567890"
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
| **Wrapped MK** | MK cifrada con TOTP |
| **Soft Delete** | Borrado lógico (marcar como eliminado) |
| **Last Write Wins** | Estrategia de resolución de conflictos |
| **TTL** | Time To Live (tiempo de vida del caché) |

---

## 16. Archivos Relacionados

- `backend/src/api.gs` - Implementación fuente
- `docs/architecture/Backend.md` - Especificación original
- `docs/architecture/Arquitectura.md` - Arquitectura general
- `docs/architecture/API.md` - Referencia de API
- `docs/PLAN_DESARROLLO.md` - Plan de desarrollo
- `docs/CHANGELOG.md` - Historial de cambios

---

*Documento generado automáticamente el 2026-03-24*
