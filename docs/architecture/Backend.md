# Congre-Admin: Especificación de la Interfaz del Backend

En la arquitectura modular de Congre-Admin, el Backend se define como un **Proveedor de Servicios** (Data Provider) que debe cumplir con un protocolo de comunicación estándar. Actúa como el motor de ejecución para un sistema modular con segmentación física de datos.

---

> ## ⚠️ Nota sobre la Implementación de Referencia (`api.gs`)
>
> El archivo `backend/src/api.gs` es una **implementación de referencia (Proof of Concept)** que demuestra:
> - La mecánica básica de comunicación GET/POST con Google Apps Script
> - Operaciones CRUD básicas sobre Google Sheets
> - Un esquema de cifrado funcional (XXTEA)
>
> **NO está completo.** Las siguientes características de la especificación **no están implementadas**:
> - ✅ Autenticación (`challenge`, `login`, `register`) - **IMPLEMENTADO**
> - ✅ Validación de sesiones (`sessionToken`) - **IMPLEMENTADO**
> 
> - ❌ Control de permisos RBAC
> - ❌ Borrado lógico (`_deleted`) y versionado (`_v`, `_ts`)
>
> **El backend debe evolucionar para cumplir con esta especificación.** 

---

## 1. El Protocolo Backend (API Multi-ID)
Cualquier implementación de backend debe cumplir con las siguientes normas estructurales:

- **Convención de Nombres de ID:** Todas las tablas de datos **DEBEN** tener una columna de clave primaria denominada exactamente `id` (en minúsculas). Esto permite que la acción `saveData` realice operaciones *upsert* de forma universal e independiente del módulo.
- **Acciones Estándar:**
    - **`batchGetData`**: Recuperación de múltiples tablas.
-   **`saveData`**: Operación *upsert* (insertar o actualizar) en un recurso específico.
-   **`deleteData`**: Borrado físico o lógico de registros.
-   **`initSheet/initTable`**: Preparación estructural del recurso basado en el esquema.

### Seguridad del Recurso
El backend debe validar que el `ssId` solicitado sea un recurso autorizado por el Núcleo para evitar accesos a archivos externos no relacionados con el sistema.

## 2. Validaciones
Las validaciones de esquema se ejecutan en el **Frontend** mediante JSONata antes de enviar los datos al backend. El backend confiablemente recepta los datos y los persiste.
- **Sanitización:** El backend aplica un filtro simple para el GSheet Público que elimina campos con prefijo `enc_`.

---

## 3. Estructura del GSheet Core (El Orquestador)
Para inicializar el sistema, el archivo GSheet maestro debe contener las siguientes tablas con sus respectivas cabeceras:

### Tabla: `Usuarios`
- `id`: UUID único.
- `username`: Correo electrónico.
- `wrapped_mk`: Master Key cifrada.
- `perfilId`: ID del perfil asignado.
- `personaId`: (Opcional) ID de la entidad en la base de datos de Personas.
- `auth_factor`: `passkey`, `totp`, `email`.

### Tabla: `Perfiles` (NUEVA)
- `id`: ID del perfil (ej: `p_secretario`, `p_siervo_territorios`).
- `nombre`: Nombre descriptivo (ej: "Secretario", "Siervo de Territorios").
- `permisos`: Objeto JSON con el mapa de accesos (ej: `{"personas": "RW", "territorios": "R"}`).

### Tabla: `Etiquetas` (NUEVA)
- `id`: UUID único del registro.
- `nombre`: Nombre visible (ej: `Hermanos Varones`).
- `alias_variable`: Nombre técnico para JSONata (ej: `Varones`). **Debe ser único.**
- `categoria`: Grupo al que pertenece (ej: `Demografía`).
- `color`: Código hexadecimal (ej: `#9C27B0`).
- `isVirtual`: Booleano (si es true, se calcula mediante JSONata).
- `expresion`: Expresión JSONata asociada.

### Tabla: `Registro_Plugins`
- `plugin_id`: Identificador (ej: `reuniones_programa`).
- `ssId`: ID del GSheet físico donde reside el plugin.
- `status`: `active`, `suspended`.

### Tabla: `Configuracion`
- `clave`: Identificador de ajuste.
    - Ejemplos: `nombre_congregacion`, `año_servicio_actual`, `idioma_predeterminado`.
- `valor`: Valor del ajuste (ej: `2026`).
- `is_public`: Booleano (si es accesible sin login).

---

## 4. Implementación de Referencia: Google Apps Script (GAS)
El script `api.gs` es el plug-in de backend primario y utiliza Google Sheets como base de datos distribuida.

### Seguridad y Acceso
-   **Persistencia de API:** El frontend identifica el URL del GAS mediante el parámetro `api` en la URL y lo persiste localmente.
-   **Aislamiento:** El GAS gestiona el acceso a diferentes archivos de Google Sheets basándose en los IDs proporcionados por el Núcleo para el GSheet Core, el Público, el de Personas y los Operativos.

### Modelo de Seguridad (Zero-Knowledge)
-   **Cofre Criptográfico:** El backend almacena la **Master Key (MK)** cifrada con el **TOTP Secret** de cada usuario (`wrapped_mk`).
-   **Cifrado en Reposo:** El backend almacena y entrega bloques de texto cifrados con AES-GCM (incluyendo su IV) sin conocer su contenido original.

## 4. Niveles de Autenticación
El proveedor de backend debe validar los factores de autenticación requeridos antes de emitir un `session_token`. El sistema soporta:

1.  **Autenticación Biométrica (Passkeys/WebAuthn):** Método primario para administradores. Requiere almacenamiento de la `Public Key` para validación de firmas.
2.  **TOTP (Time-based OTP):** Sincronización basada en tiempo (Google Authenticator).
3.  **OTP via Email:** Envío de códigos de respaldo vía Gmail (`MailApp`).

---

## 5. El Cofre Criptográfico y Passkeys
Cuando un usuario se autentica mediante **Passkey**, el backend valida el desafío y entrega la **Master Key cifrada** (`wrapped_mk`). 
-   El frontend descifra la MK localmente para mantener el modelo de **Conocimiento Cero**.
-   Se recomienda el uso del Keyring del sistema operativo para mantener las llaves de desbloqueo de forma persistente y segura.

---

## 6. Optimización: Sistema de Lotes y Caché
-   **Batching:** Agrupamiento de respuestas para minimizar latencia. Crucial para cargar el esquema y los datos públicos inicialmente.
-   **Capa de Caché:** Implementación de `CacheService` para acelerar lecturas masivas de datos públicos y configuraciones de plugins.

## 7. Logs y Auditoría
El backend es responsable de registrar en el GSheet Core:
-   Intentos de acceso fallidos y exitosos.
-   Cambios en la tabla maestra de Esquema.
-   Historial de operaciones de escritura en la tabla de Personas y configuraciones de Plugins.

## 8. Evolución de Datos y Backups
Para garantizar que no haya pérdida de información durante actualizaciones del sistema:

### A. Política de `initSheet` No Destructiva
- El backend nunca debe borrar una hoja si ya existe (`preserveExisting: true`).
- Si se añaden nuevas columnas, el backend debe añadirlas al final de la cabecera actual sin alterar las existentes.

### B. Migraciones de Esquema
- Para cambios backward-compatible (agregar campos opcionales): seguir política `initSheet` no destructiva.
- Para cambios breaking (renombrar/eliminar campos): ejecutar script de migración desde `scripts/migrations/`.
- Toda migración debe registrarse en la tabla `Sistema_Migraciones` del GSheet Core.
- Ver [Estrategia de Migración de Esquemas](./Migraciones.md) para detalles completos.

### C. Sistema de Backup Manual
- El Core debe exponer una función de "Exportar Backup Completo" que descargue un archivo ZIP conteniendo todos los archivos GSheet vinculados en formato JSON.
- **Requerido:** Ejecutar backup antes de cualquier migración breaking.

## 9. Gestión de Volumen y Archivado (Cold Storage)
Para mantener el rendimiento óptimo y no alcanzar el límite de 10M de celdas de Google Sheets:

### A. Archivado de Logs
- **Frecuencia:** Semestral.
- **Acción:** Los logs con una antigüedad superior a 6 meses se mueven automáticamente (o bajo demanda del Admin) a una hoja llamada `Logs_Archivo_[AÑO]`.
- **Visibilidad:** El visor de logs del Core solo muestra los últimos 6 meses por defecto, con opción de "Cargar Archivo Histórico".

### B. Históricos Operativos (Reuniones y Territorios)
- **Cierre de Ciclo:** Al finalizar el año de servicio, el sistema sugiere archivar los programas y asignaciones de territorios completados hace más de 2 años.
- **Mecánica:** Se crea un nuevo GSheet (`ssId_Archive`) y se mueven las filas físicas allí. El Core mantiene una referencia a este nuevo `ssId` solo para consultas de reportes históricos.

### C. Optimización de Lectura
- El backend (`api.gs`) utiliza `CacheService` para las tablas de configuración y esquemas, reduciendo las llamadas a la API de GSheets.
