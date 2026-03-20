# Congre-Admin: Plug-in de Registros e Informes

Este módulo gestiona el historial de actividad de los publicadores, la recolección mensual de informes de predicación y el registro de asistencia a reuniones.

## 1. Manifiesto del Módulo
-   **ID:** `admin_registros`
-   **Sección:** `Administración`
-   **Icono:** `assignment`
-   **Dependencias:** `[]`
-   **Navegación:**
    -   `{ "nombre": "Registros de publicador", "icono": "shield_lock", "ruta": "/fichas", "publico": false }`
    -   `{ "nombre": "Informes de predicación", "icono": "shield_lock", "ruta": "/informes", "publico": false }`
    -   `{ "nombre": "Asistencia", "icono": "shield_lock", "ruta": "/asistencia", "publico": false, "seccionPadre": "Reuniones" }`
-   **Permisos:** `admin` (Secretario), `editor` (Superintendentes de Grupo).
-   **Tablas Requeridas:** `Registros_Historicos`, `Informes_Mensuales`, `Asistencia_Reuniones`.
-   **Reportes:**
    -   `{ "id": "S-21-S", "nombre": "Registro de Publicador (3 años)", "tipo": "pdf_overlay", "template": "./assets/templates/S-21_S.pdf", "mapping": "3_service_years_consolidated" }`
    -   `{ "id": "S-3-S", "nombre": "Informe Mensual de Asistencia", "tipo": "pdf_form", "template": "./assets/templates/S-3_S.pdf", "mapping": "monthly_attendance_summary" }`

## 2. Estructura de Datos (Esquema)

### Informe Mensual
~~~json
{
    "id": "inf_2026_03_e1",
    "personaId": "e1",
    "mes": "2026-03",
    "participo": true,
    "estudios": 1,
    "auxiliar": false,
    "notas": "..."
}
~~~

### Registro de Asistencia
~~~json
{
    "id": "ast_2026_03_01_vym",
    "semana": "2026-03-01",
    "tipoReunion": "entreSemana",
    "total": 45,
    "comentarios": ""
}
~~~
- **id:** Identificador único del registro.
- **semana:** Fecha del lunes de la semana (formato ISO 8601 `YYYY-MM-DD`).
- **tipoReunion:** `entreSemana` o `finDeSemana`.
- **total:** Cantidad total de asistentes.
- **comentarios:** Notas opcionales.

## 3. Flujo de Trabajo (Workflow)

### A. Carga de Informes (Superintendentes)
Los responsables de grupo acceden a una interfaz filtrada solo para sus publicadores y cargan los datos del mes actual.

### B. Consolidación (Secretario)
El administrador general supervisa la recepción de informes y genera las tarjetas de registro históricas.

### C. Registro de Asistencia (Nuevo)
**Ubicación en el menú:** `Reuniones` → `Asistencia` (`shield_lock`)

1.  **Selección de Semana:**
    -   El usuario selecciona una semana mediante un picker de fechas (se muestra la fecha del lunes).
    -   El sistema verifica si ya existen registros para esa semana y los carga si están disponibles.

2.  **Carga de Asistencia:**
    -   Dos campos de entrada numérica: uno para la reunión **entre semana** y otro para **fin de semana**.
    -   Campo de comentarios opcional para cada reunión (ej: "día festivo", "clima adverso", "asamblea").

3.  **Generación de Reporte Mensual:**
    -   El secretario selecciona un mes y año.
    -   El sistema compila los registros semanales y genera el formulario **S-3-S** (Informe Mensual de Asistencia).
    -   El PDF se descarga listo para firmar y enviar.

## 4. Especificación de Interfaces

### A. Interfaz de Informes
-   Lista rápida de publicadores por grupo con checkboxes y campos numéricos de entrada rápida.
-   Indicador visual de informes pendientes vs. recibidos.

### B. Gestión de Registros
-   Vista de la "Tarjeta de Registro de Publicador" (S-21) digitalizada con el historial de los últimos años.

### C. Asistencia a Reuniones (Nueva)
-   **Selector de Semana:** Input de fecha que muestra el calendario y resalta semanas con registros existentes.
-   **Formulario de Carga:**
    -   Dos filas con: Fecha (solo lectura), Tipo de Reunión (etiqueta), Input numérico para el total, Textarea para comentarios.
    -   Botón "Guardar" que persiste ambos registros simultáneamente.
-   **Historial Semanal:** Lista de semanas anteriores con opción de editar o ver detalles.
-   **Generador de Reportes:**
    -   Selector de mes/año.
    -   Botón "Generar S-3-S" que descarga el PDF con la tabla de asistencia consolidada.

## 5. Reglas de Negocio (JSONata)
-   **Resumen de Grupo:** `$sum(informes[grupoId = $id].estudios)`
-   **Promedio Mensual de Asistencia:**
    ```jsonata
    $asistencia[mes = $mesSeleccionado].total / $count($asistencia[mes = $mesSeleccionado])
    ```
-   **Validación de Semana Única:**
    ```jsonata
    $count(asistencia[semana = $semana]) = 0
    ```
    (Retorna `true` si no existe un registro previo para esa semana y tipo de reunión)
