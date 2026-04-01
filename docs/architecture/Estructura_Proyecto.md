# Congre-Admin: Estructura del Proyecto (Frontend)

El proyecto es una **aplicación multi-página** con dos entry points (Pública y Admin) que comparten un núcleo común (Core).

> **Nota:** El código fuente del frontend se encuentra en el directorio `/frontend`.

## 1. Arquitectura de la App

La app tiene dos entry points distintos, enrutados desde `src/main.tsx`:

| Ruta | App | Entry | ssId utilizado |
|------|-----|-------|----------------|
| `/` | Pública | `src/public/App.tsx` | `PUBLIC_SS_ID` |
| `/admin/*` | Admin | `src/admin/AdminApp.tsx` | `CORE_SS_ID` |

Ambas apps comparten el motor del sistema (`src/core/`) pero tienen ssIds, fuentes de datos y requisitos de acceso distintos. Ver [Arquitectura.md §1](./Arquitectura.md) para detalles del modelo de dos aplicaciones.

## 2. Árbol de Directorios (Estructura Objetivo)

### Directorio raíz del proyecto

```
frontend/
├── index.html                 # Entry pública (carga /src/main.tsx)
├── admin.html                 # Entry admin (carga /src/main.tsx)
├── package.json
├── vite.config.ts             # Multi-page build: index.html + admin.html
├── tsconfig.json
├── tsconfig.node.json
├── postcss.config.js          # Tailwind v4 + autoprefixer
├── dev-server.js              # Servidor dev con routing SPA
└── public/
    ├── api/
    │   └── api.gs             # Copia sincronizada de backend/src/api.gs
    └── data/
        └── seed_perfiles.json # 6 perfiles RBAC base
```

### `src/` — Código fuente (Estructura Objetivo)

```
src/
├── main.tsx                   # Router principal (/ → PublicApp, /admin → AdminApp)
├── index.css                  # Estilos Tailwind base
│
├── core/                      # Motor del sistema (compartido entre ambas apps)
│   ├── context/
│   │   └── AuthContext.tsx     # Provider de autenticación + sesión
│   ├── crypto/
│   │   └── cryptoUtils.ts     # AES-GCM, PBKDF2, key wrapping
│   ├── shell/
│   │   └── Shell.tsx          # Layout principal (Sidebar + Navbar + Outlet)
│   ├── theme/
│   │   └── theme.ts           # Tema MUI light/dark
│   └── components/
│       └── Layout/
│           ├── Sidebar.tsx    # Navegación dinámica
│           └── Navbar.tsx     # Barra superior (user menu, dark mode)
│
├── modules/                   # Módulos del sistema (importados por AdminApp)
│   ├── setup/
│   │   └── views/
│   │       ├── SetupWizard.tsx
│   │       ├── Login.tsx
│   │       ├── SetupTOTP.tsx
│   │       └── SetupPasskey.tsx
│   ├── dashboard/
│   │   └── views/
│   │       └── Dashboard.tsx
│   ├── admin/
│   │   └── views/
│   │       └── BackupExport.tsx
│   └── settings/
│       └── views/
│           └── AuthSettings.tsx
│
├── services/                  # Adaptadores de API — ✅ IMPLEMENTADO
│   ├── dataService.ts         # HTTP → GAS (CRUD, module resolution)
│   ├── dataTransformService.ts # JSONata transforms
│   ├── authService.ts         # Auth operations
│   └── publicService.ts       # /gviz/tq fetcher
│
├── cache/                    # Cache service — ✅ IMPLEMENTADO
│   └── cacheService.ts        # Memory + localStorage + 24h expiry
│
├── types/                     # Interfaces TypeScript — ✅ IMPLEMENTADO
│   ├── index.ts               # Exports
│   ├── auth.ts                # AuthConfig, Passkey, LoginResponse
│   ├── user.ts                # User, UserMetadata, Perfil, Permisos
│   ├── data.ts                # ApiResponse, GetDataResponse, SaveDataPayload
│   └── config.ts              # Configuracion
│
├── hooks/                     # TanStack Query hooks — ✅ IMPLEMENTADO
│   ├── usePersonas.ts
│   ├── usePerfiles.ts
│   ├── useConfig.ts
│   └── useSession.ts
│
├── admin/                     # App de administración
│   └── AdminApp.tsx           # Rutas protegidas (/admin/*)
│
└── public/                    # App pública (guest access)
    ├── App.tsx                # Página pública (consumo /gviz/tq)
    └── index.css
```

### Dependencias entre directorios

```
src/main.tsx
├── importa → admin/AdminApp.tsx      → core/context/AuthContext
├── importa → admin/AdminApp.tsx      → core/shell/Shell
├── importa → admin/AdminApp.tsx      → modules/*/views/*   (lazy)
└── importa → public/App.tsx          → (solo fetch directo, no usa core)

src/public/App.tsx
└── no importa nada del Core          (recibe tema via contexto de main.tsx)
```

## 3. Anatomía de un Módulo

Cada carpeta de módulo en `src/modules/` debe seguir este patrón:

```
module_name/
├── views/                     # Pantallas principales (*.tsx)
├── components/                # Componentes exclusivos del módulo
├── hooks/                     # Lógica de negocio local
└── manifest.json              # Metadatos, rutas, widgets, seedData
```

> **Estado actual:** Ningún módulo tiene `manifest.json`, `components/` o `hooks/`. Todos solo tienen `views/`. Estos directorios se crearán al implementar cada módulo en Phase 2.

## 4. Reglas de Acoplamiento

1. **Importación:** Los módulos pueden importar desde `@core/*`. El Core nunca importa desde `@modules/*` (debe usar `React.lazy()`).
2. **Estilos:** No se permite CSS global dentro de módulos. Solo Tailwind o CSS Modules.
3. **Estado:** Los módulos deben usar `AuthContext` del Core para sesión y autenticación. Para datos, usar `DataService` (implementado en Phase 2).
4. **App Pública:** `src/public/App.tsx` no importa nada del Core. Recibe el tema por herencia del `ThemeProvider` configurado en `main.tsx`. Consume datos directamente via `/gviz/tq`.
5. **Core es compartido:** Tanto `AdminApp` como `PublicApp` usan `src/core/` (crypto, theme). El Core no debe tener lógica específica de ninguna app.

> **Feature futura — Sistema público de módulos:** En el futuro, el admin podrá configurar en el GSheet Público una hoja `Configuracion` que defina qué módulos se muestran en el sitio público y sus paths. PublicApp leerá esta config vía `/gviz/tq` y renderizará las vistas públicas de cada módulo dentro de un shell público simplificado (header + contenido, sin sidebar). Cada módulo necesitará un `PublicView` adicional a su `View` admin. Esto hará que PublicApp importe funcionalidad del Core (sistema de descubrimiento de módulos).

## 5. Dependencias Principales

| Categoría | Librería | Estado |
|-----------|----------|--------|
| UI | React 19, MUI v6, Tailwind v4 | ✅ En uso |
| Routing | react-router-dom v6 | ✅ En uso |
| QR | qrcode v1.5 | ✅ En uso (SetupTOTP) |
| Data | @tanstack/react-query v5 | ✅ En uso |
| Data | @tanstack/react-table v8 | ❌ Pendiente |
| Data | jsonata v2 | ✅ En uso |
| Validation | zod v3 | ❌ Pendiente |
| Crypto | jose v5 | ❌ Pendiente |
| Storage | idb-keyval v6 | ❌ Pendiente |
| Files | pdf-lib v1 | ❌ Pendiente |
| UI | framer-motion v11 | ❌ Pendiente |
| UI | lucide-react v0.417 | ❌ Pendiente (se usa @mui/icons-material) |

## 6. Despliegue a GitHub Pages

El proyecto está configurado para desplegarse automáticamente a GitHub Pages mediante GitHub Actions:

- **Repositorio:** `congre-admin/congre-admin.github.io`
- **URL:** `https://congre-admin.github.io`
- **Workflow:** `.github/workflows/deploy.yml`

### Build

```bash
cd frontend
npm install --legacy-peer-deps
npm run build
```

El comando `build` genera la carpeta `dist/` con los archivos estáticos de ambas apps (multi-page) y crea `dist/404.html` para el fallback de SPA.

### Despliegue del Backend (GAS)

El backend se despliega manualmente usando **clasp**:

- **Ubicación:** `backend/src/api.gs`
- **Documentación:** [Despliegue_GAS.md](./Despliegue_GAS.md)

```bash
cd frontend
npm run clasp:push   # Subir código
npm run clasp:deploy # Deployar versión
```

---

## 7. Ajustes Pendientes en la Implementación

La estructura actual del código no coincide con la estructura objetivo descrita arriba. Los siguientes cambios deben realizarse para alinear la implementación con esta documentación.

### Estado actual vs objetivo

| Directorio actual | Estado |
|-------------------|--------|
| `src/core/` | ⚠️ LEGACY — archivos duplicados de `admin/core/`, no importados por `main.tsx` |
| `src/admin/core/` | ✅ ACTIVO — motor real usado por `AdminApp` |
| `src/admin/modules/` | ✅ ACTIVO — módulos reales |
| `src/admin/App.tsx` | ❌ LEGACY — código anterior, `AdminApp.tsx` es el activo |
| `src/admin/entry.tsx` | ❌ HUÉRFANO — no referenciado, no compila (`useAuth()` sin importar) |

### Orden de ejecución

```
1. C (Eliminar legacy) → 2. A (Mover core) → 3. B (Mover módulos) → 4. D (Actualizar imports) → 5. E (Verificar)
```

> **Importante:** Los pasos deben ejecutarse en este orden. Eliminar el legacy `src/core/` primero evita conflictos al mover `admin/core/` a `core/`.

### Cambios requeridos

#### C. Eliminar archivos (PRIMER PASO)

| Archivo | Razón |
|---------|-------|
| `src/core/**/*` (legacy) | Reemplazado por el core activo al mover de `admin/core/` |
| `src/admin/App.tsx` | Legacy — `AdminApp.tsx` es el archivo activo |
| `src/admin/entry.tsx` | Huérfano, no compilable |
| `src/admin/index.css` | Duplicado de `src/index.css` |

#### A. Mover archivos de `admin/core/` → `core/` (SEGUNDO PASO)

| Origen | Destino |
|--------|---------|
| `src/admin/core/context/AuthContext.tsx` | `src/core/context/AuthContext.tsx` |
| `src/admin/core/crypto/cryptoUtils.ts` | `src/core/crypto/cryptoUtils.ts` |
| `src/admin/core/shell/Shell.tsx` | `src/core/shell/Shell.tsx` |
| `src/admin/core/theme/theme.ts` | `src/core/theme/theme.ts` |
| `src/admin/core/components/Layout/Sidebar.tsx` | `src/core/components/Layout/Sidebar.tsx` |
| `src/admin/core/components/Layout/Navbar.tsx` | `src/core/components/Layout/Navbar.tsx` |

#### B. Mover archivos de `admin/modules/` → `modules/` (TERCER PASO)

Todo el contenido de `src/admin/modules/` se mueve a `src/modules/`.

#### D. Actualizar imports (CUARTO PASO)

| Archivo | Import actual | Import nuevo |
|---------|---------------|--------------|
| `main.tsx:7` | `./admin/core/context/AuthContext` | `./core/context/AuthContext` |
| `main.tsx:8` | `./core/theme/theme` | Sin cambio |
| `AdminApp.tsx:2` | `./core/context/AuthContext` | `../core/context/AuthContext` |
| `AdminApp.tsx:3` | `./core/shell/Shell` | `../core/shell/Shell` |
| `AdminApp.tsx` (módulos) | `./modules/setup/views/SetupWizard` | `../modules/setup/views/SetupWizard` |
| `AdminApp.tsx` (módulos) | `./modules/setup/views/Login` | `../modules/setup/views/Login` |
| `AdminApp.tsx` (módulos) | `./modules/setup/views/SetupTOTP` | `../modules/setup/views/SetupTOTP` |
| `AdminApp.tsx` (módulos) | `./modules/dashboard/views/Dashboard` | `../modules/dashboard/views/Dashboard` |
| `AdminApp.tsx` (módulos) | `./modules/admin/views/BackupExport` | `../modules/admin/views/BackupExport` |
| Módulos (`modules/*/views/*.tsx`) | `../../core/...` | Sin cambio |

#### E. Verificar (ÚLTIMO PASO)

- Ejecutar `npm run build` desde `frontend/` y confirmar que compila sin errores
- Ejecutar `npm run dev` y verificar que ambas rutas (`/` y `/admin/*`) funcionan

---

## Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `DataService.md` | Cliente frontend (DataService, JSONata, TanStack Query) |
| `Tecnologia.md` | Stack tecnológico |
| `Backend_API_Completa.md` | API del backend GAS |
| `Core.md` | Arquitectura del núcleo |

