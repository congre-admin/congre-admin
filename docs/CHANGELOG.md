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

## 2026-03-24

### Nuevo
- **Desarrollo iniciado:** Creado `docs/REGISTRO_EJECUCION.md` para documentar el progreso del desarrollo.
- **Fase 1.1 completada:** Implementación de autenticación Zero-Knowledge en `backend/src/api.gs` (challenge, login, register, TOTP, OTP email, gestión de sesiones).
- **Fase 1.2 completada:** Gestión de sesiones (renovación, validación, cierre).
- **Fase 1.3 completada:** Control de permisos RBAC (perfiles, validación de permisos).
- **Fase 1.4 completada:** Versionado y borrado lógico (_v, _ts, _deleted).
- **Fase 1.5-1.6 completadas:** Operaciones CRUD y Sistema de Logs.
- **Fase 1.7 completada:** Funciones de instalación (createSpreadsheet, initCoreTables, seedPerfiles).
- **Limpieza:** Removida implementación de referencia de `docs/architecture/Backend.md` y código XXTEA de `backend/src/api.gs`.

## 2026-03-24

### Corregido
- **Code Quality:** Eliminado bloque duplicado de `saveData` en `backend/src/api.gs`. El bloque sin control de versiones (líneas 43-48) era inalcanzable ya que el bloque con versionado (líneas 118-148) siempre se ejecutaba primero.
- **Code Quality:** Estandarizado campo `permisos` con función helper `normalizePermisos()`. Actualizadas funciones `getPermiso()` y `getUserPermisos()` para usar la nueva función.
- **Code Quality:** Implementado rate limiting para login (5 intentos/minuto) usando CacheService.
- **Code Quality:** Optimizado búsquedas O(n) con caché. Agregadas funciones `getCached()`, `invalidateCache()`. Actualizadas funciones `getUserByUsername()`, `getUserById()`, `getPerfilById()` para usar caché con TTL de 5 minutos.

## 2026-03-24

### Modificado

**Archivos:** `docs/architecture/Diagramas_Procesos.md`, `docs/modules/Admin_Registros.md`, `docs/modules/Admin_Sistema.md`, `docs/modules/Admin_Usuarios.md`, `docs/modules/Reuniones_Programa.md`

**Descripción:** **Reorganización de Diagramas y Terminología**

-   **Diagramas por Módulo:** Los diagramas de flujo fueron movidos de `Diagramas_Procesos.md` a la documentación de sus módulos correspondientes para mejor mantenibilidad.
-   **Diagrama de Ciclo Mensual:** Actualizado para incluir notificación al Superintendente de Servicio al inicio de la fase de recolección, días marcados como "(referencial)", y cambio de "resumen visual" a "formularios para Sucursal".
-   **Terminología:** Renombrado "Cuenta Corriente de Publicadores" → "Movimientos de Publicadores" en reportes y documentación.

---

### Modificado

**Archivos:** `docs/architecture/Guia_Documentacion.md`, `docs/modules/Admin_Registros.md`, `docs/modules/Administracion.md`

**Descripción:** **Navegación con Nombre Corto y Título de Página**

-   **Estructura de Navegación:** Agregados campos `menu` (nombre corto para barra lateral) y `titulo` (nombre largo para encabezado de página) a la especificación de navegación.
-   **Pestaña Congregación:** Agregada nueva pestaña "Congregación" a la página de Informes de predicación, disponible solo para perfil secretary (admin), con funcionalidades para ver/cargar informes de todos los publicadores.
-   **Terminología:** Renombrado "Cierres_Informes" → "Cierres_Mensuales" en toda la documentación.
-   **Menús Actualizados:** Registros (antes Registros de publicador), Informes (antes Informes de predicación), Cierre (antes Cierre mensual), Asistencia (antes Asistencia).
-   **Tres Pestañas en Cierre Mensual:** Agregadas pestañas "Estado" (dashboard de cumplimiento), "Cierre" (generar cierre mensual) y "Visita SC" (documentación para visita del Superintendente de Circuito).
-   **Terminología:** Reemplazado "censo" por "listado de personas" o "listado de publicadores" según corresponda.

---

## 2026-03-20

### Agregado

**Archivos:** `docs/architecture/Diagramas_Procesos.md`, `docs/modules/Admin_Registros.md`

**Descripción:** **Visualización de Procesos y Contabilidad Administrativa**
-   **Diagramas Mermaid:** Creación de una biblioteca de flujos visuales para el Setup Wizard, el Handshake de Seguridad y el Ciclo Mensual de Informes.
-   **Bitácora de Novedades:** Implementación de la tabla `Novedades` como una cuenta corriente universal para registrar altas/bajas de publicadores y hitos administrativos (Visita SC, Cierres).
-   **Gestión de Cumplimiento:** Dashboard para el Secretario con monitoreo de carga por grupo, recordatorios de cierre y plantillas de reclamo vía WhatsApp.
-   **Automatización de Tardíos:** Lógica basada en timestamps (`_ts`) para identificar e incluir informes retrasados en el cierre mensual.

---

### Modificado

**Archivos:** `docs/architecture/Backend_Alternatives.md`

**Descripción:** **Análisis de Backends Alternativos**

Se documentó un análisis exhaustivo de alternativas al backend actual (Google Apps Script + Google Sheets):

| Backend Analizado | Tipo | Costo | Zero-Knowledge | Auto-alojable | GPL Compatible |
|-------------------|------|-------|----------------|---------------|----------------|
| **Google Sheets** (actual) | Spreadsheet | $0 | ❌ No | ❌ No | ✅ Sí |
| **SQLite** | SQL (embebido) | $0 | ✅ Sí | ✅ Sí | ✅ Sí |
| **PostgreSQL** | SQL (servidor) | $0-300/año | ✅ Sí | ✅ Sí | ✅ Sí |
| **MongoDB** | NoSQL | $0-240/año | ✅ Sí | ✅ Sí | ⚠️ Parcial |
| **Firebase** | NoSQL (BaaS) | $0-500/año | ❌ No | ❌ No | ⚠️ Parcial |
| **Supabase** | PostgreSQL (BaaS) | $0-300/año | ✅ Sí | ✅ Sí | ✅ Sí |
| **Archivos JSON** | Archivos | $0 | ✅ Sí | ✅ Sí | ✅ Sí |
| **IPFS + P2P** | Distribuido | $0-120/año | ✅ Sí | ✅ Sí | ✅ Sí |

**Recomendación Estratégica:**

1. **Nivel 1 (Gratis):** Google Sheets - implementación actual
2. **Nivel 2 (Auto-alojado):** SQLite + sync opcional - Zero-Knowledge, offline
3. **Nivel 3 (Enterprise):** PostgreSQL/Supabase - multi-congregación, características avanzadas

**Arquitectura Híbrida Recomendada:**
- Capa de abstracción `DataService` para soportar múltiples backends
- Exportación/importación en JSON estándar para portabilidad
- Estrategia de backup 3-2-1 (3 copias, 2 medios, 1 fuera del sitio)

**Marco de Decisiones:**
- <50 publicadores → GSheets o SQLite
- 50-200 publicadores → SQLite o Supabase
- >200 publicadores → PostgreSQL
- Zero-Knowledge requerido → SQLite, PostgreSQL, Supabase, JSON, IPFS
- Offline requerido → SQLite, JSON Files
- Multi-usuario → PostgreSQL, Supabase, Firebase

**Impacto:**
- Evita vendor lock-in (portabilidad entre backends)
- Permite migración gradual según crecimiento
- Mantiene compatibilidad con GPL v3
- Proporciona opciones para diferentes necesidades técnicas y presupuestarias

---

### Agregado

**Archivos:** `docs/modules/Admin_Sistema.md` (v1.1.0)

**Descripción:** **Importación de Datos Asistida por IA integrada en Admin_Sistema**

Se integró la herramienta de importación de datos asistida por IA como parte del módulo `Admin_Sistema` (en lugar de ser un módulo separado):

| Archivo | Propósito |
|---------|-----------|
| `docs/modules/Admin_Sistema.md` | Especificación completa con importación IA |

**Características Clave:**

1. **Flujo de 5 Pasos:**
   - Exportar datos (CSV/Excel/JSON)
   - Generar query con IA (ChatGPT/Claude)
   - Probar transformación (preview de 5 registros)
   - Importar datos (batches de 50)
   - Registrar importación (auditoría)

2. **Prompt Template para IA:**
   - Template predefinido incluido en documentación
   - Usuario copia/pega en ChatGPT/Claude
   - IA genera query JSONata de transformación
   - Query es reusable para futuras importaciones

3. **Transformaciones JSONata Comunes:**
   - Conversión de fechas (DD/MM/YYYY → YYYY-MM-DD)
   - Mapeo de género (Male/Female → H/M)
   - IDs auto-generados ($random())
   - Teléfonos múltiples a array

4. **Tabla Sistema_Migraciones:**
   - Auditoría completa de importaciones
   - Incluye query JSONata usado
   - Incluye errores detallados
   - Registros inmutables

5. **Validación en Dos Capas:**
   - Frontend: Preview + sintaxis JSONata
   - Backend (GAS): Campos requeridos, emails, fechas, IDs duplicados

6. **Límites de Importación:**
   - Batch size: 50 registros (evita timeout de 6 min)
   - Preview: 5 registros
   - Archivo máximo: 1000 registros (sugerir dividir)
   - Timeout: 5 minutos

**Manifiesto Actualizado:**
```json
{
  "nombre": "Importar datos",
  "icono": "shield_lock",
  "ruta": "/importacion",
  "publico": false
}
```

**Componente UI:** `JsonataImporter`
- Stepper de 4 pasos (Exportar → Generar → Probar → Importar)
- Prompt template copiable al portapapeles
- Links a IA (ChatGPT, Claude, JSONata Tester)
- Progress bar (0-100%)
- Reporte de errores detallado

**Escenarios de Uso Documentados:**
1. Importar 50 Personas desde CSV (caso común)
2. Migración Masiva desde Excel (500+ registros)
3. Importación Recurrente (reusar query mensual)

**Impacto:**
- Importación transversal (sirve para cualquier tabla)
- Sin código backend adicional (solo JSONata + UI)
- Query reusable (una vez generado, sirve para futuras importaciones)
- Auditado (todo en Sistema_Migraciones)
- Flexible (IA se adapta a cualquier formato de origen)

---

### Agregado (Previo)

**Archivos:** `docs/architecture/Migraciones.md` (v1.1.0), `scripts/migrations/README.md` (v1.1.0)

**Descripción:** **Estrategia de Migración de Esquemas (GAS-compatible)**

Se documentó formalmente la estrategia para evolucionar los esquemas de datos **utilizando exclusivamente Google Apps Script** (sitio estático sin Node.js):

| Archivo | Propósito |
|---------|-----------|
| `docs/architecture/Migraciones.md` | Estrategia completa de migraciones en GAS |
| `scripts/migrations/README.md` | Guía de uso con funciones GAS |

**Corrección Importante:** La versión inicial (1.0.0) asumía incorrectamente una arquitectura Node.js. La versión 1.1.0 corrige esto para usar **exclusivamente GAS**.

**Conceptos Clave:**

1. **Arquitectura Real:**
   - Frontend: React estático (GitHub Pages)
   - Backend: Google Apps Script
   - Datos: Google Sheets
   - **Sin Node.js** para migraciones

2. **Cambios Backward-Compatible (SAFE):**
   - Agregar campos opcionales o con default
   - Acción: `initSheet` con `preserveExisting: true` vía API
   - Datos se migran gradualmente (lazy migration)

3. **Cambios No Compatibles (BREAKING):**
   - Eliminar/renombrar campos, cambiar tipos
   - Requiere función de migración en `api.gs`
   - Ejecución vía GAS Console o API POST
   - Registro en `Sistema_Migraciones`

4. **Ejecución de Migraciones:**
   - **Opción 1:** Manual desde GAS Console (RECOMENDADA)
   - **Opción 2:** API POST endpoint
   - **Opción 3:** Time-driven trigger

5. **Backup Manual:**
   - GSheet → File → Download → .xlsx
   - **Obligatorio** antes de migraciones breaking

6. **Reglas de Oro (10 reglas):**
   - M-01 a M-08: Mismas que antes
   - M-09: Respetar límites de GAS (6 min, batch writes)
   - M-10: Usar `Utilities.sleep()` para rate limiting

**Funciones GAS Incluidas:**
```javascript
migrate001_addBirthdateToPersonas()  // Ejemplo de migración
rollback001_addBirthdateToPersonas() // Rollback
registerMigration()                  // Registro en Sistema_Migraciones
getSheetData()                       // Utilidad
findRowById()                        // Utilidad
```

**Comandos (Reemplazo de npm):**
| Antes (Node.js - INCORRECTO) | Ahora (GAS - CORRECTO) |
|------------------------------|------------------------|
| `npm run migrate -- [id]` | GAS Console → Run |
| `npm run migrate:rollback -- [id]` | Ejecutar rollbackXXX() |
| `npm run migration:status` | Ver hoja Sistema_Migraciones |
| `npm run backup:staging` | File → Download → .xlsx |

**Impacto:**
- Documentación ahora refleja arquitectura real (static + GAS)
- Migraciones ejecutables sin Node.js
- Backup manual documentado correctamente
- Límites de GAS considerados (6 min, batches)

---

### Agregado

**Archivos:** `docs/architecture/Instalacion.md`, `docs/modules/Reuniones_Programa.md`, `docs/architecture/Tecnologia.md`, `docs/architecture/Backend.md`

**Descripción:** **Semántica Oficial y Filtros Semánticos (S-38-S)**
- **Seed Data Oficial:** Inyección inicial de etiquetas inteligentes basadas en las pautas oficiales S-38-S (`$Varones`, `$Estudiantes`, `$HermanosCapacitados`, `$CandidatosLectura`).
- **Intersección de Filtros:** Las plantillas de reuniones ahora soportan un array de `filters` permitiendo realizar intersecciones semánticas (AND) dinámicas entre etiquetas físicas y virtuales.
- **Validación de Unicidad de Alias:** Mecanismo para garantizar que cada `alias_variable` sea único y no colisione con palabras reservadas del motor JSONata.

---

**Archivos:** `docs/architecture/Interfaz.md`, `docs/architecture/Arquitectura.md`

**Descripción:** **Dashboard Inteligente y Landing Pages**
- **Sistema de Widgets:** API de manifiesto para que los plugins inyecten resúmenes (Próximas Partes, Salidas) en la página de inicio.
- **Landing Pages de Nivel 1:** Las secciones principales (Reuniones, Predicación) ahora actúan como Hubs de navegación con widgets especializados.

---

### Agregado (Previo)

**Archivos:** `/system/orchestration.md` (v4.1.0), `/system/rules.md` (Category 8)

**Descripción:** **Operational Optimizations (v4.1.0)**

Se agregaron optimizaciones operacionales al sistema multi-agente para mejorar eficiencia y rendimiento:

| Archivo | Versión | Optimizaciones |
|---------|---------|----------------|
| `system/orchestration.md` | 4.1.0 | 5 optimizaciones operacionales |
| `system/rules.md` | 2.1.0 | Category 8: Operational Optimization Rules |

---

### Modificado

**Archivos:** `system/execution.md`, `system/rules.md`, `examples/README.md`, `backend/src/api.gs`, `system/QUICKREF.md`, `system/error-handling.md`, `system/orchestration.md`, `system/agents/reviewer.md`

**Descripción:** **System Patches Round 1 & 2 + Version Consistency**

Se aplicaron parches quirúrgicos para corregir inconsistencias críticas encontradas en la evaluación de readiness:

### Patch Round 1 — Critical Fixes

| Patch | Archivo | Problema Corregido |
|-------|---------|-------------------|
| 1 | `system/prompt.md` | Versión duplicada (3.0.0 arriba, 2.0.0 abajo) → unificado a 3.0.0 |
| 2a | `system/orchestration.md` | Tabla de compatibilidad requería v4.0.0 (no existe) → corregido a v3.0.0+ |
| 2b | `system/orchestration.md` | Caracteres chinos corruptos en regla S-01 → corregido a inglés |
| 2c | `system/orchestration.md` | Sin guía para ejecución single-model → agregadas ~40 líneas de protocolo |
| 3a | `system/rules.md` | SEC-13 test no ejecutable → agregado patrón grep manual |
| 3b | `system/rules.md` | ARC-15 test no ejecutable → agregado comando grep verificable |
| 3c | `system/rules.md` | COD-13 test no ejecutable → agregada regla ESLint |
| 4a | `system/error-handling.md` | 3 conflictos de spec sin resolver → agregadas decisiones autoritativas (CONFLICT-01/02/03) |
| 4b | `system/error-handling.md` | Sin guía para backend gaps → agregado protocolo de 4 pasos con stubs |
| 5a | `examples/README.md` | Ejemplo 02 era stub → agregado manifest + checklist |
| 5b | `examples/README.md` | Ejemplo 03 era stub → agregado código working + test + validación |

### Patch Round 2 — Structural Fixes

| Patch | Archivo | Problema Corregido |
|-------|---------|-------------------|
| 1 | `system/execution.md` | L3 checklist tenía 9 items (falta CORS) → ahora 10 items (L3-01 a L3-10) |
| 2 | `system/rules.md` | Índice declaraba 91 reglas pero Category 8 tiene 18 más → ahora muestra subtotal + grand total (109) con nota explicativa |
| 3a | `examples/README.md` | PersonaCard accede a `enc_` fields sin caveat de vista autenticada → agregado comentario de seguridad SEC-01 |
| 3b | `examples/README.md` | Validación decía "enc_ fields not exposed" (engañoso) → especificado contexto de DataService decryption |
| 4 | `backend/src/api.gs` | XXTEA viola SEC-03 sin exemption → marcado como STUB con nota para Reviewer agents |
| 5a | `examples/README.md` | `multi-agent-example.md` no listado en índice → agregado a tabla |
| 5b | `system/QUICKREF.md` | `multi-agent-example.md` no listado → agregado a tabla de ejemplos |

### Version Consistency Fixes

| Archivo | Header | Footer (Before) | Footer (After) | Status |
|---------|--------|-----------------|----------------|--------|
| `error-handling.md` | 2.0.0 | 1.0.0 ❌ | 2.0.0 ✅ | Fixed |
| `orchestration.md` | 4.1.0 | 4.0.0 ❌ | 4.1.0 ✅ | Fixed |
| `reviewer.md` | 4.0.0 | 3.0.0 ❌ | 4.0.0 ✅ | Fixed |

**Impacto:**
- **L3 Security Checklist:** Ahora incluye CORS check (L3-06); previene fallos silenciosos en revisiones de seguridad
- **Rule Count:** Ahora documentado correctamente (91 blocker + 18 operational = 109 total)
- **XXTEA Blocker:** Reviewer agents ahora saben que es un known gap, no bloquean entrega de tareas frontend
- **Single-Model Guidance:** Agentes ejecutando todos los roles en una sesión ahora tienen protocolo de role-switching
- **Pre-Resolved Conflicts:** 3 conflictos de spec (Session Role, MK Wrapping, WebAuthn) resueltos upfront
- **Examples Discoverability:** multi-agent-example.md ahora listada en índices

**Líneas cambiadas:** ~150 líneas agregadas, ~30 líneas modificadas

---

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
| 2026-03-20 | 4.1.2 | Importación IA integrada en Admin_Sistema |
| 2026-03-20 | 4.1.1 | System Patches Round 1 & 2 + Version Consistency |
| 2026-03-20 | 4.1.0 | Operational Optimizations (cost-awareness, convergence, determinism) |
| 2026-03-20 | 4.0.0 | Multi-Agent Orchestration - Production Complete |
| 2026-03-20 | 3.0.0 | Multi-Agent Orchestration System |
| 2026-03-20 | 2.0.0 | AI Agent System Hardened + Asistencia feature |
| 2026-03-19 | 1.1.0 | Blindaje técnico y módulos completos |
| 2026-03-XX | 1.0.0 | Documentación inicial de arquitectura y módulos |

---

*Última actualización: 2026-03-20*
