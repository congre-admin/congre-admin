# Congre-Admin: Documentación Técnica del Backend API

> **Versión:** 1.2.0
> **Última actualización:** 2026-03-31
> **Archivo fuente:** `backend/src/api.gs`
> **Plataforma:** Google Apps Script (GAS)

---

## 1. Resumen Ejecutivo

El Backend de Congre-Admin es un proveedor de servicios implementado como Google Apps Script que utiliza Google Sheets como base de datos distribuida. El sistema sigue una arquitectura de **Segmentación Física de Datos** donde cada módulo/plugin tiene su propio spreadsheet.

### Características Principales

| Característica | Implementación |
|----------------|----------------|
| **Autenticación** | Username + Password (SHA-256) + TOTP (Google Authenticator) |
| **Gestión de Sesiones** | Token JWT con índice híbrido (memoria + caché) |
| **Permisos** | RBAC basado en perfiles con permisos por módulo |
| **Versionado** | Last Write Wins con detección de conflictos |
| **Borrado** | Soft Delete (borrado lógico) |
| **Caché** | CacheService con TTL configurable |
| **Rate Limiting** | Por usuario/IP en acciones de autenticación |
| **TOTP** | Implementación nativa GAS (sin librerías externas) |

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

> **Nota:** La contraseña se verifica comparando el hash SHA-256 del input con `password_hash` dentro de `auth_config`. El TOTP se verifica usando HMAC-SHA1 nativo de GAS. Los passkeys se almacenan en el array `passkeys` dentro de `auth_config`.

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
1. Usuario envía username + password (siempre requerido como primer paso)
2. Servidor verifica password
3. Servidor detecta métodos de auth habilitados (totp, email_otp, passkey)
4. Si un solo método está habilitado: avanza automáticamente
   Si múltiples métodos: retorna paso 'method' para que usuario elija
5. Usuario completa segundo factor (código TOTP/email, o credencial passkey)
6. Servidor genera sessionToken
7. Cliente usa sessionToken en peticiones subsiguientes
```

**Importante:** La contraseña SIEMPRE es requerida como primer paso. El sistema verifica la contraseña antes de solicitar el segundo factor.

### 4.2 Acciones de Autenticación

#### `register`
Crea un nuevo usuario (requiere configuración de contraseña + TOTP posterior).

```javascript
{
  "action": "register",
  "payload": {
    "username": "admin",
    "password": "MiContraseña123!",
    "wrapped_mk": "MASTER_KEY_CIFRADA",
    "perfilId": "p_admin"
  }
}
```

#### `login`
Autentica al usuario. Soporta múltiples métodos de autenticación:
- **Password + TOTP** (Google Authenticator) - Método recomendado
- **Password + Email OTP** (código por email)
- **Password + Passkey** (WebAuthn)

**Importante:** La contraseña siempre es requerida como primer paso. El backend requiere que el payload incluya `password` incluso cuando se usa TOTP, email OTP o Passkey como segundo factor.

##### Flujo 1: Password + TOTP (Google Authenticator)

```javascript
// Paso 1: username + password
{
  "action": "login",
  "payload": {
    "username": "admin",
    "password": "MiContraseña123!"
  }
}

// Response: requiere verificar TOTP
{
  "success": false,
  "step": "totp",
  "availableMethods": ["passkey", "totp", "email_otp"],
  "message": "Ingrese su código"
}

// Paso 2: Con código TOTP
{
  "action": "login",
  "payload": {
    "username": "admin",
    "password": "MiContraseña123!",
    "method": "totp",
    "code": "123456"
  }
}
```

##### Flujo 2: Password + Email OTP

```javascript
// Paso 1: username + password
{
  "action": "login",
  "payload": {
    "username": "admin",
    "password": "MiContraseña123!"
  }
}

// Response: requiere verificar email OTP
{
  "success": false,
  "step": "email_otp",
  "availableMethods": ["passkey", "totp", "email_otp"],
  "message": "Código enviado automáticamente"
}

// Paso 2: Con código OTP
{
  "action": "login",
  "payload": {
    "username": "admin",
    "password": "MiContraseña123!",
    "method": "email_otp",
    "code": "123456"
  }
}
```

##### Flujo 3: Passkey (WebAuthn)

```javascript
// Paso 1: Solicitar desafío
{
  "action": "login",
  "payload": {
    "username": "admin",
    "method": "passkey"
  }
}

// Response: retorna desafío del backend
// El frontend usa navigator.credentials.get() para completar la autenticación
{
  "success": false,
  "step": "passkey",
  "challenge": "base64_challenge",
  "rpId": "dominio.com"
}

// Paso 2: Enviar aserción del passkey (incluye password del paso 1)
{
  "action": "login",
  "payload": {
    "username": "admin",
    "password": "MiContraseña123!",
    "method": "passkey",
    "passkeyAssertion": {
      "credentialId": "credential_id",
      "clientDataJSON": "base64_data",
      "signature": "base64_signature",
      "authenticatorData": "base64_data"
    }
  }
}
```

##### Response (login exitoso)

```javascript
{
  "success": true,
  "sessionToken": "uuid_token",
  "wrapped_mk": "MASTER_KEY_CIFRADA",
  "expiresAt": "2026-03-27T10:00:00Z",
  "user": {
    "id": "uuid-usuario",
    "username": "admin",
    "perfilId": "p_admin"
  }
}
```

#### `setupTOTP`
Genera código QR para configurar Google Authenticator (sin sesión activa).

```javascript
{
  "action": "setupTOTP",
  "payload": {
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

#### `confirmTOTP`
Confirma la configuración de TOTP y guarda el secreto.

```javascript
{
  "action": "confirmTOTP",
  "payload": {
    "username": "admin",
    "password": "MiContraseña123!",
    "code": "123456"  // Código de Google Authenticator
  }
}

// Response
{
  "success": true,
  "message": "TOTP configurado correctamente"
}
```

#### `disableTOTP`
Desactiva TOTP para un usuario (requiere sesión activa).

```javascript
{
  "action": "disableTOTP",
  "payload": {}
}

// Headers
{
  "sessionToken": "TOKEN_SESION"
}

// Response
{
  "success": true,
  "message": "TOTP desactivado"
}
```

#### `challenge`
Genera un desafío para Passkey/WebAuthn durante el login. El frontend envía el origen para calcular el `rpId` correcto.

**Nota importante:** El flujo de Passkey requiere que el frontend先用 `challenge` acción para obtener el desafío, luego use `navigator.credentials.get()` para completar la autenticación, y finalmente envíe el resultado en el login payload junto con la password del primer paso.

```javascript
{
  "action": "challenge",
  "payload": {
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
  "allowCredentials": [
    { "id": "base64url_credential_id", "type": "public-key" }
  ],
  "userVerification": "preferred"
}
```

#### `setupPasskey`
Genera un desafío para registrar un nuevo passkey. Puede usar sessionToken (si está autenticado) o username/password.

```javascript
// Con sesión activa
{
  "action": "setupPasskey",
  "payload": {
    "username": "admin",
    "deviceName": "Windows PC",
    "sessionToken": "TOKEN_SESION",
    "origin": "https://congre-admin.github.io"
  }
}

// Sin sesión (desde login)
{
  "action": "setupPasskey",
  "payload": {
    "username": "admin",
    "password": "MiContraseña123!",
    "deviceName": "iPhone",
    "origin": "https://congre-admin.github.io"
  }
}

// Response
{
  "success": true,
  "challenge": "base64_encoded_challenge",
  "rpId": "congre-admin.github.io",
  "timeout": 60000,
  "user": {
    "id": "base64_encoded_user_id",
    "name": "admin",
    "displayName": "admin"
  },
  "pubKeyCredParams": [
    { "type": "public-key", "alg": -7 },
    { "type": "public-key", "alg": -257 }
  ],
  "attestation": "preferred",
  "excludeCredentials": []
}
```

#### `confirmPasskey`
Confirma el registro de un passkey. Guarda la credencial en `auth_config.passkeys`.

```javascript
{
  "action": "confirmPasskey",
  "payload": {
    "username": "admin",
    "sessionToken": "TOKEN_SESION",
    "attestation": {
      "id": "credential_id_from_browser",
      "type": "public-key",
      "response": {
        "clientDataJSON": "base64_client_data",
        "attestationObject": "base64_attestation"
      }
    }
  }
}

// Response
{
  "success": true,
  "message": "Passkey configurado correctamente"
}
```

#### `deletePasskey`
Elimina un passkey registrado (requiere sesión activa).

```javascript
{
  "action": "deletePasskey",
  "payload": {
    "passkeyId": "id_del_passkey_a_eliminar"
  }
}

// Headers
{
  "sessionToken": "TOKEN_SESION"
}

// Response
{
  "success": true,
  "message": "Passkey eliminado"
}
```

#### `getAuthMethods`
Obtiene los métodos de autenticación habilitados para el usuario.

```javascript
{
  "action": "getAuthMethods",
  "payload": {}
}

// Headers
{
  "sessionToken": "TOKEN_SESION"
}

// Response
{
  "success": true,
  "methods": ["passkey", "totp", "email_otp"],
  "defaultMethod": "passkey",
  "passkeys": [
    { "id": "credential_id", "deviceName": "Windows PC", "createdAt": "2026-03-30T..." }
  ],
  "totp": { "enabled": true },
  "email_otp": { "enabled": true },
  "recovery_enabled": true
}
```

#### `updateAuthConfig`
Actualiza la configuración de autenticación.

```javascript
{
  "action": "updateAuthConfig",
  "payload": {
    "default_method": "passkey",
    "recovery_enabled": false
  }
}

// Headers
{
  "sessionToken": "TOKEN_SESION"
}

// Response
{
  "success": true
}
```

#### `changePassword`
Cambia la contraseña del usuario.

```javascript
{
  "action": "changePassword",
  "payload": {
    "old_password": "contraseña_actual",
    "new_password": "nueva_contraseña"
  }
}

// Headers
{
  "sessionToken": "TOKEN_SESION"
}

// Response
{
  "success": true,
  "message": "Contraseña cambiada correctamente"
}
```

#### `deleteAccount`
Elimina la cuenta del usuario.

```javascript
{
  "action": "deleteAccount",
  "payload": {
    "password": "contraseña_del_usuario"
  }
}

// Headers
{
  "sessionToken": "TOKEN_SESION"
}

// Response
{
  "success": true,
  "message": "Cuenta eliminada"
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

### 5.3 Gestión de Perfiles (CRUD)

> **Requiere sesión válida** + permiso `core: RW`

Los perfiles se cargan desde el archivo `backend/data/seed_perfiles.json` durante la instalación, pero también pueden gestionarse dinámicamente.

#### `createProfile`
Crea un nuevo perfil.

```javascript
{
  "action": "createProfile",
  "sessionToken": "TOKEN_DE_SESIÓN",
  "payload": {
    "id": "p_nuevo_perfil",
    "nombre": "Nombre del Perfil",
    "permisos": {
      "personas": "RW",
      "reuniones": "R"
    },
    "descripcion": "Descripción del perfil"
  }
}

// Response
{
  "success": true,
  "message": "Perfil creado",
  "perfilId": "p_nuevo_perfil"
}

// Error
{
  "success": false,
  "error": "ERR_PROFILE_EXISTS: El perfil ya existe"
}
```

#### `updateProfile`
Actualiza un perfil existente.

```javascript
{
  "action": "updateProfile",
  "sessionToken": "TOKEN_DE_SESIÓN",
  "payload": {
    "id": "p_admin",
    "nombre": "Super-Admin Actualizado",
    "permisos": {
      "core": "RW",
      "personas": "RW",
      "registros": "RW"
    }
  }
}

// Response
{
  "success": true,
  "message": "Perfil actualizado"
}

// Error
{
  "success": false,
  "error": "ERR_PROFILE_NOT_FOUND"
}
```

#### `deleteProfile`
Elimina un perfil (borrado lógico). No permite eliminar perfiles que tengan usuarios asignados.

```javascript
{
  "action": "deleteProfile",
  "sessionToken": "TOKEN_DE_SESIÓN",
  "payload": {
    "id": "p_perfil_a_eliminar"
  }
}

// Response
{
  "success": true,
  "message": "Perfil eliminado"
}

// Error - Perfil en uso
{
  "success": false,
  "error": "ERR_PROFILE_IN_USE: Hay usuarios con este perfil",
  "usuarios": 3
}

// Error - Perfil no encontrado
{
  "success": false,
  "error": "ERR_PROFILE_NOT_FOUND"
}
```

---

## 6. Instalación

### 6.1 Proceso de Instalación

> **Nota:** Los perfiles base se cargan desde el archivo `backend/data/seed_perfiles.json` y se envían en el payload de instalación desde el frontend.

#### `install`
Inicializa el sistema completo creando el Core Spreadsheet.

```javascript
{
  "action": "install",
  "payload": {
    "nombreCongregacion": "Congregación Central",
    "perfiles": [
      {
        "id": "p_admin",
        "nombre": "Super-Admin",
        "permisos": { "core": "RW", "personas": "RW", "registros": "RW" },
        "descripcion": "Acceso total al sistema"
      },
      // ... más perfiles del archivo seed_perfiles.json
    ]
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

### 7.3 Funciones TOTP (Implementación Nativa GAS)

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
| `ERR_SESSION_EXPIRED` | Sesión expirada |
| `ERR_SESSION_NOT_FOUND` | Sesión no encontrada |
| `ERR_RESOURCE_NOT_FOUND` | Hoja o recurso no encontrado |
| `ERR_TOTP_REQUIRED` | Se requiere código TOTP |
| `ERR_TOTP_INVALID` | Código TOTP inválido |
| `ERR_TOTP_NOT_CONFIGURED` | TOTP no configurado para el usuario |
| `ERR_TOTP_EXPIRED` | Configuración TOTP expirada |
| `ERR_NO_PENDING_TOTP` | No hay configuración TOTP pendiente |
| `ERR_CODE_REQUIRED` | Se requiere código de verificación |
| `ERR_EMAIL_OTP_NOT_CONFIGURED` | Email OTP no configurado para el usuario |
| `ERR_EMAIL_SEND` | Error al enviar email (ver `debug.error` para detalles) |
| `ERR_PASSKEY_NOT_CONFIGURED` | Passkey no configurado para el usuario |
| `ERR_PASSKEY_REQUIRED` | Se requiere autenticación con passkey |
| `ERR_INVALID_CREDENTIALS` | Usuario o contraseña incorrectos |
| `ERR_PASSWORD_REQUIRED` | Se requiere contraseña |
| `ERR_PASSWORD_WEAK` | Contraseña no cumple requisitos de complejidad |

### 10.1 Respuestas de Error con Debug Info

Algunas acciones incluyen información de debug en la respuesta para facilitar la resolución de problemas:

```javascript
// requestOTP - Error
{
  "success": false,
  "error": "ERR_EMAIL_SEND",
  "debug": {
    "username": "admin",
    "email": "admin@congregacion.com",
    "error": "MailApp quota exceeded"
  }
}

// requestOTP - Éxito
{
  "success": true,
  "message": "Código enviado por email",
  "debug": {
    "email": "admin@congregacion.com"
  }
}
```

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

### 13.4 Email con MailApp

El sistema utiliza `MailApp.sendEmail()` para enviar códigos OTP por email y emails de recuperación de contraseña.

**Notas importantes:**
- MailApp tiene un límite de 100 emails/día para cuentas gratuitas de Google
- Para cuentas Google Workspace, el límite es mayor
- El email se envía desde la cuenta del propietario del script
- La dirección de destino se resuelve del campo `email` del usuario, o usa el `username` como fallback

### 13.5 CORS y Configuración de Fetch

Google Apps Script no permiteheaders CORS personalizados. El frontend debe usar esta configuración:

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
// 1. Solicitar código OTP (método manual)
{
  "action": "requestOTP",
  "payload": {
    "username": "admin@congregacion.com"
  }
}

// 2. El usuario recibe el código por email
//    La respuesta incluye debug info con el email usado:
//    { "success": true, "debug": { "email": "admin@congregacion.com" } }

// 3. Iniciar sesión (siempre incluir password)
{
  "action": "login",
  "payload": {
    "username": "admin@congregacion.com",
    "password": "MiContraseña123!",
    "method": "email_otp",
    "code": "123456"
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
- `backend/data/seed_perfiles.json` - Perfiles base para instalación
- `docs/architecture/Backend.md` - Especificación original
- `docs/architecture/Core.md` - Arquitectura del núcleo del sistema
- `docs/architecture/Autenticacion.md` - Sistema de autenticación y flujos
- `docs/architecture/Arquitectura.md` - Arquitectura general
- `docs/architecture/Tecnologia.md` - Especificación tecnológica
- `docs/architecture/DataService.md` - Cliente frontend (DataService, JSONata, TanStack Query)
- `docs/architecture/Instalacion.md` - Guía de instalación
- `docs/PLAN_DESARROLLO.md` - Plan de desarrollo
- `docs/CHANGELOG.md` - Historial de cambios

---

*Documento generado automáticamente el 2026-03-31*
