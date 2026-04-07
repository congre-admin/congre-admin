# Congre-Admin: Especificación de la Interfaz del Backend

En la arquitectura modular de Congre-Admin, el Backend se define como un **Proveedor de Servicios** (Data Provider) que debe cumplir con un protocolo de comunicación estándar. Actúa como el motor de ejecución para un sistema modular con segmentación física de datos.

> **Nota:** Para una referencia técnica completa de la implementación actual en Google Apps Script, incluyendo todas las acciones API, códigos de error, ejemplos de uso y detalles de optimización, ver **[Backend_API_Completa.md](./Backend_API_Completa.md)**.
>
> **Despliegue:** El backend se despliega usando clasp. Ver **[Despliegue_GAS.md](./Despliegue_GAS.md)** para instrucciones.

---

## 1. El Protocolo Backend (API Multi-ID)
Cualquier implementación de backend debe cumplir con las siguientes normas estructurales:

- **Convención de Nombres de ID:** Todas las tablas de datos **DEBEN** tener una columna de clave primaria denominada exactamente `id` (en minúsculas). Esto permite que la acción `saveData` realice operaciones *upsert* de forma universal e independiente del módulo.
- **Acciones Estándar:**
    - **`getData`**: Recuperación de datos de una hoja.
    - **`saveData`**: Operación *upsert* (insertar o actualizar) en un recurso específico.
    - **`deleteData`**: Borrado lógico de registros.
    - **`hardDelete`**: Borrado físico de registros.
    - **`restoreData`**: Restaurar registro borrado lógicamente.
    - **`initSheet`**: Preparación estructural del recurso basado en el esquema.
    - **`clearSheet`**: Limpiar contenido de una hoja manteniendo cabeceras.
- **Batch Orchestrator:**
    - **`batchExecute`**: Ejecuta múltiples operaciones (read, readById, save, delete, hardDelete, restore, initSheet) en una sola llamada API. Soporta modos `continue` (éxito parcial) y `fail-fast` (detener al primer error). Máximo 50 operaciones por llamada. Reemplaza a `batchGetData`, `batchSaveData`, `batchDeleteData` y `batchInitSheet`.

### Seguridad del Recurso
El backend debe validar que el `ssId` solicitado sea un recurso autorizado por el Núcleo para evitar accesos a archivos externos no relacionados con el sistema. **Todas las operaciones de escritura requieren sesión válida y permisos RBAC.** Las operaciones de lectura validan permisos si se proporciona sessionToken.

## 2. Validaciones
Las validaciones de esquema se ejecutan en el **Frontend** mediante JSONata antes de enviar los datos al backend. El backend confiablemente recepta los datos y los persiste.
- **Sanitización:** El backend aplica un filtro simple para el GSheet Público que elimina campos con prefijo `enc_`.

---

## 3. Estructura del GSheet Core (El Orquestador)
Para inicializar el sistema, el archivo GSheet maestro debe contener las siguientes tablas con sus respectivas cabeceras:

### Tabla: `Usuarios`
- `id`: UUID único.
- `username`: Correo electrónico.
- `wrapped_mk`: Master Key cifrada.
- `perfilId`: ID del perfil asignado.
- `auth_config`: Objeto JSON con configuración de autenticación (ver abajo).
- `metadata`: Objeto JSON con metadatos del usuario (ver abajo).
- `created_at`: Fecha de creación (ISO 8601).
- `_v`: Número de versión del registro.
- `_ts`: Timestamp de última modificación.
- `_deleted`: Booleano para borrado lógico.

#### Estructura del campo `metadata`
El campo `metadata` es un objeto JSON que almacena información adicional del usuario:

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

#### Estructura del campo `auth_config`
El campo `auth_config` es un objeto JSON que almacena toda la configuración de autenticación del usuario:

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

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `default_method` | string | Método de autenticación preferido: `passkey`, `totp`, `email_otp` |
| `password_hash` | string | Hash SHA-256 de la contraseña del usuario |
| `recovery_enabled` | boolean | Si el método de recuperación está habilitado |
| `email_otp` | object | Configuración del código por email |
| `email_otp.enabled` | boolean | Si el email OTP está habilitado |
| `email_otp.created_at` | ISO 8601 | Fecha de habilitación del email OTP |
| `totp` | object | Configuración de TOTP |
| `totp.enabled` | boolean | Si TOTP está configurado |
| `totp.secret` | string | Secreto TOTP en Base32 |
| `totp.created_at` | ISO 8601 | Fecha de configuración de TOTP |
| `passkeys` | array | Array de passkeys registrados |
| `passkeys[].id` | string | ID de la credencial (formato base64url) |
| `passkeys[].public_key` | string | Clave pública del passkey |
| `passkeys[].device_name` | string | Nombre descriptivo del dispositivo |
| `passkeys[].created_at` | ISO 8601 | Fecha de registro del passkey |

### Tabla: `Perfiles`
- `id`: ID del perfil (ej: `p_secretario`, `p_siervo_territorios`).
- `nombre`: Nombre descriptivo (ej: "Secretario", "Siervo de Territorios").
- `permisos`: Objeto JSON con el mapa de accesos (ej: `{"personas": "RW", "territorios": "R"}`).
- `descripcion`: Descripción del perfil.
- `_v`: Número de versión del registro.
- `_ts`: Timestamp de última modificación.
- `_deleted`: Booleano para borrado lógico.

### Tabla: `Etiquetas` (FUTURA — No implementada en api.gs)
> **Estado:** Definida en schema pero no se crea en `initCoreTables()` ni hay funciones CRUD para ella. Se implementará en una fase futura.

- `id`: UUID único del registro.
- `nombre`: Nombre visible (ej: `Hermanos Varones`).
- `alias_variable`: Nombre técnico para JSONata (ej: `Varones`). **Debe ser único.**
- `categoria`: Grupo al que pertenece (ej: `Demografía`).
- `color`: Código hexadecimal (ej: `#9C27B0`).
- `isVirtual`: Booleano (si es true, se calcula mediante JSONata).
- `expresion`: Expresión JSONata asociada.

### Tabla: `Registro_Plugins`
- `plugin_id`: Identificador (ej: `reuniones_programa`).
- `ssId`: ID del GSheet físico donde reside el plugin.
- `status`: `active`, `suspended`.
- `config`: Configuración JSON del plugin.
- `_v`: Número de versión del registro.
- `_ts`: Timestamp de última modificación.
- `_deleted`: Booleano para borrado lógico.

### Tabla: `Configuracion`
- `clave`: Identificador de ajuste.
    - Ejemplos: `nombre_congregacion`, `año_servicio_actual`, `idioma_predeterminado`.
- `valor`: Valor del ajuste (ej: `2026`).
- `is_public`: Booleano (si es accesible sin login).
- `_v`: Número de versión del registro.
- `_ts`: Timestamp de última modificación.
- `_deleted`: Booleano para borrado lógico.

### Tabla: `Sistema_Migraciones`
- `id`: UUID de la migración.
- `nombre`: Nombre de la migración.
- `version`: Versión del esquema.
- `ejecutada_en`: Fecha de ejecución.
- `estado`: Estado (`success`, `failed`, `pending`).
- `error`: Mensaje de error (si aplica).
- `_v`: Número de versión del registro.
- `_ts`: Timestamp de última modificación.

---

## 4. Implementación de Referencia: Google Apps Script (GAS)
El script `api.gs` es el plug-in de backend primario y utiliza Google Sheets como base de datos distribuida.

### Seguridad y Acceso
-   **Persistencia de API:** El frontend identifica el URL del GAS mediante el parámetro `api` en la URL y lo persiste localmente.
-   **Aislamiento:** El GAS gestiona el acceso a diferentes archivos de Google Sheets basándose en los IDs proporcionados por el Núcleo para el GSheet Core, el Público, el de Personas y los Operativos.
-   **Multi-tenancy:** No se usan Script Properties para estado de la aplicación. Todo el estado (ssId) se pasa explícitamente en cada petición.

### Modelo de Seguridad (Zero-Knowledge)
-   **Cofre Criptográfico:** El backend almacena la **Master Key (MK)** cifrada con la contraseña del usuario (`wrapped_mk`). La clave de envolver (Wrapping Key) se deriva de la contraseña mediante PBKDF2-HMAC-SHA256.
-   **Cifrado en Reposo:** El backend almacena y entrega bloques de texto cifrados con AES-GCM (incluyendo su IV) sin conocer su contenido original.
-   **Configuración de Auth:** Toda la configuración de autenticación se almacena en el campo `auth_config` de la tabla Usuarios, incluyendo passkeys, TOTP y email OTP.

## 5. Niveles de Autenticación
El proveedor de backend debe validar los factores de autenticación requeridos antes de emitir un `session_token`. El sistema soporta:

1.  **Autenticación Biométrica (Passkeys/WebAuthn):** Método primario para administradores. Requiere almacenamiento de la `Public Key` para validación de firmas.
2.  **TOTP (Time-based OTP):** Sincronización basada en tiempo (Google Authenticator).
3.  **OTP via Email:** Envío de códigos de respaldo vía Gmail (`MailApp`).

### Acciones de Autenticación y Sesión
- **`register`**: Crear nuevo usuario.
- **`login`**: Autenticar usuario y obtener sessionToken (soporta password, TOTP, email OTP, Passkey).
- **`challenge`**: Generar desafío para Passkey/WebAuthn (login).
- **`setupPasskey`**: Generar desafío para registrar nuevo passkey.
- **`confirmPasskey`**: Confirmar registro de passkey.
- **`deletePasskey`**: Eliminar un passkey registrado.
- **`setupTOTP`**: Generar código QR para configurar Google Authenticator.
- **`confirmTOTP`**: Confirmar configuración de TOTP.
- **`requestOTP`**: Enviar código OTP por email.
- **`getAuthMethods`**: Obtener métodos de autenticación habilitados del usuario.
- **`setDefaultAuthMethod`**: Establecer método de autenticación predeterminado.
- **`changePassword`**: Cambiar contraseña del usuario.
- **`confirmPasswordReset`**: Restablecer contraseña con token de recuperación.
- **`requestPasswordReset`**: Solicitar email de restablecimiento de contraseña.
- **`logout`**: Cerrar sesión.
- **`validateSession`**: Validar token de sesión.
- **`refreshSession`**: Renovar token de sesión.

> **Acciones eliminadas en v2.0:** `disableTOTP` (usar `saveData` en Usuarios), `deleteAccount` (usar `deleteData` en Usuarios), `updateAuthConfig` (usar `saveData` en Usuarios).

---

## 6. Control de Permisos RBAC

El sistema implementa Control de Acceso Basado en Roles con perfiles. Los perfiles base se definen en el archivo `frontend/public/data/seeds/core/perfiles.json` y se injectan durante la instalación.

### Perfiles Soportados
| Perfil ID | Nombre | Permisos |
|-----------|--------|----------|
| `p_admin` | Super-Admin | RW en todos los módulos |
| `p_secretario` | Secretario | Granular: core R (todas las sheets), personas RW, registros RW, anuncios RW, reuniones R, predicación R |
| `p_comite` | Comité de Servicio | Granular: core R, personas R, registros R, reuniones R, predicación R |
| `p_super_grupo` | Superintendente de Grupo | Granular: core R, personas R, registros RW, reuniones R |
| `p_siervo_territorios` | Siervo de Territorios | Granular: core R, predicación RW |
| `p_publicador` | Publicador | Granular: core R, reuniones R, predicación R |

### Formato de Permisos Granulares (v2.1+)

Los permisos soportan dos formatos: **plano** (`"core":"RW"`) y **granular** (`"core":{"configuracion":"RW","*":"R"}`). Ver [Backend_API_Completa.md](./Backend_API_Completa.md) sección 4.2 para detalles completos.

### Acciones de Permisos (LECTURA)
- **`getPerfiles`** (ELIMINADO): Usar `batchExecute` con op `read` en hoja `Perfiles`.
- **`getPermisos`** (ELIMINADO): Usar `batchExecute` con op `read` en `Usuarios` + `Perfiles`.
- **`checkPermission`** (ELIMINADO): El frontend valida permisos leyendo `Perfiles` directamente.

### Gestión de Perfiles (CRUD)
Los perfiles se gestionan mediante las operaciones CRUD genéricas:
- **`createProfile`** (ELIMINADO): Usar `saveData('Perfiles')`.
- **`updateProfile`** (ELIMINADO): Usar `saveData('Perfiles')`.
- **`deleteProfile`** (ELIMINADO): Usar `deleteData('Perfiles')`.

> **Nota:** Los perfiles son dinámicos. El administrador puede crear, modificar y eliminar perfiles desde la aplicación usando las operaciones CRUD genéricas.

---

## 7. Versionado y Borrado Lógico

El sistema implementa versionado automático y borrado lógico para todas las tablas.

### Campos de Sistema
- **`_v`**: Número de versión incremental.
- **`_ts`**: Timestamp ISO 8601 de última modificación.
- **`_deleted`**: Booleano para borrado lógico (soft delete).

### Resolución de Conflictos (Last Write Wins)
- El cliente envía `expectedVersion` con el payload.
- Si la versión del servidor es mayor, retorna error `ERR_VERSION_CONFLICT`.
- El cliente debe reintentar con datos actualizados.

---

## 8. Sistema de Caché y Rate Limiting

### Caché
- **Lectura directa de hojas**: `getCachedSheetData` lee directamente de la hoja sin `CacheService` (v2.2). Para hojas pequeñas, el rendimiento es instantáneo.
- **Lookup cache**: Búsquedas de usuarios/perfiles usan `CacheService` con TTL de 5 minutos.
- `invalidateCache(pattern)` es un no-op; la expiración es automática por TTL.
- **Caché intra-batch**: `batchExecute` lee cada hoja una vez por lote y acumula cambios en memoria.

### Rate Limiting
- Máximo 5 intentos por minuto por username en acciones de autenticación.
- Retorna `retryAfter` con el tiempo restante.

---

## 9. Instalación

### Proceso de Instalación (Frontend Orchestration)
La instalación se realiza mediante la acción `install` que crea los spreadsheets, seguida de orquestación desde el frontend usando `batchExecute`.

```javascript
// Paso 1: Install (solo crea spreadsheets)
{
  "action": "install",
  "payload": {
    "nombreCongregacion": "Nombre de la Congregación"
  }
}
// Respuesta: { ssId, ssUrl, publicSsId, publicSsUrl }

// Paso 2: Frontend orchestra usando batchExecute
{
  "action": "batchExecute",
  "payload": {
    "ssId": "CORE_SS_ID",
    "operations": [
      { "op": "initSheet", "sheet": "Usuarios", "headers": [...] },
      { "op": "initSheet", "sheet": "Perfiles", "headers": [...] },
      { "op": "initSheet", "sheet": "Configuracion", "headers": [...] },
      { "op": "save", "sheet": "Perfiles", "data": { "id": "p_admin", ... } },
      { "op": "save", "sheet": "Configuracion", "data": { "clave": "nombre_congregacion", ... } }
    ]
  }
}
```

### Acciones de Instalación
- **`install`**: Crea los spreadsheets Core y Público.
- **`createSpreadsheet`**: Crear nuevo Google Spreadsheet (función interna).
- **`batchExecute`**: Operación unificada para init, save, delete, restore, read. Reemplaza `batchInitSheet`, `batchSaveData`, `batchDeleteData`.
- **`initCoreTables`** (ELIMINADO): Usar `batchExecute` con op `initSheet`.
- **`seedPerfiles`** (ELIMINADO): Usar `batchExecute` con op `save`.
- **`seedConfiguracion`** (ELIMINADO): Usar `batchExecute` con op `save`.

---

## 10. El Cofre Criptográfico y Passkeys
Cuando un usuario se autentica mediante **Passkey**, el backend valida el desafío y entrega la **Master Key cifrada** (`wrapped_mk`).
-   El frontend descifra la MK localmente para mantener el modelo de **Conocimiento Cero**.
-   Se recomienda el uso del Keyring del sistema operativo para mantener las llaves de desbloqueo de forma persistente y segura.

---

## 11. Optimización: Batch Execute y Caché
-   **`batchExecute`:** Ejecuta múltiples operaciones en una sola llamada API, reduciendo latencia y consumo de quota GAS. Soporta caché intra-batch (cada hoja se lee una vez por lote).
-   **Capa de Caché:** Implementación de `CacheService` para acelerar lecturas masivas de datos públicos y configuraciones de plugins.
-   **softDeleteRow optimizado:** Usa un solo `setValues()` en lugar de 3× `setValue()`.

## 12. Logs y Auditoría
El backend es responsable de registrar en el GSheet Core:
-   Intentos de acceso fallidos y exitosos.
-   Cambios en la tabla maestra de Esquema.
-   Historial de operaciones de escritura en la tabla de Personas y configuraciones de Plugins.

## 13. Evolución de Datos y Backups
Para garantizar que no haya pérdida de información durante actualizaciones del sistema:

### A. Política de `initSheet` No Destructiva
- El backend nunca debe borrar una hoja si ya existe (`preserveExisting: true`).
- Si se añaden nuevas columnas, el backend debe añadirlas al final de la cabecera actual sin alterar las existentes.

### B. Migraciones de Esquema
- Para cambios backward-compatible (agregar campos opcionales): seguir política `initSheet` no destructiva.
- Para cambios breaking (renombrar/eliminar campos): ejecutar script de migración desde `scripts/migrations/`.
- Toda migración debe registrarse en la tabla `Sistema_Migraciones` del GSheet Core.
- Ver [Estrategia de Migración de Esquemas](./Migraciones.md) para detalles completos.

### C. Sistema de Backup Manual
- El Core debe exponer una función de "Exportar Backup Completo" que descargue un archivo ZIP conteniendo todos los archivos GSheet vinculados en formato JSON.
- **Requerido:** Ejecutar backup antes de cualquier migración breaking.

## 14. Gestión de Volumen y Archivado (Cold Storage)
Para mantener el rendimiento óptimo y no alcanzar el límite de 10M de celdas de Google Sheets:

### A. Archivado de Logs
- **Frecuencia:** Semestral.
- **Acción:** Los logs con una antigüedad superior a 6 meses se mueven automáticamente (o bajo demanda del Admin) a una hoja llamada `Logs_Archivo_[AÑO]`.
- **Visibilidad:** El visor de logs del Core solo muestra los últimos 6 meses por defecto, con opción de "Cargar Archivo Histórico".

### B. Históricos Operativos (Reuniones y Territorios)
- **Cierre de Ciclo:** Al finalizar el año de servicio, el sistema sugiere archivar los programas y asignaciones de territorios completados hace más de 2 años.
- **Mecánica:** Se crea un nuevo GSheet (`ssId_Archive`) y se mueven las filas físicas allí. El Core mantiene una referencia a este nuevo `ssId` solo para consultas de reportes históricos.

### C. Optimización de Lectura
- El backend (`api.gs`) utiliza `CacheService` para las tablas de configuración y esquemas, reduciendo las llamadas a la API de GSheets.
- `batchExecute` implementa caché intra-batch: cada hoja se carga una vez y se reutiliza para todas las operaciones del lote.

---

## 15. Funciones Deprecadas y Eliminadas

### Eliminadas en v2.0 (reemplazadas por operaciones genéricas)

| Función Eliminada | Reemplazo |
|-------------------|-----------|
| `batchGetData` | `batchExecute` con múltiples ops `read` |
| `batchSaveData` | `batchExecute` con múltiples ops `save` |
| `batchDeleteData` | `batchExecute` con múltiples ops `delete` |
| `batchInitSheet` | `batchExecute` con múltiples ops `initSheet` |
| `getHistory` | `batchExecute` con op `read` (frontend filtra por id) |
| `deleteSheet` | No disponible (usar Google Sheets UI) |
| `getPerfiles` | `batchExecute` con op `read` en `Perfiles` |
| `getPermisos` | `batchExecute` con op `read` en `Usuarios` + `Perfiles` |
| `checkPermission` | Validación directa en frontend |
| `createProfile` | `batchExecute` con op `save` en `Perfiles` |
| `updateProfile` | `batchExecute` con op `save` en `Perfiles` |
| `deleteProfile` | `batchExecute` con op `delete` en `Perfiles` |
| `disableTOTP` | `batchExecute` con op `save` en `Usuarios` (actualizar auth_config) |
| `deleteAccount` | `batchExecute` con op `delete` en `Usuarios` |
| `updateAuthConfig` | `batchExecute` con op `save` en `Usuarios` |
| `initCoreTables` | `batchExecute` con ops `initSheet` |
| `seedPerfiles` | `batchExecute` con ops `save` en `Perfiles` |
| `seedConfiguracion` | `batchExecute` con ops `save` en `Configuracion` |
| `actionResetPassword` | Renombrada a `confirmPasswordReset` |

---

## 16. Documentación Técnica

Para una referencia completa de la implementación, ver:

- **[Backend_API_Completa.md](./Backend_API_Completa.md)** - Documentación técnica detallada con:
  - Todas las acciones API documentadas
  - Estructuras de datos completas
  - Flujos de autenticación
  - Sistema de permisos RBAC
  - Códigos de error
  - Ejemplos de uso
  - Notas de optimización de quota GAS
  - Funciones deprecadas y sus reemplazos

- **[DataService.md](./DataService.md)** - Frontend DataService (implementación del cliente):
  - Tipos TypeScript
  - DataService (cliente HTTP)
  - DataTransformService (JSONata)
  - TanStack Query hooks
  - AuthService y PublicService

### Archivos Relacionados

| Archivo | Descripción |
|--------|-------------|
| `Backend_API_Completa.md` | Documentación técnica completa |
| `Arquitectura.md` | Arquitectura general del sistema |
| `Core.md` | Arquitectura del núcleo del sistema |
| `Autenticacion.md` | Sistema de autenticación y flujos |
| `Tecnologia.md` | Especificación tecnológica |
| `Instalacion.md` | Guía de instalación |
| `PLAN_DESARROLLO.md` | Plan de desarrollo |
