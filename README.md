# Congre-Admin 🛡️

Sistema modular de gestión congregacional con arquitectura de **Conocimiento Cero** y cifrado **AES-GCM**.

## 🤖 AI Agent System

This repository includes a production-grade AI agent specification for autonomous development.

**Entry Point:** [`/system/prompt.md`](./system/prompt.md)

**Key Documents:**
- [`/system/execution.md`](./system/execution.md) - Mandatory workflow loop
- [`/system/output-spec.md`](./system/output-spec.md) - Output format contract
- [`/system/rules.md`](./system/rules.md) - Rules and constraints (MUST/MUST NOT/SHOULD)
- [`/system/acceptance.md`](./system/acceptance.md) - Validation criteria
- [`/system/error-handling.md`](./system/error-handling.md) - Ambiguity handling
- [`/examples/`](./examples/) - Worked examples

## 📂 Documentación del Sistema

Toda la especificación técnica y de diseño se encuentra en la carpeta `/docs`:
- [Índice General de Documentación](./docs/README.md)
- [Guía de Arquitectura y Tecnología](./docs/architecture/Arquitectura.md)
- [Protocolo del Backend](./docs/architecture/Backend.md)
- [Arquitectura del Núcleo](./docs/architecture/Core.md)
- [Sistema de Autenticación](./docs/architecture/Autenticacion.md)

## 🛠️ Estructura del Repositorio

- `/frontend`: Aplicación React (Vite + TypeScript + MUI)
  - `/frontend/src/admin/`: App de administración (Shell, Core, Módulos)
  - `/frontend/src/public/`: App pública (guest access via `/gviz/tq`)
- `/backend`: Implementación de referencia para Google Apps Script (`api.gs`)
- `/docs`: Blueprint completo del sistema
- `/system`: AI agent specification (production-ready)
- `/examples`: Ejemplos de uso del agente AI
- `/scripts`: Scripts de migración y utilidades

## 📦 Repositorios

| Tipo | URL |
|------|-----|
| Código Fuente | https://github.com/congre-admin/congre-admin |
| Sitio Publicado | https://congre-admin.github.io |

## 🚀 Inicio Rápido

1. `cd frontend`
2. `npm install --legacy-peer-deps`
3. `npm run dev`

## 📋 Estado del Proyecto

| Componente | Estado | Notas |
|------------|--------|-------|
| Especificación AI | ✅ Completa | Sistema production-ready |
| Documentación Técnica | ✅ ~95% | Ver `/docs/CHANGELOG.md` |
| Backend (`api.gs`) | ✅ Completo | Auth, Sessions, RBAC, CRUD, Versioning (3293 líneas) |
| Frontend Core | ✅ Completo | Shell, Auth, Setup Wizard, Dashboard, AuthSettings, BackupExport |
| Frontend Módulos | 🟡 Pendiente | Admin_Personas, Admin_Registros, Admin_Usuarios, etc. |
| Services Layer | ❌ Vacío | `frontend/src/services/` — DataService no implementado |
| Types Layer | ❌ Vacío | `frontend/src/types/` — Interfaces no definidas |
| Backend | 🟡 Referencia | `api.gs` requiere evolución (ver `Backend.md`) |
