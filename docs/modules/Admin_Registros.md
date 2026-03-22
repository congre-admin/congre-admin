# Congre-Admin: Plug-in de Registros e Informes

Este módulo gestiona el historial de actividad de los publicadores, la recolección mensual de informes de predicación, el registro de asistencia y la contabilidad administrativa (Novedades) para la sucursal y la visita del Superintendente de Circuito.

## 1. Manifiesto del Módulo
-   **ID:** `admin_registros`
-   **Sección:** `Administración`
-   **Icono:** `assignment`
-   **Navegación:**
    -   `{ "nombre": "Registros de publicador", "icono": "shield_lock", "ruta": "/fichas", "publico": false }`
    -   `{ "nombre": "Informes de predicación", "icono": "shield_lock", "ruta": "/informes", "publico": false }`
    -   `{ "nombre": "Cierre mensual", "icono": "analytics", "ruta": "/cierre", "publico": false }`
    -   `{ "nombre": "Asistencia", "icono": "shield_lock", "ruta": "/asistencia", "publico": false, "seccionPadre": "Reuniones" }`
-   **Permisos:** `admin` (Secretario), `editor` (Superintendentes de Grupo).
-   **Tablas Requeridas:** `Registros_Historicos`, `Informes_Mensuales`, `Asistencia_Reuniones`, `Cierres_Informes`, `Novedades`.
-   **Reportes:**
    -   `{ "id": "S-21-S", "nombre": "Registro de Publicador (3 años)", "tipo": "pdf_overlay", "template": "./assets/templates/S-21_S.pdf", "mapping": "3_service_years_consolidated" }`
    -   `{ "id": "S-3-S", "nombre": "Informe Mensual de Asistencia", "tipo": "pdf_form", "template": "./assets/templates/S-3_S.pdf", "mapping": "monthly_attendance_summary" }`
    -   `{ "id": "TOTALES_CONGRE", "nombre": "Informe a la Sucursal (Cierre)", "tipo": "dynamic_html", "mapping": "branch_report_workflow" }`
    -   `{ "id": "CUENTA_CORRIENTE_SC", "nombre": "Cuenta Corriente de Publicadores (Visita SC)", "tipo": "dynamic_html", "mapping": "publisher_account_current" }`
-   `{ "id": "DATOS_CONTACTO_SC", "nombre": "Datos de contacto para el Superintendente de Circuito", "tipo": "dynamic_html", "mapping": "active_publishers_contact_list" }`
-   `{ "id": "DIRECTORIO_EMERGENCIA", "nombre": "Directorio de Emergencia para Ancianos (Offline)", "tipo": "dynamic_html", "mapping": "emergency_contact_list" }`

## 2. Estructura de Datos (Esquema)

### Informe Mensual (`Informes_Mensuales`)
~~~json
{
    "id": "inf_2026_03_e1",
    "personaId": "e1",
    "mes": "2026-03",
    "cierreId": null,
    "participo": true,
    "estudios": 1,
    "auxiliar": false,
    "notas": "...",
    "_ts": "2026-03-05T10:00:00Z" 
}
~~~

### Tabla de Novedades (`Novedades`)
Registro flexible de hitos administrativos y cambios en el censo (Cuenta Corriente).
~~~json
{
    "id": "nov_001",
    "fecha": "2026-03-10",
    "categoria": "PUBLICADORES", // PUBLICADORES | SUCURSAL | VISITA_SC | OTROS
    "tipo": "BAJA", // ALTA | BAJA | EVENTO | NOTA
    "personaId": "e1", // Opcional
    "impacto": -1, // +1, -1 o 0
    "detalle": {
        "motivo": "Mudanza",
        "datos_extra": {} 
    },
    "enc_comentario": "iv:...", 
    "cierreId": null 
}
~~~

### Cierre de Informe (`Cierres_Informes`)
~~~json
{
    "id": "cier_2026_03",
    "mesContable": "2026-03",
    "fechaCierre": "2026-03-18T10:00:00Z",
    "enviadoPor": "u1",
    "resumen": { "cat_A": 10, "cat_B": 5, "cat_C": 80, "totalPublicadores": 95 }
}
~~~

### Registro de Asistencia (`Asistencia_Reuniones`)
~~~json
{
    "id": "ast_2026_03_01_vym",
    "semana": "2026-03-01",
    "tipoReunion": "entreSemana", // entreSemana | finDeSemana
    "total": 45,
    "comentarios": ""
}
~~~

## 3. Flujo de Trabajo (Workflow)

### A. Carga de Informes (Superintendentes)
Los responsables de grupo acceden a una interfaz filtrada solo para sus publicadores y cargan los datos del mes actual.

### B. Consolidación y Cierre Mensual (Secretario)
1.  **Detección de Tardíos:** El sistema lista informes donde `cierreId == null`. Aquellos con `_ts > $fechaUltimoCierre` se resaltan como "Posteriores al último cierre".
2.  **Inclusión Individual:** El Secretario marca qué informes (incluidos los tardíos) se consolidan en este envío.
3.  **Ajuste de Novedades:** Se muestran las `Novedades` pendientes (ej: bajas por mudanza) para calcular el saldo final de publicadores.
4.  **Cierre:** Se genera el reporte oficial y se asigna el `cierreId` a los informes y novedades seleccionados.

### C. Registro de Asistencia
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

### D. Visita del Superintendente de Circuito (SC)
1.  **Cuenta Corriente de Publicadores:** El reporte filtrará la tabla `Novedades` desde la fecha de la última visita.
2.  **Resumen Contable:** Presentará el saldo inicial, el detalle cronológico de cada alta/baja con su comentario, y el saldo final.
3.  **Documentación:** Exportación masiva de S-21 y S-88 del periodo.

## 4. Especificación de Interfaces

### A. Interfaz de Cumplimiento (Vista Secretario)
-   **Dashboard de Control:**
    -   **Widget de Plazo:** Contador de días restantes hasta el día 20 del mes.
    -   **Nivel de Carga:** Gráfico de progreso por grupo de predicación.
    -   **Acción de Reclamo (WhatsApp):** Botón por grupo que genera un listado de nombres que aún no han informado para enviar al Superintendente de Grupo.

### B. Interfaz de Informes (Superintendentes)
... (sin cambios) ...

### B. Gestión de Registros
-   Vista de la "Tarjeta de Registro de Publicador" (S-21) digitalizada con el historial de los últimos años.

### C. Asistencia a Reuniones
-   **Selector de Semana:** Input de fecha que muestra el calendario y resalta semanas con registros existentes.
-   **Formulario de Carga:**
    -   Dos filas con: Fecha (solo lectura), Tipo de Reunión (etiqueta), Input numérico para el total, Textarea para comentarios.
    -   Botón "Guardar" que persiste ambos registros simultáneamente.
-   **Historial Semanal:** Lista de semanas anteriores con opción de editar o ver detalles.
-   **Generador de Reportes:**
    -   Selector de mes/año.
    -   Botón "Generar S-3-S" que descarga el PDF con la tabla de asistencia consolidada.

## 5. Reglas de Negocio (JSONata)

### Resúmenes y Promedios
-   **Resumen de Grupo:** `$sum(informes[grupoId = $id].estudios)`
-   **Promedio Mensual de Asistencia:**
    ```jsonata
    $asistencia[mes = $mesSeleccionado].total / $count($asistencia[mes = $mesSeleccionado])
    ```
-   **Validación de Semana Única:**
    ```jsonata
    $count(asistencia[semana = $semana]) = 0
    ```

### Categorización y Cierre
-   **Filtro de Informes Disponibles:** `Informes_Mensuales[cierreId = null]` (En la UI, resaltar si `_ts > $ultimoCierre.fechaCierre`).
-   **Cálculo de Saldo para el SC:** `$saldoInicial + $sum(Novedades[fecha > $fechaUltimaVisita].impacto)`
