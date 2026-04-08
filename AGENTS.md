# Congre-Admin — AI Agent Guidelines

## Project Overview

Congre-Admin is a modular congregation management system for Jehovah's Witnesses with **Zero-Knowledge** architecture and **AES-GCM** client-side encryption.

**Architecture:** Core + Plug-ins (Micro-frontend ready)
**Frontend:** React 19 + Vite + TypeScript + MUI 6 + TanStack Query
**Backend:** Google Apps Script (api.gs) with Google Sheets as database

## Quick Status

| Component | Status | Notes |
|-----------|--------|-------|
| Backend (api.gs) | ✅ Complete | Auth, Sessions, RBAC, CRUD, Versioning |
| Frontend Core | ✅ Complete | Auth, Shell, Setup Wizard, Dashboard |
| Frontend Modules | 🟡 Pending | Only setup and dashboard implemented |
| Services Layer | ❌ Pending | `frontend/src/services/` — DataService needed |
| Types Layer | ❌ Pending | `frontend/src/types/` — TypeScript interfaces needed |

## Immediate Priorities (Phase 2)

1. **DataService adapter** — API client for GAS backend
2. **TypeScript types** — Interfaces for all entities
3. **Admin_Personas module** — First CRUD module
4. **TanStack Query integration** — Wire hooks to DataService

## Tech Stack

- **Frontend:** React 19, Vite 6, TypeScript 5, MUI 6, TanStack Query v5, TanStack Table, JSONata, Zod
- **Backend:** Google Apps Script, Google Sheets
- **Crypto:** AES-GCM 256-bit (Web Crypto API), PBKDF2-HMAC-SHA256 (600K iterations)
- **Commands:** `npm run dev`, `npm run build`, `npm run lint`, `npm run deploy`

## Key Files

| File | Purpose |
|------|---------|
| `frontend/src/admin/AdminApp.tsx` | Routing |
| `frontend/src/admin/core/context/AuthContext.tsx` | Auth state |
| `frontend/src/admin/core/crypto/cryptoUtils.ts` | AES-GCM crypto |
| `frontend/src/admin/core/shell/Shell.tsx` | Main layout |
| `backend/src/api.gs` | Complete backend |
| `docs/architecture/Tecnologia.md` | Tech spec |
| `context.md` | Full technical context |

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
