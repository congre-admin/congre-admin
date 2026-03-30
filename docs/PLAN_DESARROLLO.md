# Congre-Admin: Plan de Desarrollo

Este documento establece el orden de desarrollo del sistema, priorizando el Backend y el Módulo de Administración.

> **Nota de proceso:** En cada fase de la ejecución se debe dejar un registro de lo realizado en `docs/REGISTRO_EJECUCION.md`, incluyendo: fecha, estado de tareas, funciones implementadas, archivos modificados, notas y siguiente paso sugerido.

---

## FASE 1: Backend (Google Apps Script)

**Prioridad: ALTA** - Es la base de todo el sistema

El Backend debe cumplir con la especificación definida en `docs/architecture/Backend.md`.

### 1.1 Autenticación Zero-Knowledge
- [x] Implementar `challenge()` - Solicita desafío para Passkey/WebAuthn
- [x] Implementar `login()` - Valida credenciales y devuelve `wrapped_mk`
- [x] Implementar `register()` - Crea nuevo usuario
- [x] Soporte para Passkeys (WebAuthn) - Estructura básica
- [x] Soporte para TOTP (Google Authenticator) - Verificación básica
- [x] Soporte para OTP vía Email

### 1.2 Gestión de Sesiones
- [x] Implementar validación de `sessionToken`
- [x] Manejo de expiración de tokens
- [x] Renovación de sesiones

### 1.3 Control de Permisos RBAC
- [x] Integrar tabla `Perfiles` del Core
- [x] Validar permisos antes de cada operación
- [x] Soporte para permisos por módulo (R/W/RW)

### 1.4 Versionado y Borrado Lógico
- [x] Agregar campo `_v` (versión) a todas las tablas
- [x] Agregar campo `_ts` (timestamp) a todas las tablas
- [x] Agregar campo `_deleted` (borrado lógico)
- [x] Implementar lógica de "Last Write Wins" con detección de conflictos

### 1.5 Operaciones CRUD
- [x] Completar `batchGetData()` - Lectura múltiple
- [x] Completar `saveData()` - Upsert con versionado
- [x] Completar `deleteData()` - Borrado lógico
- [x] Implementar `initSheet()` - Creación de tablas

### 1.6 Sistema de Logs
- [x] Registrar intentos de acceso fallidos
- [x] Registrar cambios en esquema
- [x] Registrar operaciones de escritura

**Entregable:** `backend/src/api.gs` completo según especificación ✅

### 1.7 Funciones de Instalación
- [x] `createSpreadsheet()` - Crear GSheet
- [x] `initCoreTables()` - Inicializar tablas del Core
- [x] `seedPerfiles()` - Inyectar perfiles base
- [x] `seedConfiguracion()` - Inyectar configuración base
- [x] `actionInstall()` - Proceso completo de instalación

---

## FASE 0: Frontend Core (Completado)

**Prioridad: ALTA** - Base del sistema de interfaz

### 0.1 Scaffold del Proyecto
- [x] Crear proyecto Vite + React 19 + TypeScript
- [x] Configurar Tailwind CSS v4
- [x] Configurar MUI v6 con tema M3
- [x] Instalar dependencias principales

### 0.2 Setup Wizard
- [x] Componente de instalación de 4 pasos
- [x] Validación de conexión con backend
- [x] Instalación de base de datos
- [x] Creación de usuario admin

### 0.3 Autenticación
- [x] AuthContext con login/logout
- [x] Gestión de sesión en localStorage
- [x] ProtectedRoute para rutas protegidas
- [x] Login multi-step (password → TOTP/email_otp/passkey)
- [x] Configuración de TOTP (SetupTOTP) — QR + verificación
- [x] Configuración de Passkey (SetupPasskey) — WebAuthn nativo
- [x] Gestión de métodos auth (AuthSettings) — passkeys, TOTP, password, delete account
- [x] Backup/Restore de Master Key (BackupExport)

### 0.4 Shell UI
- [x] Layout principal con Sidebar
- [x] Navbar con menú de usuario
- [x] Soporte tema claro/oscuro

### 0.5 Dashboard
- [x] Vista básica con stat cards
- [x] Widgets de ejemplo

### 0.6 Despliegue
- [x] GitHub Actions workflow
- [x] Configuración para GitHub Pages
- [x] SPA fallback (404.html)

**Entregable:** `frontend/` completo

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
- Frontend Core (Fase 0)

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
