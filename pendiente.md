# Pendientes y Deuda Técnica

## Módulos (Futuro)
- Informe de asistencia a las reuniones
- Resumen y promedios para el SC

## Bugs Conocidos

### Backend (`api.gs`)
- [ ] **CRUD sin RBAC** (líneas 70-160): `deleteData`, `hardDelete`, `restoreData`, `saveData`, `initSheet`, `clearSheet`, `deleteSheet` no verifican sesión ni permisos. Cualquiera con la URL y ssId puede manipular datos.
- [ ] **`deleteAccount()` llama función inexistente** (línea 2185): Usa `deleteData('Usuarios', user.id, true)` como función directa, pero `deleteData` solo existe como acción en `doPost()`. Fallaría en runtime.
- [ ] **`generateTOTP()` duplicado** (líneas 2536 y 2572): La segunda definición sobreescribe la primera. Funciona pero es code smell.
- [ ] **`invalidateCache()` es no-op** (línea 2749): Solo hace `Logger.log()`. GAS no soporta invalidación por patrón; el cache vive por TTL.

### Frontend
- [ ] **`admin/entry.tsx` huérfano**: No referenciado por ningún HTML. Usa `useAuth()` sin importar (no compilaría). Es el único archivo con `QueryClientProvider`.
- [ ] **Dark mode no funcional**: El toggle de `Navbar.tsx` agrega clase CSS pero no cambia el MUI ThemeProvider. MUI siempre renderiza tema light.
- [ ] **TanStack Query no integrado**: `QueryClientProvider` solo existe en `entry.tsx` huérfano. `main.tsx` no lo incluye.

## Pendientes de Implementación (Phase 2)

- [ ] **DataService** (`frontend/src/services/`): Adaptador centralizado para llamadas al backend GAS.
- [ ] **TypeScript Types** (`frontend/src/types/`): Interfaces para Usuario, Perfil, Persona, Plugin, Configuracion, etc.
- [ ] **Integrar TanStack Query**: Crear hooks por entidad usando DataService.
- [ ] **Integrar TanStack Table**: Motor de tablas avanzado para listados.
- [ ] **Integrar JSONata**: Motor de consultas y validaciones.

## Deuda Técnica

- [ ] **Directorios `core/` duplicados**: `src/core/` (legacy) y `src/admin/core/` (activo) coexisten. Solo `admin/core/` es importado por `main.tsx`. Limpiar `src/core/`.
- [ ] **Tabla `Etiquetas` no implementada**: Definida en `Backend.md` pero no se crea en `initCoreTables()` ni hay funciones para ella. Marcar como futura.
- [ ] **Schema Usuarios desalineado en docs antiguos**: Algunos docs viejos mencionan `auth_factor`, `totp_secret`, `public_key` como campos separados. El schema real usa `auth_config` (JSON) consolidado.
- [ ] **10 dependencias sin usar**: `@tanstack/react-query`, `@tanstack/react-table`, `jsonata`, `zod`, `jose`, `idb-keyval`, `pdf-lib`, `framer-motion`, `lucide-react`, `otpauth` instaladas pero sin imports.
- [ ] **No i18n**: Todos los strings hardcodeados en español.
- [ ] **No PWA/Service Worker**: Documentado pero no implementado.
- [ ] **Dark theme no persistente**: Toggle no guarda preferencia en localStorage.
