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

## 🛠️ Estructura del Repositorio

- `/src`: Código fuente de la aplicación React (Iniciando desde cero).
- `/backend`: Implementación de referencia para Google Apps Script.
- `/docs`: Blueprint completo del sistema.
- `/system`: AI agent specification (production-ready).
- `/examples`: Ejemplos de uso del agente AI.

## 🚀 Inicio Rápido

1. `npm install`
2. `npm run dev`

## 📋 Estado del Proyecto

| Componente | Estado | Notas |
|------------|--------|-------|
| Especificación AI | ✅ Completa | Sistema production-ready |
| Documentación Técnica | ✅ 95% | Ver `/docs/CHANGELOG.md` |
| Frontend | 🟡 En desarrollo | Estructura base definida |
| Backend | 🟡 Referencia | `api.gs` requiere evolución (ver `Backend.md`) |
