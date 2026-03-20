# Congre-Admin: Arquitectura de Núcleo y Plug-ins

El sistema se basa en un marco de trabajo central (**Core**) que orquesta una serie de módulos independientes (**Plug-ins**), utilizando una estrategia de **Segmentación Física de Datos** para garantizar máxima privacidad y escalabilidad.

## 1. El Núcleo (Core System)
Es el motor estable que proporciona los servicios esenciales a toda la aplicación:

-   **Shell UI:** Interfaz general, navegación, gestión de temas (oscuro/claro) y notificaciones.
-   **Seguridad y Auth:** Gestión de login, 2FA/TOTP, Passkeys y el motor de cifrado AES-GCM.
-   **Orquestador de Datos:** Gestiona los enlaces a las diferentes bases de datos físicas.
-   **DataService:** Bus de comunicación agnóstico con el backend.
-   **Motor JSONata:** Motor universal para lógica de negocio y validaciones.

## 2. Definición de Plug-in
Un módulo es una unidad independiente que se "enchufa" al Core cumpliendo esta estructura:
-   **Manifest:** JSON que define:
    -   Metadatos base (nombre, icono, versión).
    -   Permisos y rutas.
    - **Data Aliases:** Definición de entidades nombradas locales para JSONata (ej: `{"plantillas": "Plantillas_Reuniones"}`).
    - **Computed Variables:** Colecciones inteligentes pre-filtradas (ej: `{"ancianos": "$personas['Anciano' in enc_servicio.etiquetas]"}`).
    - **Dashboard Widgets:** Definición de micro-vistas para la página de inicio.
        *   `component`: Nombre del componente de resumen.
        *   `query`: Expresión JSONata para obtener los datos del widget (ej: `$asignaciones[fecha = $semanaActual]`).
    -   **Views:** Componentes React que se renderizan dentro del Shell UI.
-   **Esquema:** Definiciones dinámicas para la tabla `Sistema_Esquema`.
-   **Lógica:** Expresiones JSONata específicas para validaciones del módulo.
-   **Seed Data:** Archivo JSON con datos iniciales (plantillas, catálogos, configuraciones base) que se inyectan en el primer uso.

## 3. Segmentación Física de Datos
La información se distribuye en múltiples bases de datos (GSheets) según su nivel de privacidad:

### A. GSheet Core (The Orchestrator)
Contiene la configuración maestra:
-   **Usuarios:** Credenciales y permisos.
-   **Registro_Plugins:** Mapeo de módulos con sus respectivos `spreadsheet_id`.
-   **Configuración Global:** Preferencias del sistema.

### B. GSheet Público (The Mirror)
Es el recurso optimizado para el modo invitado (sin login).
-   **Mecánica de Volcado:** El Core sincroniza exclusivamente los datos marcados como "Publicados" desde los GSheets operativos hacia este archivo.
-   **Estructura:** Contiene una hoja `Indice` (módulos activos) y hojas específicas por plugin (ej: `Public_Reuniones`).
-   **Consumo Directo:** El frontend consume estos datos mediante el endpoint de visualización de Google Sheets (`/gviz/tq`), permitiendo una carga ultrarrápida sin consumo de cuota en el backend `api.gs`.
-   **Aislamiento:** Este archivo no tiene vínculos físicos ni permisos compartidos con los datos sensibles.

### C. GSheet Personas (The Vault)
Se gestiona como un plug-in de alta prioridad.
-   **Contenido:** Censo completo (Identidad, Contacto, Servicio).
-   **Privacidad:** Solo se conecta a la sesión bajo permisos de administrador.

### D. GSheets Operativos
Cada plug-in (Reuniones, Predicación, etc.) tiene su propio archivo para datos internos (plantillas, discursos, etc.).

## 4. Gestión de Ciclo de Vida (Instalación)
Desde el panel de Administración, el sistema permite:
1.  **Selección:** Elegir un plug-in del catálogo disponible.
2.  **Vinculación:** Proporcionar el ID de un nuevo GSheet para ese módulo.
3.  **Provisión (Setup):** El Core inicializa las tablas y cabeceras automáticamente vía `initSheet`.
4.  **Activación:** El módulo aparece en el menú según los permisos del usuario.

## 5. Orquestación y Carga Dinámica (Host & Plugins)
Para permitir la extensibilidad sin recompilación del Core, se aplica el siguiente patrón de Micro-frontends:

### A. Registro de Punto de Entrada (Entry Point)
Cada registro en la tabla `Registro_Plugins` incluye la ruta al archivo JS del plugin (ej: `./modules/reuniones/main.js`).

### B. Ciclo de Carga del Plugin
1. **Fase de Descubrimiento:** Al iniciar la app, el Core consulta los plugins activos para el usuario.
2. **Inyección de Manifiesto:** El Core descarga el `Manifest.json` de cada plugin y genera dinámicamente las rutas en el `React Router`.
3. **Lazy Loading:** Los componentes de vista (`Views`) solo se descargan cuando el usuario navega hacia ese módulo, utilizando `React.lazy(() => import(plugin_url))`.

### C. Aislamiento de Estilos y Estado
- **Estilos:** Se utiliza **Tailwind CSS** con prefijos o **CSS Modules** para evitar colisiones entre el Core y los Plugins.
- **Estado:** Cada plugin mantiene su propio estado local. El Core solo expone un `Context` compartido para servicios comunes (Auth, Storage, i18n).

## 6. Capa de Persistencia Agnostica (Storage Adapters)
El sistema no está atado a Google Sheets. El Core permite cambiar el adaptador por módulo:
-   **GSheets Adapter:** Uso de GAS como puente.
-   **RestAPI Adapter:** Para bases de datos SQL propias.
-   **Local Adapter:** Almacenamiento en el navegador para pruebas.

## 6. Comunicación Inter-Módulo
Los plug-ins nunca hablan entre sí directamente. Siempre solicitan datos al Core:
-   *Ejemplo:* El módulo de *Reuniones* solicita: `core.getPersonas(filtroJSONata)`. El Core decide si entrega los datos basándose en la sesión activa.

## 7. Librería de Componentes (CongreAdmin-UI)
El Core expone componentes Material Design para asegurar consistencia visual:
-   `<DataTable />`: Tablas con búsqueda, filtrado JSONata y exportación multiformato.
-   `<PersonaSelector />`: Selector con validación de filtros de reunión.
-   `<EncryptedInput />`: Gestión transparente de campos AES-GCM (IV + Ciphertext).

## 8. Sincronización y Resolución de Conflictos
Para garantizar la integridad en entornos multi-usuario y con soporte offline parcial:

### A. Estrategia de Versionado
Cada registro en las tablas debe incluir dos campos técnicos:
- `_v`: Versión numérica incremental.
- `_ts`: Timestamp de la última modificación (ISO 8601).

### B. Resolución de Conflictos (Last Write Wins)
Por defecto, el sistema aplica la regla de que la última escritura gana, pero el backend validará la versión:
1. El Cliente envía el `item` con su `_v` actual.
2. Si el `_v` en el backend es mayor, devuelve un error `ERR_CONFLICT`.
3. El Cliente debe realizar un `merge` manual o automático antes de reintentar.

### C. Cola de Sincronización (Sync Queue)
Los cambios realizados offline se guardan en `IndexedDB` y se procesan secuencialmente cuando la conexión se restablece.

## 9. Integridad Referencial y Borrado Lógico
Dada la naturaleza distribuida de los datos (múltiples GSheets), el sistema implementa las siguientes reglas para evitar datos huérfanos:

### A. Política de Borrado Lógico (Soft Delete)
- Todos los registros deben incluir el campo técnico `_deleted` (booleano).
- La acción `deleteData` del API, por defecto, marca este campo como `true` en lugar de eliminar la fila física.
- Las consultas del Core filtran automáticamente los registros donde `_deleted == true`.

### B. Verificación de Dependencias (Hooks)
Antes de realizar un borrado de una entidad primaria (ej: una Persona), el Core ejecuta un flujo de validación:
1. **Consulta de Uso:** El Core pregunta a los plugins registrados: `¿Alguien usa el ID [X]?`.
2. **Respuesta del Plugin:** El plugin de *Reuniones* o *Predicación* revisa sus tablas y responde si hay vínculos activos.
3. **Bloqueo o Alerta:** Si existen dependencias, el Core impide el borrado y muestra una lista de los lugares donde se usa ese dato, sugiriendo reasignar antes de borrar.

## 10. Formato de Seed Data (Datos Iniciales)
Para evitar IDs hardcodeados que puedan colisionar entre congregaciones, el sistema utiliza un formato de "Mapeo de Referencias" durante la provisión de módulos:

### A. Estructura del JSON
Los IDs que comienzan con `@` se consideran identificadores relativos (variables de sesión de inyección).

~~~json
{
  "tablas": {
    "Plantillas_Reuniones": [
      { "id": "@reunion_vym", "nombre": "Reunión Vida y Ministerio" }
    ],
    "Plantillas_Secciones": [
      { "id": "@seccion_tesoros", "reunionId": "@reunion_vym", "nombre": "Tesoros" }
    ]
  }
}
~~~

### B. Proceso de Inyección (Core Logic)
1. **Detección:** El Core identifica todos los strings que inician con `@`.
2. **Generación:** Para cada identificador único (ej: `@reunion_vym`), el Core genera un UUID real.
3. **Mapeo:** Se crea un diccionario temporal de traducción.
4. **Reemplazo:** Se recorre todo el objeto de Seed Data sustituyendo las variables `@` por sus UUIDs correspondientes, preservando así la integridad referencial.
5. **Carga:** Se envían los datos transformados al backend mediante una operación batch.
