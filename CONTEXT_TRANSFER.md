# Congre-Admin - Transferencia de Contexto

**Fecha:** 2026-03-28  
**Estado del Proyecto:** Multi-page app (Público/Admin) + Setup + Backup implementado

---

## Resumen Ejecutivo

| Componente | Estado |
|------------|--------|
| Backend (api.gs) | ✅ Completado + TOTP nativo + Instalación dual |
| Frontend (React + Vite) | ✅ Multi-page app |
| GitHub Pages | ✅ Desplegado |
| TOTP Authentication | ✅ Implementado |
| Spreadsheets Core + Public | ✅ Creación dual en install |
| Backup/Export Master Key | ✅ Implementado |

---

## 1. Desarrollos Recientes (2026-03-28)

### Arquitectura Public/Admin Separada

**Problema resuelto:** La aplicación necesitaba separación entre:
- Zona pública (`/`) - Información visible sin autenticación
- Zona admin (`/admin`) - Acceso administrativo autenticado

**Solución implementada:**

| Cambio | Descripción |
|--------|-------------|
| Multi-page Vite | `index.html` → Público, `admin.html` → Admin |
| Rutas separadas | `/` → PublicApp, `/admin/*` → AdminApp |
| localStorage separado | `congre_public_ss_id` vs `congre_admin_*` |
| Spreadsheets duales | Core (admin) + Public (info compartida) |

### Backend (`backend/src/api.gs`)

**Función `actionInstall` actualizada:**

```javascript
// 1. Crear Spreadsheet Core: CongreAdmin-[nombre]-Core
const ssName = `CongreAdmin-${nombreLimpio}-Core`;
const ssResult = createSpreadsheet(ssName);

// 2. Crear Spreadsheet Público: CongreAdmin-[nombre]-Public
const ssPublicName = `CongreAdmin-${nombreLimpio}-Public`;
const ssPublicResult = createSpreadsheet(ssPublicName);
initPublicSheet(publicSsId); // Hojas: Indice, Anuncios, Reuniones

// 3. seedConfiguracion con datos de congregación
seedConfiguracion(ssId, {
  nombre_congregacion,
  numero_congregacion,
  nombre_mostrar,
  ss_publico: publicSsId
});
```

### Frontend - Estructura Actual

```
frontend/src/
├── main.tsx                    # Entry point único con BrowserRouter
├── admin/
│   ├── AdminApp.tsx           # Router admin (/admin/*)
│   ├── core/
│   │   ├── context/AuthContext.tsx
│   │   ├── shell/Shell.tsx
│   │   ├── theme/theme.ts
│   │   ├── crypto/cryptoUtils.ts
│   │   └── components/Layout/{Sidebar,Navbar}.tsx
│   └── modules/
│       ├── setup/views/{SetupWizard,Login,SetupTOTP}.tsx
│       ├── dashboard/views/Dashboard.tsx
│       └── admin/views/BackupExport.tsx
└── public/
    └── App.tsx                # Página pública con "Instalar" y "Acceso Admin"
```

### Archivos Modificados/Creados

| Archivo | Propósito |
|---------|-----------|
| `vite.config.ts` | Multi-page app: input { main, admin } |
| `main.tsx` | BrowserRouter con rutas /admin/* y /* |
| `admin/AdminApp.tsx` | Router protegido para admin |
| `admin/modules/setup/views/Login.tsx` | Formulario unificado con inputs de config |
| `admin/modules/setup/views/SetupWizard.tsx` | Wizard 4 pasos con backup |
| `public/App.tsx` | Página pública con diálogos de setup |
| `backend/src/api.gs` | actionInstall crea Core + Public |

---

## 2. Frontend - Estado Actual

### Stack Tecnológico

- React 19 + Vite 6
- TypeScript 5.x (Strict Mode)
- MUI v6 (Material Design 3)
- Tailwind CSS v4
- React Router v6

### Flujo de Setup (4 pasos)

1. **Configuración** - URL GAS + datos congregación
2. **Perfiles y Admin** - Crear usuario administrador
3. **Respaldo** - Exportar Master Key con contraseña separada
4. **Completado** - Redirección al login

### Flujo de Login

1. Si no hay config → mostrar inputs GAS URL + Core SS-ID
2. Username + Password → verifica password_hash
3. Si TOTP configurado → pedir código
4. verifyTOTP() → SessionToken + wrapped_mk
5. Redirección al Dashboard

### Página Pública (`/`)

- Muestra información de hoja "Publico" via GViz
- Dialog inicial para configurar SS-ID público
- Botón "Instalar" (disimulado) → `/admin/setup`
- Botón "Acceso Admin" → `/admin`

---

## 3. Códigos de Error

| Código | Descripción |
|--------|-------------|
| `ERR_AUTH_INVALID` | Credenciales inválidas |
| `ERR_TOTP_REQUIRED` | Se requiere código TOTP |
| `ERR_TOTP_INVALID` | Código TOTP inválido |
| `ERR_USER_EXISTS` | Usuario ya existe |
| `ERR_PROFILE_IN_USE` | Perfil en uso |
| `ERR_RATE_LIMITED` | Demasiados intentos |
| `ERR_VERSION_CONFLICT` | Conflicto de versión |

---

## 4. Notas Importantes

1. **URLs:**
   - App: `https://congre-admin.github.io`
   - Público: `/`
   - Admin: `/admin`

2. **Rutas:**
   - `/admin/setup` - Setup Wizard
   - `/admin/login` - Login
   - `/admin/setup-totp` - Configurar TOTP
   - `/admin` - Dashboard (protegido)
   - `/admin/backup` - Exportar backup

3. **localStorage:**
   - Admin: `congre_admin_api_url`, `congre_admin_ss_id`
   - Público: `congre_public_ss_id`

4. **Auth:**
   - wrapped_mk en memoria (nunca localStorage)
   - Master Key backup con contraseña separada

---

## 5. Próximos Pasos

### Inmediatos

1. **Testeo** - Verificar flujo completo: install → login → dashboard
2. **DataService Layer** - Crear adapter para GAS API
3. **TypeScript Types** - Definir interfaces para entidades

### Roadmap

| Fase | Módulo | Descripción |
|------|--------|-------------|
| Phase 2 | Admin_Personas | Listado, filtros, edición |
| Phase 2 | Admin_Registros | Publicadores, informes |
| Phase 3 | Reuniones_Programa | Programa semanal |
| Phase 3 | Predicacion_Territorios | Territorios con mapas |

---

## 6. Comandos Útiles

```bash
# Desarrollo
cd frontend && npm run dev

# Build (incluye admin.html)
npm run build

# Deploy
npx gh-pages -d frontend/dist
```

---

## 7. Issues Resueltos

| Issue | Solución |
|-------|----------|
| Build no incluía admin.html | `build: "vite build --config vite.config.ts"` |
| Router nesting causaba loops | Un solo BrowserRouter en main.tsx |
| Infinite redirect en ProtectedRoute | Simplificado con ProtectedShell component |
| White screens | Rutas relativas en AdminApp.tsx |

---

*Documento de transferencia de contexto para nueva sesión*
