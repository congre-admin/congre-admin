# Registro de Ejecución del Desarrollo

Este Documento registra la ejecución de cada fase del desarrollo del sistema.

> **Nota:** En cada fase de la ejecución se debe dejar un registro de lo realizado, siguiendo este formato:
> - Fecha de inicio y finalización
> - Estado de cada tarea
> - Funciones/files implementados
> - Archivos modificados
> - Notas relevantes
> - Siguiente paso sugerido

---

## Fase 1: Backend (Google Apps Script)

### 1.1 Autenticación Zero-Knowledge ✅ COMPLETADO
**Fecha:** 2026-03-24

**Estado:** ✅ Implementado

#### Tareas completadas:
- [x] Implementar `challenge()` - Solicita desafío para Passkey/WebAuthn
- [x] Implementar `login()` - Valida credenciales y devuelve `wrapped_mk`
- [x] Implementar `register()` - Crea nuevo usuario
- [x] Soporte para Passkeys (WebAuthn) - Estructura básica
- [x] Soporte para TOTP (Google Authenticator) - Verificación básica
- [x] Soporte para OTP vía Email

#### Funciones implementadas:
| Función | Descripción |
|---------|-------------|
| `getCoreSpreadsheetId()` | Obtiene ID del GSheet Core |
| `getUsuariosSheet()` | Obtiene hoja de Usuarios |
| `getUserByUsername()` | Busca usuario por email |
| `getUserById()` | Busca usuario por ID |
| `createUser()` | Crea nuevo usuario |
| `updateUser()` | Actualiza usuario |
| `generateSessionToken()` | Genera token de sesión |
| `validateSession()` | Valida token |
| `invalidateSession()` | Cierra sesión |
| `actionRegister()` | Acción API: register |
| `actionLogin()` | Acción API: login |
| `actionChallenge()` | Acción API: challenge |
| `actionRequestOTP()` | Acción API: requestOTP |
| `actionLogout()` | Acción API: logout |
| `sendOTPEmail()` | Envía código por email |
| `verifyEmailOTP()` | Verifica código email |
| `verifyTOTP()` | Verifica código TOTP |
| `logAccess()` | Registra accesos |

#### Archivos modificados:
- `backend/src/api.gs` - Implementación de autenticación
- `docs/architecture/Backend.md` - Actualizado estado
- `docs/PLAN_DESARROLLO.md` - Checkboxes marcados

#### Notas:
- CORE_SS_ID debe configurarse en propiedades del script
- TOTP: implementación básica, requiere biblioteca en producción
- Sesiones: almacenadas en UserProperties

#### Siguiente paso sugerido:
- Fase 1.2: Gestión de Sesiones (refinamiento)
- Fase 1.3: Control de Permisos RBAC

---

### 1.2 Gestión de Sesiones ✅ COMPLETADO
**Fecha:** 2026-03-24

**Estado:** ✅ Implementado

#### Tareas completadas:
- [x] Implementar validación de `sessionToken`
- [x] Manejo de expiración de tokens
- [x] Renovación de sesiones

#### Funciones implementadas:
| Función | Descripción |
|---------|-------------|
| `refreshSessionToken()` | Renueva/extiende un token de sesión |
| `getActiveSessions()` | Obtiene todas las sesiones activas de un usuario |
| `invalidateAllSessions()` | Cierra todas las sesiones de un usuario |
| `action refreshSession` | Acción API para renovar sesión |
| `action getActiveSessions` | Acción API para obtener sesiones activas |
| `action invalidateAllSessions` | Acción API para cerrar todas las sesiones |

#### Archivos modificados:
- `backend/src/api.gs` - Agregadas funciones de renovación de sesiones

#### Notas:
- Renovación automática cuando quedan menos de 1 hora de sesión
- Soporte para cerrar todas las sesiones (útil para cambio de contraseña)

#### Siguiente paso sugerido:
- Fase 1.3: Control de Permisos RBAC

---

### 1.3 Control de Permisos RBAC ✅ COMPLETADO
**Fecha:** 2026-03-24

**Estado:** ✅ Implementado

#### Tareas completadas:
- [x] Integrar tabla `Perfiles` del Core
- [x] Validar permisos antes de cada operación
- [x] Soporte para permisos por módulo (R/W/RW)

#### Funciones implementadas:
| Función | Descripción |
|---------|-------------|
| `getPerfilesSheet()` | Obtiene hoja de Perfiles |
| `getPerfilById()` | Busca perfil por ID |
| `getAllPerfiles()` | Obtiene todos los perfiles |
| `getPermiso()` | Obtiene permiso para un módulo |
| `validarPermiso()` | Valida si usuario tiene permiso |
| `getUserPermisos()` | Obtiene todos los permisos de un usuario |
| `checkPermission()` | Valida permisos antes de operación CRUD |
| `actionGetPerfiles()` | Acción API: obtener perfiles |
| `actionGetPermisos()` | Acción API: obtener permisos de usuario |
| `actionCheckPermission()` | Acción API: validar permiso |

#### Archivos modificados:
- `backend/src/api.gs` - Agregadas funciones de control de permisos

#### Notas:
- Soporte para permisos: R (Read), W (Write), RW (Read-Write)
- Integración con tabla Perfiles del GSheet Core
- Función checkPermission para validar antes de operaciones CRUD

#### Siguiente paso sugerido:
- Fase 1.4: Versionado y Borrado Lógico

---

### 1.4 Versionado y Borrado Lógico ✅ COMPLETADO
**Fecha:** 2026-03-24

**Estado:** ✅ Implementado

#### Tareas completadas:
- [x] Agregar campo `_v` (versión) a todas las tablas
- [x] Agregar campo `_ts` (timestamp) a todas las tablas
- [x] Agregar campo `_deleted` (borrado lógico)
- [x] Implementar lógica de "Last Write Wins" con detección de conflictos

#### Funciones implementadas:
| Función | Descripción |
|---------|-------------|
| `getSheetData(sheet, includeDeleted)` | Obtiene datos filtrando registros borrados |
| `softDeleteRow()` | Marca registro como borrado (_deleted = true) |
| `restoreRow()` | Restaura registro borrado lógicamente |
| `getVersionHistory()` | Obtiene historial de versiones de un registro |
| `action: hardDelete` | Borrado físico (solo admin) |
| `action: restoreData` | Restaura registro borrado |
| `action: getHistory` | Obtiene historial de versiones |
| `action: saveData` | Ahora valida versión (Last Write Wins) |

#### Archivos modificados:
- `backend/src/api.gs` - Agregadas funciones de versionado y borrado lógico

#### Notas:
- Por defecto, deleteData usa borrado lógico (_deleted)
- saveData incluye detección de conflictos de versión
- ERR_VERSION_CONFLICT cuando hay conflicto

#### Siguiente paso sugerido:
- Fase 1.5: Operaciones CRUD

---

### 1.5 Operaciones CRUD ✅ COMPLETADO
**Fecha:** 2026-03-24

**Estado:** ✅ Implementado (completado en fases anteriores)

#### Tareas completadas:
- [x] Completar `batchGetData()` - Lectura múltiple
- [x] Completar `saveData()` - Upsert con versionado
- [x] Completar `deleteData()` - Borrado lógico
- [x] Implementar `initSheet()` - Creación de tablas

#### Notas:
- Las funciones CRUD ya existían y fueron mejoradas con versionado

---

### 1.6 Sistema de Logs ✅ COMPLETADO
**Fecha:** 2026-03-24

**Estado:** ✅ Implementado

#### Tareas completadas:
- [x] Registrar intentos de acceso fallidos
- [x] Registrar cambios en esquema
- [x] Registrar operaciones de escritura

#### Funciones implementadas:
| Función | Descripción |
|---------|-------------|
| `logAccess()` | Registra intentos de acceso (éxito/fallo) |

---

### ✅ FASE 1 COMPLETADA
**Fecha:** 2026-03-24

Todas las tareas de la Fase 1 (Backend) han sido completadas:
- 1.1 Autenticación Zero-Knowledge ✅
- 1.2 Gestión de Sesiones ✅
- 1.3 Control de Permisos RBAC ✅
- 1.4 Versionado y Borrado Lógico ✅
- 1.5 Operaciones CRUD ✅
- 1.6 Sistema de Logs ✅

#### Siguiente paso sugerido:
- Fase 2: Módulo de Administración

---

### 1.7 Funciones de Instalación ✅ COMPLETADO
**Fecha:** 2026-03-24

**Estado:** ✅ Implementado

#### Tareas completadas:
- [x] `createSpreadsheet()` - Crear GSheet
- [x] `initCoreTables()` - Inicializar tablas del Core
- [x] `seedPerfiles()` - Inyectar perfiles base
- [x] `seedConfiguracion()` - Inyectar configuración base
- [x] `actionInstall()` - Proceso completo de instalación

#### Funciones implementadas:
| Función | Descripción |
|---------|-------------|
| `createSpreadsheet()` | Crea nuevo Google Spreadsheet |
| `initCoreTables()` | Inicializa tablas: Usuarios, Perfiles, Registro_Plugins, Configuracion, Sistema_Migraciones |
| `createSheetIfNotExists()` | Helper para crear hojas |
| `seedPerfiles()` | Inyecta 6 perfiles base |
| `seedConfiguracion()` | Inyecta configuración inicial |
| `actionInstall()` | Proceso completo de instalación |

#### Acciones API:
| Acción | Descripción |
|--------|-------------|
| `install` | Proceso completo de instalación |
| `createSpreadsheet` | Crear spreadsheet |
| `initCoreTables` | Inicializar tablas |
| `seedPerfiles` | Inyectar perfiles |
| `seedConfiguracion` | Inyectar configuración |

#### Archivos modificados:
- `backend/src/api.gs` - Agregadas funciones de instalación

#### Notas:
- Los perfiles base incluyen: Admin, Comité, Superintendente de Grupo, Siervo de Territorios, Publicador
- Tablas del Core: Usuarios, Perfiles, Registro_Plugins, Configuracion, Sistema_Migraciones

#### Limpieza realizada:
- Removida nota de "implementación de referencia" de `docs/architecture/Backend.md`
- Removido código XXTEA de `backend/src/api.gs`

---

### Code Quality Fixes ✅ COMPLETADO
**Fecha:** 2026-03-24

**Estado:** ✅ Fase 1 completada (duplicado eliminado)

#### Tareas completadas:
- [x] **Verificación de issues:** Analizado `backend/src/api.gs` para identificar code quality issues
- [x] **Issue #1 - Duplicate saveData:** Eliminado bloque duplicado de `saveData` (líneas 43-48 sin versionado). Ahora solo existe el bloque con control de versiones (línea 110+).
- [x] **Issue #2 - Type inconsistency permisos:** Creada función helper `normalizePermisos()` para normalizar el campo permisos (string JSON → objeto). Actualizadas funciones `getPermiso()` y `getUserPermisos()`.
- [x] **Issue #4 - O(n) performance:** Implementadas funciones `getCached()` e `invalidateCache()` usando CacheService. Actualizadas funciones `getUserByUsername()`, `getUserById()`, `getPerfilById()` para usar caché con TTL de 5 minutos.
- [x] **Issue #5 - Rate limiting:** Implementada función `checkRateLimit()` usando CacheService. Integrada en `actionLogin()` con límite de 5 intentos por minuto por username.

#### Issues identificados (completados):
| # | Issue | Prioridad | Estado |
|---|-------|-----------|--------|
| 1 | Duplicate saveData | ALTA | ✅ Completado |
| 2 | Type inconsistency `permisos` | MEDIA | ✅ Completado |
| 3 | Null safety `getPerfilById()` | BAJA | Verificado (ok) |
| 4 | O(n) performance | BAJA | ✅ Completado |
| 5 | Rate limiting (login) | BAJA | ✅ Completado |

#### Archivos modificados:
- `backend/src/api.gs` - Eliminados bloques duplicados, agregadas funciones `normalizePermisos()`, `checkRateLimit()`, `getCached()`, `invalidateCache()`. Actualizadas funciones de búsqueda para usar caché.
- `docs/CHANGELOG.md` - Agregada entrada de corrección
- `docs/REGISTRO_EJECUCION.md` - Actualizado registro

#### Siguiente paso sugerido:
- Fase 2: Módulo de Administración (Admin_Personas)

---

*Registro creado automáticamente durante el desarrollo*
