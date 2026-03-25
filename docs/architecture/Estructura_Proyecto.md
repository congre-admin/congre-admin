# Congre-Admin: Estructura del Proyecto (Frontend)

El proyecto sigue una arquitectura de **Monolito Modular**, donde el Núcleo provee los servicios y los módulos se inyectan dinámicamente.

> **Nota:** El código fuente del frontend se encuentra en el directorio `/frontend`.

## 1. Árbol de Directorios (`/frontend/src`)

~~~text
frontend/
├── src/
│   ├── main.tsx                # Punto de entrada
│   ├── App.tsx                 # Routing principal
│   ├── index.css               # Estilos Tailwind
│   │
│   ├── core/                   # El motor del sistema
│   │   ├── auth/               # Lógica de Login y autenticación
│   │   ├── components/
│   │   │   └── Layout/          # Shell, Sidebar, Navbar
│   │   ├── context/
│   │   │   └── AuthContext.tsx # Provider de autenticación
│   │   ├── crypto/
│   │   │   └── cryptoUtils.ts  # AES-GCM, PBKDF2
│   │   ├── shell/
│   │   │   └── Shell.tsx       # Layout principal
│   │   ├── theme/
│   │   │   └── theme.ts        # Tema MUI
│   │   └── locales/            # i18next (es, en, pt) - pendiente
│   │
│   ├── modules/                # Plugins dinámicos
│   │   ├── setup/              # Setup Wizard (instalación)
│   │   │   ├── views/
│   │   │   │   ├── SetupWizard.tsx
│   │   │   │   └── Login.tsx
│   │   │   └── manifest.json
│   │   ├── dashboard/         # Dashboard de inicio
│   │   │   ├── views/
│   │   │   │   └── Dashboard.tsx
│   │   │   └── manifest.json
│   │   └── personas/           # Futuro: Gestión de personas
│   │
│   ├── services/               # Adaptadores de API (GAS) - pendiente
│   └── types/                  # TypeScript types - pendiente
│
├── public/
│   └── data/
│       └── seed_perfiles.json  # Perfiles base para instalación
│
├── package.json                # Dependencias y scripts
├── vite.config.ts             # Configuración Vite
├── tsconfig.json              # TypeScript config
└── tailwind.config.js         # Tailwind config
~~~

## 2. Anatomía de un Módulo (`src/modules/[module_name]/`)

Cada carpeta de módulo debe ser autosuficiente y seguir este patrón:

~~~text
module_name/
├── views/                     # Pantallas principales
├── components/                # Componentes exclusivos del módulo
├── hooks/                     # Lógica de negocio local
├── manifest.json             # Metadatos, rutas, widgets y seedData
└── index.ts                   # Punto de entrada (exporta Manifiesto y Vistas)
~~~

## 3. Reglas de Acoplamiento

1. **Importación:** Los módulos pueden importar desde `@core/*`, pero el Core nunca debe importar desde `@modules/*` de forma estática (debe usar Dynamic Imports).
2. **Estilos:** Se prohíbe el uso de CSS global dentro de los módulos. Todo debe usar Tailwind o CSS Modules.
3. **Estado:** Los módulos deben usar el `DataContext` del Core para interactuar con la base de datos, asegurando que la encriptación sea transparente.

## 4. Despliegue a GitHub Pages

El proyecto está configurado para desplegarse automáticamente a GitHub Pages mediante GitHub Actions:

- **Repositorio:** `congre-admin/congre-admin.github.io`
- **URL:** `https://congre-admin.github.io`
- **Workflow:** `.github/workflows/deploy.yml`

### Build

```bash
cd frontend
npm install
npm run build
```

El comando `build` genera la carpeta `dist/` con los archivos estáticos y crea `dist/404.html` para el fallback de SPA.
