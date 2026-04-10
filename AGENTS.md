# Congre-Admin — AI Agent Guidelines

## Project Overview

Modular congregation management system with **Zero-Knowledge** architecture and **AES-GCM** client-side encryption.

- **Architecture:** Core + Plug-ins (micro-frontend ready)
- **Frontend:** React 19 + Vite 6 + TypeScript + MUI 6 + TanStack Query
- **Backend:** Google Apps Script (`api.gs`) + Google Sheets

## Quick Status

| Component | Status | Notes |
|-----------|--------|-------|
| Backend (api.gs) | ✅ Complete | Auth, Sessions, RBAC, CRUD, Versioning |
| Frontend Core | ✅ Complete | Shell, Auth, Setup Wizard, Dashboard |
| Frontend Modules | 🟡 Pending | Only setup and dashboard implemented |
| Services Layer | ❌ Empty | `frontend/src/services/` — DataService needed |
| Types Layer | ❌ Empty | `frontend/src/types/` — Interfaces needed |

## Critical: Known Gaps

- **CRUD without RBAC** (`api.gs:70-160`): `deleteData`/`hardDelete`/`saveData` don't validate session or permissions
- **No DataService adapter**: `frontend/src/services/` is empty
- **No TypeScript types**: `frontend/src/types/` is empty
- **TanStack Query not wired**: `QueryClientProvider` exists in orphan `admin/entry.tsx`, not used in `main.tsx`

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
| `backend/src/api.gs` | Complete backend (3293 lines) |
| `docs/architecture/Backend_API_Completa.md` | Full API reference |

## Immediate Priorities (Phase 2)

1. **DataService adapter** — API client for GAS backend
2. **TypeScript types** — Interfaces for all entities
3. **Admin_Personas module** — First CRUD module
4. **TanStack Query integration** — Wire hooks to DataService

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