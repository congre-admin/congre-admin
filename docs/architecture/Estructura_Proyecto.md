# Congre-Admin: Estructura del Proyecto (Frontend)

El proyecto sigue una arquitectura de **Monolito Modular**, donde el Núcleo provee los servicios y los módulos se inyectan dinámicamente.

## 1. Árbol de Directorios (`/src`)

~~~text
src/
├── assets/             # Recursos estáticos (imágenes, fuentes, plantillas PDF locales)
├── core/               # El motor del sistema (Shell UI y Servicios Globales)
│   ├── auth/           # Lógica de Login, Passkeys y PBKDF2 (KDF)
│   ├── components/     # Implementación de CongreAdmin-UI (MUI + Tailwind)
│   ├── context/        # Providers (AuthContext, DataContext, UIContext)
│   ├── crypto/         # Motor AES-GCM y gestión de Master Key (Cofre)
│   ├── data/           # DataService, PersistQueryClient y Sync Queue
│   ├── shell/          # Layout principal, Sidebar, Dashboard y Navbar
│   └── utils/          # Helpers globales (JSONata wrappers, validadores)
├── modules/            # Plugins independientes (uno por carpeta)
│   ├── personas/       # Plugin de Gestión de Personas (Vault)
│   ├── reuniones/      # Plugin de Programa y Discursos
│   ├── predicacion/    # Plugin de Territorios y Salidas
│   └── anuncios/       # Plugin de Cartelera de Inicio
├── services/           # Adaptadores de API (GSheets, LocalStorage)
├── styles/             # Configuración de Tailwind y Temas de MUI
└── main.tsx            # Punto de entrada y Bootstrap del sistema
~~~

## 2. Anatomía de un Módulo (`src/modules/[module_name]/`)

Cada carpeta de módulo debe ser autosuficiente y seguir este patrón:

~~~text
module_name/
├── components/         # Componentes exclusivos del módulo
├── hooks/              # Lógica de negocio local (useAsignaciones, etc.)
├── views/              # Pantallas principales (renderizadas por el Shell)
├── manifest.json       # Metadatos, rutas, widgets y seedData
└── index.ts            # Punto de entrada que exporta el Manifiesto y Vistas
~~~

## 3. Reglas de Acoplamiento
1. **Importación:** Los módulos pueden importar desde `@core/*`, pero el Core nunca debe importar desde `@modules/*` de forma estática (debe usar Dynamic Imports).
2. **Estilos:** Se prohíbe el uso de CSS global dentro de los módulos. Todo debe usar Tailwind o CSS Modules.
3. **Estado:** Los módulos deben usar el `DataContext` del Core para interactuar con la base de datos, asegurando que la encriptación sea transparente.
