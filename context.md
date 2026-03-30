# Congre-Admin — Technical Context Transfer Document

**Generated:** 2026-03-30 | **Author:** Senior Solutions Architect Analysis

---

## 1. Project Vision & Current Status

**Congre-Admin** is a modular congregation management system designed for Jehovah's Witnesses congregations. It implements a **Zero-Knowledge** architecture with **AES-GCM** encryption, ensuring that the backend (Google Apps Script) never accesses plaintext data.

**Architecture Pattern:** Core + Plug-ins (Micro-frontend ready). A central Core shell provides authentication, encryption, navigation, and a data bus. Independent plug-in modules (Reuniones, Predicación, Personas, etc.) are dynamically loaded into the shell.

**Two-App Architecture:** The frontend is split into two separate applications:
- **Public App (`/`):** Read-only public site. Consumes a dedicated GSheet via `/gviz/tq` (no GAS, no auth). Only needs `PUBLIC_SS_ID`.
- **Admin App (`/admin`):** Full management panel. Requires login, GAS API URL, and `CORE_SS_ID`. Supports RBAC, CRUD, encryption, and all modules.

**Data Strategy:** Physical data segmentation across multiple Google Sheets (GSheets) based on privacy level. During installation (`actionInstall`), two spreadsheets are created in parallel:
- **GSheet Core (`CORE_SS_ID`):** Users, Profiles, Plugins registry, Configuration (orchestrator). Used exclusively by the Admin app.
- **GSheet Public (`PUBLIC_SS_ID`):** Published data for guest/unauthenticated access (consumed via `/gviz/tq`). A read-only mirror synced from operational GSheets. Used exclusively by the Public app.
- **GSheet Personas:** Census data (high privacy, admin-only).
- **GSheets Operativos:** One per plug-in module.

> The two ssIds are distinct and stored separately: `CORE_SS_ID` in `localStorage: congre_admin_ss_id` (admin) and `PUBLIC_SS_ID` in `localStorage: congre_public_ss_id` (public). The `PUBLIC_SS_ID` is also persisted in the Core's `Configuracion` table (key: `ss_publico`).

**Current Development Stage:**

| Component | Status | Notes |
|-----------|--------|-------|
| AI Agent Specification (`/system/`) | ✅ Complete | Production-ready multi-agent system |
| Documentation (`/docs/`) | ✅ ~95% | 21 module specs, 18 architecture docs |
| Backend (`backend/src/api.gs`) | ✅ Phase 1 Complete | Auth, Sessions, RBAC, CRUD, Versioning, Installation (3293 líneas) |
| Frontend Core (`frontend/`) | ✅ Phase 0 Complete | Vite scaffold, Auth, Shell UI, Setup Wizard, Dashboard |
| Frontend Modules | 🟡 Pending | Only `setup` and `dashboard` implemented |
| Services Layer | ❌ Empty | `frontend/src/services/` — no adapters yet |
| Types Layer | ❌ Empty | `frontend/src/types/` — no type definitions yet |

---

## 2. Tech Stack & Dependencies

### Frontend (`frontend/package.json`)

| Category | Library | Version | Purpose |
|----------|---------|---------|---------|
| **Core** | React | ^19.0.0 | UI framework |
| **Core** | react-dom | ^19.0.0 | DOM rendering |
| **Core** | TypeScript | ^5.5.3 | Type safety (strict mode) |
| **Build** | Vite | ^6.0.1 | Build tool & dev server |
| **Routing** | react-router-dom | ^6.26.0 | Client-side routing |
| **UI** | @mui/material | ^6.1.0 | Material Design 3 components |
| **UI** | @mui/icons-material | ^6.1.0 | Material icons |
| **UI** | @emotion/react | ^11.13.0 | CSS-in-JS (MUI dependency) |
| **UI** | @emotion/styled | ^11.13.0 | Styled components (MUI dependency) |
| **UI** | framer-motion | ^11.3.0 | Animations & transitions |
| **UI** | lucide-react | ^0.417.0 | Complementary icon set |
| **Data** | @tanstack/react-query | ^5.51.0 | Server state management & cache |
| **Data** | @tanstack/react-table | ^8.20.0 | Advanced data tables |
| **Data** | @tanstack/query-persist-client-core | ^5.51.0 | Offline persistence |
| **Data** | @tanstack/query-sync-storage-persister | ^5.51.0 | IndexedDB integration |
| **Data** | jsonata | ^2.0.0 | Query & transformation engine |
| **Data** | zod | ^3.23.0 | Schema validation |
| **Storage** | idb-keyval | ^6.2.1 | IndexedDB utility |
| **Crypto** | jose | ^5.6.0 | JWT/JWE handling (passkey support) |
| **Files** | pdf-lib | ^1.17.1 | PDF generation & overlay |
| **CSS** | tailwindcss | ^4.0.0 | Utility-first CSS |
| **CSS** | @tailwindcss/postcss | ^4.2.2 | PostCSS plugin |
| **CSS** | autoprefixer | ^10.4.20 | CSS vendor prefixes |
| **Deploy** | gh-pages | ^6.3.0 | GitHub Pages deployment |

### Backend (Google Apps Script)

- **Runtime:** Google Apps Script (V8 engine)
- **Database:** Google Sheets (multiple Spreadsheet IDs)
- **Cache:** `CacheService` (TTL: data=10min, lookups=5min)
- **Storage:** `PropertiesService` (sessions, config)
- **Email:** `MailApp` (OTP delivery)
- **Crypto:** Backend is zero-knowledge — only stores `wrapped_mk` (ciphertext)

### TypeScript Configuration

```json
{
  "target": "ES2020",
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "jsx": "react-jsx",
  "paths": { "@/*": ["./src/*"] }
}
```

---

## 3. Architecture & Data Logic

### Architectural Pattern: **Core + Plug-ins (Micro-frontend Ready)**

```
┌─────────────────────────────────────────────┐
│                 CORE SYSTEM                  │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Shell UI│ │  Auth &  │ │ DataService  │  │
│  │ (React) │ │  Crypto  │ │  (Agnostic)  │  │
│  └─────────┘ └──────────┘ └──────────────┘  │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Theme  │ │  JSONata │ │  Storage     │  │
│  │  M3/Dark│ │  Engine  │ │  Adapters    │  │
│  └─────────┘ └──────────┘ └──────────────┘  │
├─────────────────────────────────────────────┤
│              PLUGIN INTERFACE                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │Personas  │ │Reuniones │ │Predicac. │    │
│  │Manifest  │ │Manifest  │ │Manifest  │    │
│  │Views     │ │Views     │ │Views     │    │
│  │Schema    │ │Schema    │ │Schema    │    │
│  └──────────┘ └──────────┘ └──────────┘    │
└─────────────────────────────────────────────┘
         │              │              │
    ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
    │GSheet   │   │GSheet   │   │GSheet   │
    │Personas │   │Reunione.│   │Predicac.│
    │(Vault)  │   │(Ops)    │   │(Ops)    │
    └─────────┘   └─────────┘   └─────────┘
```

### Key Design Decisions

1. **Zero-Knowledge (AES-GCM):** All sensitive data encrypted client-side before transmission. Backend only stores ciphertext.
   - **Algorithm:** AES-GCM 256-bit via Web Crypto API
   - **KDF:** PBKDF2-HMAC-SHA256, 600,000 iterations (OWASP recommendation)
   - **Key Wrapping:** Master Key (MK) generated locally, encrypted with password-derived Wrapping Key, stored as `wrapped_mk`
   - **IV Format:** 12 bytes per field, stored as hex prefix: `iv:ciphertext`

2. **Google Sheets as DB:** Chosen for zero-cost, GPL compatibility, and no server management. Physical segmentation across multiple Spreadsheet IDs for privacy isolation.

3. **JSONata over SQL:** Universal query engine for validation, filtering, sanitization, and reporting. Runs on both frontend (immediate feedback) and backend (integrity).

4. **RBAC with Dynamic Profiles:** Profiles stored in GSheet Core. 6 base profiles (Admin, Secretario, Comité, Superintendente, Siervo Territorios, Publicador). CRUD operations supported. Permission format: `R`, `W`, `RW` per module.

5. **Session Management:** Token-based (UUID pairs), stored in `PropertiesService`, 24h TTL with auto-renewal when <1h remaining. Hybrid index (`_sessionIndex`) in memory + CacheService for O(1) validation.

6. **Soft Delete:** All records have `_deleted` boolean. `deleteData` marks as deleted by default. `hardDelete` requires explicit action. Auto-filtering in `getSheetData()`.

7. **Version Control:** Every record has `_v` (incremental) and `_ts` (ISO 8601). Last Write Wins with conflict detection via `expectedVersion` parameter.

### Database Schema (GSheet Core Tables)

**Usuarios:**
```
id | username | email | wrapped_mk | perfilId | auth_config (JSON) | metadata (JSON) | created_at | _v | _ts | _deleted
```
> Nota: `auth_config` consolidada toda la config de auth (password_hash, TOTP, passkeys, email_otp). `metadata` almacena last_login, failed_login_attempts, etc. Campos como `personaId`, `auth_factor`, `totp_secret`, `public_key` fueron reemplazados por estas estructuras JSON.

**Perfiles:**
```
id | nombre | permisos (JSON) | descripcion | _v | _ts | _deleted
```

**Registro_Plugins:**
```
plugin_id | ssId | status | config (JSON) | _v | _ts | _deleted
```

**Configuracion:**
```
clave | valor | is_public | _v | _ts | _deleted
```

**Sistema_Migraciones:**
```
id | nombre | version | ejecutada_en | estado | error | _v | _ts
```

---

## 4. Implemented Features

### Backend (100% Complete — Phase 1)

| Feature | Functions | Status |
|---------|-----------|--------|
| Auth: Zero-Knowledge Login | `actionLogin()`, `actionRegister()`, `actionChallenge()`, `actionRequestOTP()` | ✅ |
| Auth: TOTP Support | `verifyTOTP()`, `generateTOTP()`, `generateBase32Secret()` (nativo GAS HMAC-SHA1) | ✅ |
| Auth: Email OTP | `sendOTPEmail()`, `verifyEmailOTP()` | ✅ |
| Session Management | `generateSessionToken()`, `validateSession()`, `refreshSessionToken()`, `invalidateSession()`, `getActiveSessions()`, `invalidateAllSessions()` | ✅ |
| RBAC Permissions | `getPermiso()`, `validarPermiso()`, `checkPermission()`, `getUserPermisos()` | ✅ |
| Profile CRUD | `actionCreateProfile()`, `actionUpdateProfile()`, `actionDeleteProfile()` | ✅ |
| Data Versioning | `_v`, `_ts`, `ERR_VERSION_CONFLICT` detection in `saveData()` | ✅ |
| Soft Delete | `softDeleteRow()`, `restoreRow()`, `getVersionHistory()` | ✅ |
| CRUD Operations | `getData`, `batchGetData`, `saveData`, `deleteData`, `hardDelete`, `initSheet`, `clearSheet`, `deleteSheet` | ✅ |
| Installation | `actionInstall()`, `createSpreadsheet()`, `initCoreTables()`, `seedPerfiles()`, `seedConfiguracion()` | ✅ |
| Caching | `getCached()`, `invalidateCache()`, `getCachedSheetData()`, hybrid session index | ✅ |
| Rate Limiting | `checkRateLimit()` (5 attempts/min on login) | ✅ |
| Audit Logging | `logAccess()` | ✅ |

### Frontend (Phase 0 Complete)

| Feature | File | Status |
|---------|------|--------|
| Project Scaffold | `vite.config.ts`, `tsconfig.json`, `package.json` | ✅ |
| Entry Point | `main.tsx` (React 19 + BrowserRouter + ThemeProvider) | ✅ |
| Routing | `main.tsx` + `admin/AdminApp.tsx` (ProtectedRoute, /admin/setup, /admin/login, /admin/) | ✅ |
| Auth Context | `admin/core/context/AuthContext.tsx` (login, logout, validateSession, setSession, masterKey) | ✅ |
| Shell Layout | `core/shell/Shell.tsx` (Sidebar + Navbar + Outlet) | ✅ |
| Sidebar Navigation | `core/components/Layout/Sidebar.tsx` (5 menu items, mobile drawer) | ✅ |
| Navbar | `core/components/Layout/Navbar.tsx` (user menu, dark mode toggle, notifications badge) | ✅ |
| MUI Theme | `core/theme/theme.ts` (light + dark palettes, M3 styling) | ✅ |
| Crypto Utils | `core/crypto/cryptoUtils.ts` (AES-GCM, PBKDF2, key wrapping/unwrapping) | ✅ |
| Setup Wizard | `modules/setup/views/SetupWizard.tsx` (4-step installation) | ✅ |
| Login | `modules/setup/views/Login.tsx` (2-step: credentials → OTP) | ✅ |
| Dashboard | `modules/dashboard/views/Dashboard.tsx` (stat cards, placeholder widgets) | ✅ |
| CI/CD | `.github/workflows/deploy.yml` (GitHub Pages) | ✅ |
| Seed Data | `public/data/seed_perfiles.json` (6 base profiles) | ✅ |

---

## 5. Pending Backlog & Roadmap

### Immediate Next Steps (Phase 2: Admin Module)

| Priority | Task | Dependencies |
|----------|------|--------------|
| **P0** | Create `frontend/src/services/` — DataService adapter for GAS API | Backend ✅ |
| **P0** | Create `frontend/src/types/` — TypeScript interfaces for all entities | — |
| **P0** | Admin_Personas module: list, filter, edit drawer, export | DataService |
| **P1** | Admin_Registros module: publishers, reports, monthly closure | Admin_Personas |
| **P1** | Admin_Usuarios module: user management, permission matrix | DataService |
| **P1** | Integrate TanStack Query with DataService (staleTime, offline persistence) | DataService |
| **P2** | Admin_Anuncios module: billboard, announcement CRUD | DataService |
| **P2** | Admin_Sistema module: plugin config, settings, AI-assisted import | DataService |

### Phase 3+ (Modules)

| Module | Description |
|--------|-------------|
| Reuniones_Programa | Weekly meeting program builder with auto-suggestions |
| Predicacion_Territorios | Territory management with GeoJSON maps |
| Predicacion_Asignaciones | Territory assignment workflow |
| Reuniones_Discursos | Public talk schedule & speaker management |

### Technical Debt & Known Gaps

| Issue | Location | Severity | Notes |
|-------|----------|----------|-------|
| CRUD sin RBAC | `api.gs:70-160` | **HIGH** | Acciones deleteData/hardDelete/restoreData/saveData/initSheet/clearSheet/deleteSheet no verifican sesión ni permisos |
| deleteAccount bug | `api.gs:2185` | **HIGH** | Llama `deleteData()` como función directa pero solo existe como acción en doPost; fallaría en runtime |
| No DataService layer | `frontend/src/services/` | **HIGH** | Empty directory. No API adapter exists yet |
| No TypeScript types | `frontend/src/types/` | **HIGH** | Empty directory. No entity interfaces defined |
| TanStack Query not wired | `main.tsx` | **MEDIUM** | QueryClientProvider solo existe en `admin/entry.tsx` (archivo huérfano no usado). Main.tsx no lo incluye |
| admin/entry.tsx huérfano | `admin/entry.tsx` | **MEDIUM** | No referenciado por ningún HTML. Usa `useAuth()` sin importar (no compilaría) |
| Directorios core/ duplicados | `src/core/` vs `src/admin/core/` | **MEDIUM** | Estructura legacy `src/core/` existe con archivos similares pero no idénticos. Solo `admin/core/` está activo |
| generateTOTP() duplicado | `api.gs:2536,2572` | **LOW** | Segunda definición sobreescribe primera; funciona pero es code smell |
| invalidateCache() no-op | `api.gs:2749` | **LOW** | Solo hace Logger.log(); GAS no soporta invalidación por patrón. Cache vive por TTL |
| Dark mode not persistent | `Navbar.tsx` | **LOW** | Toggle agrega clase CSS pero no cambia MUI ThemeProvider. MUI siempre renderiza tema light |
| No i18n implementation | `core/locales/` | **LOW** | Directory doesn't exist. All strings hardcoded in Spanish |
| No PWA/Service Worker | — | **LOW** | Specified in docs but not implemented |
| Tabla Etiquetas no implementada | `Backend.md` define, `api.gs` no tiene | **LOW** | Definida en schema pero no se crea en initCoreTables() |
| `pendiente.md` items | Root | **MEDIUM** | Attendance reports, SC summaries |

### Critical Path for Next Agent

1. **Define TypeScript types** for all entities (Usuario, Perfil, Persona, Plugin, Configuracion, etc.)
2. **Build DataService adapter** — abstract fetch calls to GAS backend with proper error handling
3. **Wire TanStack Query** — create hooks for each entity using DataService
4. **Build Admin_Personas** — first real CRUD module with DataTable, filters, encrypted fields

---

## 6. Coding Conventions

### File Structure

```
frontend/src/
├── admin/                     # Admin app (primary)
│   ├── AdminApp.tsx           # Routing (ProtectedRoute, AuthRoute)
│   ├── core/                  # Engine (never imports from modules/)
│   │   ├── context/           # React Contexts (AuthContext)
│   │   ├── crypto/            # AES-GCM utilities
│   │   ├── shell/             # Main layout (Shell.tsx)
│   │   ├── theme/             # MUI themes
│   │   └── components/        # Shared UI (Layout/Sidebar, Navbar)
│   └── modules/               # Plugins (can import from @core/*)
│       ├── setup/views/       # SetupWizard, Login, SetupTOTP, SetupPasskey
│       ├── dashboard/views/   # Dashboard
│       ├── settings/views/    # AuthSettings
│       └── admin/views/       # BackupExport
├── core/                      # LEGACY — duplicado de admin/core/ (no usado activamente)
├── public/                    # Public app (guest access)
├── services/                  # API adapters (PENDING — vacío)
└── types/                     # TypeScript interfaces (PENDING — vacío)
```

### Naming Conventions

- **Files:** PascalCase for components (`SetupWizard.tsx`), camelCase for utilities (`cryptoUtils.ts`)
- **Components:** PascalCase (`StatCard`, `ProtectedRoute`)
- **Functions:** camelCase (`getUserByUsername`, `validateSession`)
- **Constants:** UPPER_SNAKE_CASE (`SESSION_TTL`, `CACHE_TTL_DATA`)
- **Database tables:** PascalCase with underscores (`Registro_Plugins`, `Sistema_Migraciones`)
- **Encrypted fields:** Prefix `enc_` (`enc_servicio`, `enc_contacto`)
- **Technical fields:** Prefix `_` (`_v`, `_ts`, `_deleted`)

### Error Handling

- **Backend errors:** Prefixed with `ERR_` code (`ERR_AUTH_INVALID`, `ERR_VERSION_CONFLICT`, `ERR_RATE_LIMITED`, `ERR_PERMISSION_DENIED`, `ERR_USER_EXISTS`, `ERR_PROFILE_IN_USE`)
- **Response format:** `{ success: boolean, error?: string, ...data }`
- **Frontend:** Try/catch with user-facing `<Alert>` component. Error state managed per-component.

### Import Rules

- Modules **can** import from `@core/*` (path alias: `@/core/...`)
- Core **never** statically imports from `@modules/*` (must use dynamic `React.lazy()`)
- No global CSS in modules — use Tailwind utilities or CSS Modules

### Git Workflow

- Repository: `congre-admin/congre-admin` (source), `congre-admin/congre-admin.github.io` (deployed)
- CI/CD: GitHub Actions on `push` to `main` → builds frontend → deploys to GitHub Pages
- Build: `cd frontend && npm install --legacy-peer-deps --no-package-lock && npm run build`

### API Protocol

All backend communication is via POST to GAS URL with JSON body:
```json
{
  "action": "actionName",
  "sessionToken": "...",
  "ssId": "...",
  "payload": { ... }
}
```

The API URL is persisted in `localStorage` as `congre_admin_api_url`. The initial `ssId` is persisted as `congre_admin_ss_id`.

### Security Rules

- **Never** log or expose `wrapped_mk`, `totp_secret`, or plaintext `enc_` fields
- **Always** validate `sessionToken` before data operations (except `login`, `register`, `challenge`, `requestOTP`, `install`)
- **Always** check RBAC permissions via `checkPermission(session, action, modulo)`
- **Rate limit** authentication actions (5 attempts/min/username)
- **Sanitize** public data by stripping `enc_` prefixed fields

> **⚠️ Pendiente:** Las operaciones CRUD (`deleteData`, `hardDelete`, `restoreData`, `saveData`, `initSheet`, `clearSheet`, `deleteSheet`) NO verifican sesión ni RBAC en la implementación actual. Deben protegerse.

---

## Quick Reference: Key Files

| File | Purpose |
|------|---------|
| `backend/src/api.gs` | Complete backend (3293 lines) — GAS web app |
| `backend/data/seed_perfiles.json` | 6 base RBAC profiles |
| `frontend/src/admin/AdminApp.tsx` | Routing (setup, login, protected shell) |
| `frontend/src/main.tsx` | Entry point (providers stack) |
| `frontend/src/admin/core/context/AuthContext.tsx` | Auth state management |
| `frontend/src/admin/core/crypto/cryptoUtils.ts` | AES-GCM, PBKDF2, key wrapping |
| `frontend/src/admin/core/shell/Shell.tsx` | Main layout (Sidebar + Navbar + Outlet) |
| `frontend/src/admin/modules/setup/views/SetupWizard.tsx` | 4-step installation flow |
| `frontend/src/admin/modules/setup/views/Login.tsx` | Multi-step login (password → TOTP/email/passkey) |
| `frontend/src/admin/modules/setup/views/SetupTOTP.tsx` | TOTP QR configuration |
| `frontend/src/admin/modules/setup/views/SetupPasskey.tsx` | WebAuthn passkey registration |
| `frontend/src/admin/modules/settings/views/AuthSettings.tsx` | Auth methods management |
| `frontend/src/admin/modules/admin/views/BackupExport.tsx` | Master key backup/restore |
| `frontend/src/admin/modules/dashboard/views/Dashboard.tsx` | Home view with stat cards |
| `docs/architecture/Arquitectura.md` | Core + Plugins architecture spec |
| `docs/architecture/Backend.md` | Backend protocol specification |
| `docs/architecture/Backend_API_Completa.md` | Full API reference |
| `docs/architecture/Tecnologia.md` | Tech stack & crypto spec |
| `docs/PLAN_DESARROLLO.md` | Development roadmap |
| `docs/REGISTRO_EJECUCION.md` | Execution log |
| `.github/workflows/deploy.yml` | CI/CD pipeline |
