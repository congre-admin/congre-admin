# Congre-Admin — AI Agent Guidelines

## Project Overview

Modular congregation management system with **Zero-Knowledge** architecture and **AES-GCM** client-side encryption.

- **Architecture:** Core + Plug-ins (micro-frontend ready)
- **Frontend:** React 19 + Vite 6 + TypeScript + MUI 6 + TanStack Query
- **Backend:** Google Apps Script (`api.gs`) + Google Sheets

## Quick Status

| Component | Status | Notes |
|-----------|--------|-------|
| Backend (api.gs) | ✅ Complete | Auth, Sessions, RBAC, CRUD, Versioning, v2.3 security |
| Frontend Core | ✅ Complete | Shell, Auth, Setup Wizard, Dashboard, AuthSettings, BackupExport |
| Frontend Modules | 🟡 Partial | Admin_Users, Admin_Plugins, Settings (implemented); Personas, Registros, Predicacion (pending) |
| Services Layer | ✅ Complete | DataService, AuthService, PublicService, DataTransformService |
| Types Layer | ✅ Complete | Auth, User, Data, Config, Plugin types |

## Remaining Gaps (Post v2.3)

- **TanStack Query hooks**: UsePersonas, UseConfig, UseSession implemented but not wired in all components
- **First CRUD module**: Admin_Personas not implemented yet (pending Phase 2)

## Developer Commands

```bash
cd frontend
npm install --legacy-peer-deps    # Required: React 19 has peer dep issues
npm run dev                       # Start dev server
npm run build                     # Production build
npm run lint                      # ESLint
npm run deploy                    # GitHub Pages deployment
npm run clasp:push                # Push backend to GAS
npm run clasp:deploy              # Deploy GAS as web app
```

**Two-App Architecture:**
- Public app (`/`): Read-only via `/gviz/tq`, only needs `PUBLIC_SS_ID`
- Admin app (`/admin`): Full management, needs `CORE_SS_ID` + API URL

## Key Files

| File | Purpose |
|------|---------|
| `frontend/src/main.tsx` | Entry point (providers stack) |
| `frontend/src/admin/AdminApp.tsx` | Routing (ProtectedRoute, /admin/setup, /admin/login, /admin/) |
| `frontend/src/admin/core/context/AuthContext.tsx` | Auth state management |
| `frontend/src/admin/core/crypto/cryptoUtils.ts` | AES-GCM 256-bit, PBKDF2 (600K iters) |
| `frontend/src/admin/core/shell/Shell.tsx` | Main layout (Sidebar + Navbar + Outlet) |
| `backend/src/api.gs` | Complete backend (2279 lines) |
| `docs/architecture/Backend_API_Completa.md` | Full API reference |

## v2.3 Security Features

| Feature | Description |
|---------|------------|
| **Mode Public** | `mode: 'public'` filters `is_public` rows, strips `enc_*` fields |
| **Register Protection** | Requires session if users already exist |
| **Server-side Setup** | `_hasExistingUsers()` detects setup mode automatically |
| **Step-Up Auth** | `confirmAction` for 2FA on sensitive actions |

## Naming Conventions

- **Components:** PascalCase (`SetupWizard.tsx`)
- **Utilities:** camelCase (`cryptoUtils.ts`)
- **Constants:** UPPER_SNAKE_CASE
- **DB tables:** PascalCase (`Registro_Plugins`)
- **Encrypted fields:** `enc_` prefix
- **Technical fields:** `_` prefix (`_v`, `_ts`, `_deleted`)

## Error Format

Backend errors: `ERR_*` prefix (`ERR_AUTH_INVALID`, `ERR_VERSION_CONFLICT`)
Response: `{ success: boolean, error?: string, ...data }`

## Security Rules

- Never log or expose `wrapped_mk`, `totp_secret`, or plaintext `enc_` fields
- Always validate session before data operations (except auth actions)
- Always check RBAC permissions via `checkPermission()`

## Import Rules

- Modules **can** import from `@core/*`
- Core **never** imports from `@modules/*`
- Use dynamic `React.lazy()` for module loading