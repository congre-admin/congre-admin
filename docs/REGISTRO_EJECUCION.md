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

*Registro creado automáticamente durante el desarrollo*
