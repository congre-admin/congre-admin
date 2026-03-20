# Congre-Admin: Módulo de Anuncios y Cartelera

Este módulo es el punto de entrada principal del sistema. Centraliza la difusión de información oficial, eventos y avisos locales.

## 1. Manifiesto del Módulo
-   **ID:** `admin_anuncios`
-   **Sección:** `Administración`
-   **Icono:** `campaign`
-   **Navegación:**
    -   `{ "nombre": "Inicio", "icono": "home", "ruta": "/", "publico": true }`
    -   `{ "nombre": "Gestionar anuncios", "icono": "shield_lock", "ruta": "/admin", "publico": false }`
-   **Permisos:** 
    -   `admin`: Gestión total de la cartelera.
    -   `public`: Lectura de anuncios marcados como `publicado: true`.
-   **Tablas Requeridas:** `Anuncios_Maestro`.

## 2. Estructura de Datos (Esquema)

### Registro de Anuncio
~~~json
{
    "id": "ann_001",
    "fecha": "2026-03-15",
    "titulo": "Visita del Superintendente de Circuito",
    "enc_contenido": "iv:...", 
    "categoria": "Evento", 
    "prioridad": 1,
    "publicado": true,
    "adjuntos": [
        { 
            "nombre": "Programa_Visita.pdf", 
            "fileId": "id_en_drive", 
            "cifrado": true, // Si es true, requiere MK para abrirse
            "mimeType": "application/pdf"
        }
    ]
}
~~~

## 3. Gestión de Archivos (Vault de Drive)
El sistema utiliza una carpeta dedicada en Google Drive para los adjuntos:
- **Archivos Públicos:** Accesibles mediante URL directa de Google Drive.
- **Archivos Privados:** Se almacenan con el prefijo `.enc`. El Core los descarga como `ArrayBuffer`, los descifra localmente y los muestra mediante un `Blob URL` temporal.

## 3. Flujo de Trabajo (Workflow)

### A. Página de Inicio (Público/Privado)
Al abrir la aplicación, el sistema consulta la tabla de anuncios:
1.  **Invitados:** Ven tarjetas con los anuncios marcados como públicos.
2.  **Logueados:** Ven además anuncios segmentados para su perfil (ej: "Aviso a Siervos Ministeriales").

### B. Gestión Administrativa (Secretaría)
El administrador crea los anuncios, les asigna una fecha de expiración y decide si se "clavan" en la parte superior (prioridad 1).

## 4. Especificación de Interfaces

### A. Cartelera de Inicio (Dashboard)
-   **Diseño:** Lista de tarjetas Material Design 3 con imágenes de portada opcionales.
-   **Indicadores:** Badges de "Nuevo", "Urgente" o "Carta de Sucursal".
-   **Acción:** Clic para expandir y ver el contenido completo cifrado.

### B. Consola de Administración
-   **Tabla de Gestión:** Lista de todos los anuncios (activos y archivados).
-   **Editor:** Formato Markdown o Texto Enriquecido para el cuerpo del anuncio.

## 5. Reglas de Negocio (JSONata)

### Filtro de Inicio
`Anuncios_Maestro[publicado = true and (not fechaVencimiento or fechaVencimiento >= $ahora)]`
*(Filtro base para la página de inicio).*
