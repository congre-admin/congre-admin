# Congre-Admin: Especificación de Interfaz y UX

La interfaz de Congre-Admin está diseñada bajo el principio de **"Complejidad Oculta"**: herramientas potentes en una interfaz limpia, intuitiva y rápida, optimizada para dispositivos móviles (Mobile First).

## 1. Lenguaje Visual
- **Sistema de Diseño:** [Material Design 3 (M3)](https://m3.material.io/).
- **Framework de CSS:** [Tailwind CSS](https://tailwindcss.com/) para un diseño responsivo y mantenible.
- **Tipografía:** Sans-serif moderna (Roboto o Inter) optimizada para legibilidad en pantallas pequeñas.
- **Iconografía:** [Material Symbols/Icons](https://fonts.google.com/icons) con variantes Rounded o Outlined.

## 2. Modos y Temas
- **Soporte Nativo:** Modo Claro y Modo Oscuro (Dark Mode) basado en la preferencia del sistema o selección del usuario.
- **Colores Semánticos:**
    - **Primary:** Acciones principales y navegación.
    - **Secondary:** Información de apoyo.
    - **Error:** Alertas y validaciones fallidas.
    - **Surface:** Fondos de tarjetas y contenedores.

## 3. Estructura de Navegación
- **Desktop:** Barra lateral izquierda (Sidebar) persistente con grupos colapsables.
- **Mobile:** Menú lateral (Drawer) accionable mediante botón hamburguesa o gestos.
- **Jerarquía de Vistas:**
    1. **Nivel 1 (Sección):** Grupos como "Administración", "Reuniones", "Predicación".
    2. **Nivel 2 (Módulo):** El plugin específico (ej: "Gestión de Personas").
    3. **Nivel 3 (Pestañas):** Organización interna dentro de un módulo (ej: "Lista", "Ficha", "Reportes").

## 4. Componentes Globales (CongreAdmin-UI Library)
- **DataTable:** 
    - **Motor:** [TanStack Table v8](https://tanstack.com/table/v8).
    - **Funcionalidades:** Agrupamiento dinámico, ordenamiento multicolumna, filtros avanzados y sumarización (agregación) de datos.
    - **Visualización:** Cabeceras fijas (Sticky Headers) y Scroll infinito.
    - **Móvil:** Acciones rápidas al deslizar (Swipe actions).
- **Forms & Inputs:**
    - Floating labels (Material style).
    - **EncryptedInput:** Input con indicador visual de candado y validación de MK.
    - **Chip Cloud:** Para gestión de etiquetas y filtros.
- **Feedback:**
    - Snackbars para confirmaciones de guardado.
    - Skeletons para estados de carga de red.
    - Diálogos de confirmación para acciones destructivas.

## 5. Patrones de UX Críticos
- **Edición en Contexto:** Uso de **Drawers laterales** en lugar de diálogos centrales para mantener el contexto de la lista principal mientras se edita una ficha.
- **Optimismo en la UI:** Los cambios se reflejan instantáneamente en la interfaz local mientras la sincronización ocurre en segundo plano (Sync Queue).
- **Indicadores de Privacidad:** Uso consistente del icono `shield_lock` para identificar secciones o datos que requieren autenticación administrativa.

## 6. Implementación de CongreAdmin-UI
Para garantizar la independencia y reutilización, la librería de componentes se organiza como un paquete interno dentro del monorepositorio:

- **Localización:** `src/core/components/`
- **Principio:** Los componentes son **Agnósticos al Negocio**. No realizan peticiones de datos; reciben `props` y emiten `events`.
- **Composición:** Basada en **Material UI (MUI)** o **Headless UI** con estilos vía Tailwind para máxima personalización.
