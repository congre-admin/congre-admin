# Congre-Admin: Documentación Changelog

Registro de cambios realizados en la documentación del proyecto.

---

## Formato

Cada entrada debe incluir:
- **Fecha** (YYYY-MM-DD)
- **Tipo de cambio**: `Agregado`, `Modificado`, `Eliminado`
- **Archivo(s) afectado(s)**
- **Descripción** del cambio

---

## 2026-03-20

### Modificado

**Archivos:** `/system/*` (todos los archivos del sistema)

**Descripción:** **AI Agent System - Hardened (v2.0.0)**

Se actualizó todo el sistema de agente AI de "production-capable" a "high-reliability/near-deterministic":

| Archivo | Versión | Cambios Principales |
|---------|---------|---------------------|
| `system/prompt.md` | 2.0.0 | Prioridad de resolución, protocolo de asunciones, 8 fases |
| `system/execution.md` | 2.0.0 | Loop de 8 fases (Pre-Flight + Post-Flight), condición de parada explícita |
| `system/rules.md` | 2.0.0 | 91 reglas (de 72), todas atómicas y testeables |
| `system/acceptance.md` | 2.0.0 | Validación L1-L5 con checklists explícitos |
| `system/error-handling.md` | 2.0.0 | Protocolo de asunciones (Clases A-D) |
| `system/QUICKREF.md` | 2.0.0 | Referencia rápida actualizada |
| `examples/01-new-component.md` | 2.0.0 | Ejemplo "gold standard" con 8 fases completas |

**Mejoras Clave:**
- **8 fases** de ejecución (Pre-Flight + Post-Flight añadidos)
- **91 reglas** (de 72) - todas atómicas y testeables
- **5 niveles de validación** (L1-L5) con checklists explícitos
- **Protocolo de asunciones** formal (Clases A-D)
- **Condición de parada explícita** (5 criterios)
- **Jerarquía de prioridad** (5 niveles)
- **Checklists de 10 items** para Post-Flight

**Características del Sistema Hardened:**
- Minimiza variación de interpretación entre ejecuciones
- Comportamiento predecible y repetible
- Todas las reglas son enforceables y testeables
- Opera con mínima intervención humana

---

### Agregado

**Archivos:** `docs/modules/Admin_Registros.md`, `docs/modules/Reuniones.md`

**Descripción:** Nueva funcionalidad de **Registro de Asistencia**

- Menú `Asistencia` bajo sección `Reuniones` (acceso admin `shield_lock`)
- Esquema de datos simplificado:
  ```json
  {
    "id": "ast_2026_03_01_vym",
    "semana": "2026-03-01",
    "tipoReunion": "entreSemana",
    "total": 45,
    "comentarios": ""
  }
  ```
- Campos: `semana` (lunes de la semana), `tipoReunion` (`entreSemana`|`finDeSemana`), `total`, `comentarios`
- Generación de reporte mensual **S-3-S** (PDF)
- Tabla requerida: `Asistencia_Reuniones`

---

**Archivo:** `docs/architecture/Backend.md`

**Descripción:** Nota aclaratoria sobre `api.gs`

- Se documenta que `backend/src/api.gs` es una **implementación de referencia (Proof of Concept)**
- Lista de características NO implementadas:
  - ❌ Autenticación (`challenge`, `login`, `register`)
  - ❌ Validación de sesiones (`sessionToken`)
  - ❌ Motor JSONata
  - ❌ Control de permisos RBAC
  - ❌ Borrado lógico (`_deleted`) y versionado (`_v`, `_ts`)
- Hoja de ruta: 8 fases para completar el backend
- Aclaración criptografía: AES-GCM en frontend, backend solo almacena `wrapped_mk`

---

## 2026-03-19

### Agregado

**Archivos:** `docs/architecture/Estructura_Proyecto.md`, `docs/modules/Admin_Anuncios.md`

**Descripción:** Definición de la estructura de carpetas y Módulo de Anuncios.
- Mapa visual del directorio `/src` siguiendo el patrón de **Monolito Modular**.
- Creación del plugin de **Anuncios y Cartelera** como página de inicio (`/`) del sistema.
- Protocolo de **Cifrado de Archivos (Vault de Drive)**: Flujo AES-GCM local para PDFs sensibles.

---

### Modificado

**Archivos:** `docs/architecture/Tecnologia.md`, `docs/architecture/Arquitectura.md`, `docs/architecture/Interfaz.md`

**Descripción:** Blindaje técnico y patrones de UX.
- **Stack Oficial:** Definición de versiones para React 19, MUI v6, TanStack Query v5 y Tailwind v4.
- **Consultas Inteligentes:** Implementación de **Entidades Nombradas** (`$personas`) y **Colecciones Computadas** (`$ancianos`) en el motor JSONata.
- **Seed Data:** Especificación del formato de inyección con **IDs Relativos** (`@variable`) para preservar la integridad.
- **Navegación:** Introducción de **Landing Pages de Sección** y **Dashboard de Widgets** dinámicos.

---

**Archivos:** `docs/architecture/Permisos.md`, `docs/modules/Reuniones_Programa.md`

**Descripción:** Lógica de negocio y seguridad.
- **Perfiles Predefinidos:** Configuración JSON completa de permisos para 5 roles clave (Secretario, Superintendentes, etc.).
- **Acceso Contextual:** Reglas de filtrado automático basadas en el vínculo `personaId` (ej: Superintendente solo ve su grupo).
- **Motor de Sugerencias:** Lógica detallada de asignación automática para reuniones mediante ranking de antigüedad y frecuencia.

---

## Historial de Versiones de Documentación

| Fecha | Versión | Descripción |
|-------|---------|-------------|
| 2026-03-20 | 2.0.0 | AI Agent System Hardened + Asistencia feature |
| 2026-03-19 | 1.1.0 | Blindaje técnico y módulos completos |
| 2026-03-XX | 1.0.0 | Documentación inicial de arquitectura y módulos |

---

*Última actualización: 2026-03-20*
