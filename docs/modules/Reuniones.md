# Congre-Admin: Módulo de Reuniones

Este módulo gestiona la confección y difusión de los programas de reuniones semanales, integrando plantillas jerárquicas y una agenda de discursos públicos, así como el registro de asistencia.

## Lista de Plug-ins y Menús

### 1. Plug-in: Programa de Reuniones
Núcleo de confección y visualización del programa semanal.
-   **Programa** (`public`): Consulta pública de reuniones. Incluye búsqueda de asignaciones y sistema de notificaciones por nombre.
-   **Administrar programa** (`shield_lock`): Interfaz de confección inteligente.
-   **Ajustes de programa** (`shield_lock`): Gestión de plantillas jerárquicas y configuración operativa.
-   [Ver Definición Detallada](./Reuniones_Programa.md)

### 2. Plug-in: Discursos Públicos
Gestión de la agenda de oradores locales y visitantes.
-   **Administrar discursos** (`shield_lock`): Control de arreglos entrantes y salientes, directorio externo y registro histórico.
-   [Ver Definición Detallada](./Reuniones_Discursos.md)

### 3. Plug-in: Asistencia (Nuevo)
Registro y reporte de asistencia a reuniones.
-   **Asistencia** (`shield_lock`): Carga semanal de asistencia y generación del informe mensual S-3-S.
-   [Ver Definición Detallada](../modules/Admin_Registros.md#C-registro-de-asistencia-nuevo)

---

## Funcionamiento Conceptual
El sistema utiliza una estructura de **herencia de plantillas**:
1.  **Semanas** que contienen IDs de **Reuniones**.
2.  **Reuniones** que contienen IDs de **Secciones**.
3.  **Secciones** que contienen IDs de **Partes**.

Para generar un programa real, se "instancia" una plantilla, se ajusta su estructura y se asignan los roles mediante el motor de sugerencias del Núcleo.
