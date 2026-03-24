# Congre-Admin: Plan de Desarrollo

Este documento establece el orden de desarrollo del sistema, priorizando el Backend y el Módulo de Administración.

---

## FASE 1: Backend (Google Apps Script)

**Prioridad: ALTA** - Es la base de todo el sistema

El Backend debe cumplir con la especificación definida en `docs/architecture/Backend.md`.

### 1.1 Autenticación Zero-Knowledge
- [ ] Implementar `challenge()` - Solicita desafío para Passkey/WebAuthn
- [ ] Implementar `login()` - Valida credenciales y devuelve `wrapped_mk`
- [ ] Implementar `register()` - Crea nuevo usuario
- [ ] Soporte para Passkeys (WebAuthn)
- [ ] Soporte para TOTP (Google Authenticator)
- [ ] Soporte para OTP vía Email

### 1.2 Gestión de Sesiones
- [ ] Implementar validación de `sessionToken`
- [ ] Manejo de expiración de tokens
- [ ] Renovación de sesiones

### 1.3 Control de Permisos RBAC
- [ ] Integrar tabla `Perfiles` del Core
- [ ] Validar permisos antes de cada operación
- [ ] Soporte para permisos por módulo (R/W/RW)

### 1.4 Versionado y Borrado Lógico
- [ ] Agregar campo `_v` (versión) a todas las tablas
- [ ] Agregar campo `_ts` (timestamp) a todas las tablas
- [ ] Agregar campo `_deleted` (borrado lógico)
- [ ] Implementar lógica de "Last Write Wins" con detección de conflictos

### 1.5 Operaciones CRUD
- [ ] Completar `batchGetData()` - Lectura múltiple
- [ ] Completar `saveData()` - Upsert con versionado
- [ ] Completar `deleteData()` - Borrado lógico
- [ ] Implementar `initSheet()` - Creación de tablas

### 1.6 Sistema de Logs
- [ ] Registrar intentos de acceso fallidos
- [ ] Registrar cambios en esquema
- [ ] Registrar operaciones de escritura

**Entregable:** `backend/src/api.gs` completo según especificación

---

## FASE 2: Módulo de Administración

**Prioridad: ALTA** - Primera interacción del usuario con el sistema

### 2.1 Admin_Personas
- [ ] Crear módulo en `src/modules/personas/`
- [ ] Implementar vista `/lista`
- [ ] Tabla de personas con filtros
- [ ] Ficha de edición (Drawer lateral)
- [ ] Pestañas: Identidad, Contacto, Servicio, Metadatos
- [ ] Herramientas de exportación (PDF, XLSX, CSV, JSON)

**Dependencias:**
- Backend (Fase 1)

### 2.2 Admin_Registros

#### Pestaña Registros (4 sub-pestañas)
- [ ] Sub-pestaña Publicadores: Ver registros, descargar S-21
- [ ] Sub-pestaña Resumen: Totales y promedios
- [ ] Sub-pestaña Movimientos: Gestión de altas/bajas
- [ ] Sub-pestaña Reuniones: Consulta de asistencia

#### Pestaña Informes (2 sub-pestañas)
- [ ] Sub-pestaña Grupo: Carga de informes por superintendentes
- [ ] Sub-pestaña Congregación: Carga de informes por secretario

#### Pestaña Cierre (3 sub-pestañas)
- [ ] Sub-pestaña Estado: Dashboard de cumplimiento
- [ ] Sub-pestaña Cierre: Generar cierre mensual
- [ ] Sub-pestaña Visita SC: Documentación para el Superintendente de Circuito

**Dependencias:**
- Admin_Personas (2.1)

### 2.3 Admin_Usuarios
- [ ] Vista de gestión de usuarios
- [ ] Matriz de permisos
- [ ] Generador de enlaces de invitación
- [ ] Monitor de seguridad

**Dependencias:**
- Backend (Fase 1)

### 2.4 Admin_Anuncios
- [ ] Cartelera de inicio
- [ ] Gestión de avisos

### 2.5 Admin_Sistema
- [ ] Configuración de plugins
- [ ] Ajustes generales

---

## FASE 3+: Módulos Restantes

Se desarrollarán de a uno, en orden a definir:

| # | Módulo | Notas |
|---|--------|-------|
| 3.1 | Reuniones_Programa | Programa semanal |
| 3.2 | Predicacion_Territorios | Gestión de territorios |
| 3.3 | (otros) | A definir |

---

## Notas

- **Arquitectura:** El sistema sigue una arquitectura de Núcleo y Plug-ins según `docs/architecture/Arquitectura.md`
- **Documentación:** Cada módulo debe seguir el estándar definido en `docs/architecture/Guia_Documentacion.md`
- **Repositorios:**
  - Código Fuente: https://github.com/congre-admin/congre-admin
  - SitioPublicado: https://congre-admin.github.io
