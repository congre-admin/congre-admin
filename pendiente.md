# Pendientes y Deuda Técnica

> **Última actualización:** 2026-04-12
> **Estado:** Core completo, listo para desarrollo de plugins

---

## Módulos (Futuro)

- Informe de asistencia a las reuniones
- Resumen y promedios para el SC

---

## Bugs Conocidos

### Backend (`api.gs`)

- [x] **CRUD sin RBAC**: Ya implementado en `batchExecute` (líneas 193-218). Valida sesión y permisos antes de operar.
- [ ] **`generateTOTP()` duplicado** (línea 2260): Una sola función, no duplicado. ~~(líneas 2536 y 2572)~~ - verificado, solo existe una.
- [ ] **`invalidateCache()` es no-op** (línea ~2749): Solo hace `Logger.log()`. GAS no soporta invalidación por patrón; el cache vive por TTL.

### Frontend

- [x] **`admin/entry.tsx` huérfano**: Archivo no existe. Eliminado.
- [x] **TanStack Query no integrado**: Ya integrado en `main.tsx`. QueryClientProvider presente.
- [x] **Dark mode no funcional**: ThemeContext usa modo persistido en localStorage y cambia el tema MUI dinámicamente.

---

## Pendientes de Implementación (Phase 2)

- [x] **DataService** (`frontend/src/services/`): ✅ Completado
- [x] **TypeScript Types** (`frontend/src/types/`): ✅ Completado
- [x] **Integrar TanStack Query**: ✅ Completado (en main.tsx)
- [ ] **Integrar TanStack Table**: Para tablas avanzadas en módulos
- [x] **Integrar JSONata**: Motor disponible en `jsonataService.ts`

---

## Deuda Técnica

- [ ] **Directorios `core/` duplicados**: `src/core/` (legacy) y `src/admin/core/` (activo) coexisten. Solo `admin/core/` es importado por `main.tsx`.
- [ ] **Tabla `Etiquetas` no implementada**: Definida en `Backend.md` pero no se crea. Pendiente Fase 3.
- [x] **Schema Usuarios desalineado**: Docs actualizados, schema usa `auth_config` (JSON).
- [ ] **10 dependencias sin usar**: `zod`, `jose`, `idb-keyval`, `pdf-lib`, `framer-motion`, `lucide-react`, `otpauth` instaladas pero sin imports. Verificar necesidad.
- [ ] **No i18n**: Todos los strings hardcodeados en español.
- [ ] **No PWA/Service Worker**: Documentado pero no implementado.

---

## Estado Final v2.3

| Componente        | Estado      |
| ----------------- | ---------- |
| Backend (api.gs) | ✅ Completo |
| Auth + Sessions   | ✅ Completo |
| RBAC              | ✅ Completo |
| Frontend Core    | ✅ Completo |
| TanStack Query   | ✅ Completo |
| Theme (Dark/Light)| ✅ Completo |
| Public Mode      | ✅ Completo |
| Setup Wizard     | ✅ Completo |
| Módulos Admin    | Parcial    |

**Listo para desarrollo de plugins.**