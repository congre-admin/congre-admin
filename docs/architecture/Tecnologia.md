# Congre-Admin: Especificación Tecnológica

Congre-Admin utiliza un stack moderno, descentralizado y de alto rendimiento, optimizado para la privacidad del usuario y la facilidad de despliegue.

## 1. Front-end (El Núcleo Operativo)
- **Framework:** [React 18+](https://react.dev/) con arquitectura de componentes funcionales y Hooks.
- **Herramienta de Construcción:** [Vite](https://vitejs.dev/) para un desarrollo ultrarrápido y empaquetado optimizado.
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) (Recomendado) para garantizar la integridad de los datos y el tipado de los esquemas.
- **Gestión de Estado:** 
    - **Global:** `Context API` para estados simples (Auth, Tema).
    - **Servidor/Sincronización:** [TanStack Query v5](https://tanstack.com/query) (React Query).
    - **Persistencia Offline:** Uso obligatorio de **PersistQueryClient** con **IndexedDB** para mantener la cola de sincronización (`Sync Queue`) y el caché de datos entre sesiones.

## 2. Procesamiento de Datos (JSONata)
- **Motor:** [JSONata](https://jsonata.org/) se utiliza como el lenguaje universal de consulta y transformación de datos.
- **Aplicaciones:**
    - **Validación:** Reglas de negocio complejas evaluadas antes de guardar.
    - **Filtrado:** Búsqueda avanzada en tablas y selectores de personas.
    - **Sanitización:** Eliminación de campos sensibles (`enc_`) para la vista pública.
    - **Reportes:** Generación de resúmenes estadísticos en tiempo real.

## 3. Seguridad y Criptografía (Zero-Knowledge)
- **Algoritmo Principal:** **AES-GCM (256-bit)** mediante la [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) nativa del navegador.
- **Derivación de Claves (KDF):**
    - **Algoritmo:** **PBKDF2-HMAC-SHA256**.
    - **Iteraciones:** **600,000** (Siguiendo recomendaciones de OWASP).
    - **Salt:** Generado aleatoriamente (16 bytes) para cada usuario y almacenado en el GSheet Core.
    - **Propósito:** Derivar la **Wrapping Key** a partir de la contraseña del usuario para cifrar/descifrar la **Master Key (MK)**.
- **Gestión de Claves:**
    - **Master Key (MK):** Generada localmente (256-bit aleatorios), nunca viaja al servidor en texto plano.
    - **Key Wrapping:** La MK se cifra con la Wrapping Key antes de guardarse en el backend (`wrapped_mk`).
    - **IV (Vector de Inicialización):** Cada campo cifrado genera un IV único de 12 bytes, almacenado junto al ciphertext (formato: `iv:ciphertext`).
- **Autenticación:**
    - **Passkeys (WebAuthn/FIDO2):** Acceso biométrico seguro sin contraseñas. Implementado mediante la Web Authentication API nativa del navegador.
    - **TOTP:** Generación de códigos temporales (Google Authenticator). Implementación nativa usando HMAC-SHA1.
    - **Email OTP:** Códigos de un solo uso enviados por email mediante MailApp de GAS.

### 3.1 Autenticación Passkeys (WebAuthn/FIDO2)

El sistema soporta autenticación mediante passkeys utilizando el estándar WebAuthn:

| Característica | Implementación |
|----------------|----------------|
| **Algoritmo** | ES256 (ECDSA over P-256) |
| **Formato de ID** | Base64URL |
| **Almacenamiento** | `auth_config.passkeys` en tabla Usuarios |
| **rpId** | Dominio del sitio (extraído del origen) |

#### Flujo de Registro (Registration)
1. Frontend solicita desafío al backend (`action: setupPasskey`)
2. Backend genera desafío + user ID (ambos en base64)
3. Frontend usa `navigator.credentials.create()` para crear credencial
4. Browser genera par de claves público/privada
5. Credencial se guarda en el dispositivo (Windows Hello, Touch ID, etc.)
6. Frontend envía attestación al backend (`action: confirmPasskey`)
7. Backend guarda credential ID en `auth_config.passkeys`

#### Flujo de Autenticación (Login)
1. Frontend solicita desafío al backend (`action: challenge`)
2. Backend retorna desafío + lista de credential IDs registrados
3. Frontend usa `navigator.credentials.get()` para firmar desafío
4. Dispositivo verifica biométrica y firma el desafío
5. Frontend envía aserción al backend (`action: login` con `passkeyAssertion`)
6. Backend verifica firma (implementación simplificada) y emite sesión

#### Detalles Técnicos
- **Challenge:** 32 bytes aleatorios codificados en base64 estándar
- **user.id:** Hash SHA-256 del username codificado en base64
- **rpId:** Nombre de dominio extraído del origen (ej: `congre-admin.github.io`)
- **excludeCredentials:** Evita registrar el mismo dispositivo dos veces

## 4. Protocolo de Cifrado de Archivos (Vault de Drive)
Para adjuntos sensibles (Cartas, PDFs privados), se sigue este flujo técnico obligatorio:

### A. Flujo de Subida (Upload)
1. **Lectura:** El frontend lee el archivo mediante `FileReader.readAsArrayBuffer()`.
2. **Cifrado:**
   - Se genera un **IV de 12 bytes** aleatorio.
   - Se cifra el buffer completo usando **AES-GCM (256-bit)** con la **Master Key**.
3. **Empaquetado:** Se concatena `IV + Ciphertext` en un solo `Blob`.
4. **Transporte:** Se envía el `Blob` a GAS mediante una petición `POST` (multipart/form-data o Base64 según cuota).
5. **Resultado:** GAS guarda el archivo en Drive con extensión `.enc`.

### B. Flujo de Descarga (Download/Viewer)
1. **Obtención:** El frontend descarga el archivo como `ArrayBuffer`.
2. **Extracción:** Se separan los primeros 12 bytes (IV) del resto (Ciphertext).
3. **Descifrado:** Se procesa con la **Master Key** local.
4. **Visualización:** El buffer resultante se convierte en un `Blob URL` (`URL.createObjectURL(blob)`) para ser mostrado en un `<iframe>` o visor de PDF interno.

## 5. Backend y Persistencia
- **Proveedor Primario:** [Google Apps Script (GAS)](https://developers.google.com/apps-script).
- **Base de Datos:** [Google Sheets](https://www.google.com/sheets/about/) como motor de almacenamiento distribuido.
- **Estrategia de Segmentación:**
    - Uso de múltiples `Spreadsheet IDs` para aislar físicamente los datos sensibles (Censo) de los operativos (Programas) y los públicos.
- **Protocolo:** Comunicación vía HTTPS (doGet/doPost) con payloads JSON.

## 5. Despliegue e Infraestructura
- **Hosting:** [GitHub Pages](https://pages.github.com/) (Estático).
- **Persistencia de Sesión:** Los parámetros de conexión (`api` url y `ssId` inicial) se pueden pasar vía URL y se persisten en `localStorage`.
- **PWA (Progressive Web App):** Soporte para instalación en dispositivos móviles y funcionamiento offline parcial mediante Service Workers.

## 6. Stack Técnico y Dependencias (`package.json`)
Para garantizar la compatibilidad, el proyecto debe utilizar las siguientes librerías principales:

### Core Framework
- **React 19** + **Vite 6** (Frontend Tooling).
- **TypeScript 5.x** (Strict Mode obligatorio).

### Interfaz y UX
- **@mui/material v6** + **@mui/icons-material**: Implementación de Material Design 3.
- **tailwindcss v4**: Estilizado atómico y layout responsivo.
- **@tanstack/react-table v8**: Motor de tablas avanzado.
- **framer-motion**: Animaciones suaves para transiciones de módulos y Drawers.

### Gestión de Datos y Estado
- **@tanstack/react-query v5**: Sincronización y caché de datos.
- **@tanstack/query-sync-storage-persister**: Integración con IndexedDB.
- **jsonata**: Motor de consultas y transformaciones.
- **idb-keyval**: Utilidad ligera para manejo de IndexedDB.

### Criptografía y Archivos
- **pdf-lib**: Manipulación y generación de reportes PDF (Overlay).
- **lucide-react**: Set de iconos complementarios.
- **PBKDF2**: Implementado mediante la Web Crypto API nativa.

> **⚠️ Estado de integración:** Las siguientes dependencias están instaladas en `package.json` pero **aún no tienen imports activos** en el código: `@tanstack/react-query`, `@tanstack/react-table`, `jsonata`, `zod`, `jose`, `idb-keyval`, `pdf-lib`, `framer-motion`, `lucide-react`, `otpauth`. Se integrarán en Phase 2 con DataService y los módulos de administración.

## 7. Catálogo de Validaciones JSONata (Ejemplos Reales)
El sistema utiliza estas expresiones tanto en el frontend (feedback inmediato) como en el backend (integridad).

### Validación de Conflictos de Horario
`$count(reuniones[fecha = $nuevaFecha and sala = $nuevaSala]) = 0`
*Retorna true si la sala está disponible.*

### Validación de Edad Mínima (Personas)
`$yearsBetween($.identidad.fechaNacimiento, $now()) >= 18`
*Para asignar roles que requieren mayoría de edad.*

### Filtrado de Participantes (Motor de Sugerencias)
`personas[$.genero = 'H' and 'Anciano' in $.enc_servicio.etiquetas]`
*Selecciona solo hombres con la etiqueta 'Anciano'.*

### Sanitización Pública
`$map(payload, function($v) { $sift($v, function($val, $key) { $not($startsWith($key, 'enc_')) }) })`
*Elimina recursivamente cualquier campo que comience con `enc_`.*

## 7. Entidades Nombradas y Contexto (JSONata)
Para simplificar las consultas y validaciones cruzadas entre módulos, el motor JSONata del Core pre-vincula las siguientes variables globales:

- **`$personas`**: Acceso directo al listado de personas completo descifrado.
    - *Ejemplo:* `$personas[id = $.responsableId].identidad.nombre` (Obtiene el nombre de un responsable usando su ID).
- **`$config`**: Diccionario de la tabla `Configuracion`.
    - *Ejemplo:* `$.fecha > $config.fecha_limite`
- **`$usuario`**: Información de la sesión activa.
    - *Ejemplo:* `$.creadoPor = $usuario.id`
- **`$ahora`**: Fecha y hora actual del sistema.

### Contexto Global Dinámico (Etiquetas del Usuario)
Además de las variables del manifiesto, el Core inyecta variables basadas en la tabla `Sistema_Etiquetas`. Cada registro en esta tabla genera una variable global accesible mediante su `id`.
- **Mecánica:** El Core ejecuta `contexto_jsonata` sobre la base de datos de personas y asigna el resultado a `$id`.
- **Ejemplo:** Si existe la etiqueta con ID `Inactivos` y consulta `$personas[$.enc_servicio.participo = false]`, cualquier plugin puede usar `$Inactivos` para obtener ese subconjunto.

### Entidades Locales de Módulo
Cada plugin puede registrar alias para sus propias tablas en el `Manifest` bajo la clave `dataAliases`. Estos alias se inyectan como variables adicionales cuando el motor ejecuta lógica para ese plugin.
- **Ejemplo (Reuniones):** Si el manifest define `"plantillas": "Plantillas_Reuniones"`, el plugin puede usar `$plantillas[id = 'r1']` directamente.

### Promoción Universal de Etiquetas (Global Context)
Todas las etiquetas definidas se promueven automáticamente a variables globales usando su `alias_variable`.

#### Reglas de Nomenclatura y Unicidad
Para evitar conflictos técnicos y colisiones de nombres:
1. **Unicidad:** El sistema valida que el `alias_variable` sea único en toda la tabla `Etiquetas`.
2. **Formato:** Solo se permiten caracteres alfanuméricos (sin espacios ni símbolos especiales).
3. **Protección de Reservadas:** El sistema impide usar nombres reservados del motor JSONata (ej: `count`, `sum`, `map`) como alias.
4. **Prioridad:** Si un plugin intenta inyectar una variable local con el mismo nombre que una global, la **local** tiene precedencia dentro del contexto de ese plugin.

#### Mecanismo de Inyección
`$variable = isVirtual ? evaluate(expresion) : personas[alias_variable in enc_servicio.etiquetas]`

### Funciones Extendidas
El Core registra funciones personalizadas dentro del motor:
- **`$isRole('admin')`**: Valida si el usuario actual pertenece a un perfil.
- **`$decrypt(campo)`**: Función interna para manejar campos `enc_` de forma transparente.

---

## Archivos Relacionados

| Archivo | Descripción |
|--------|-------------|
| `Core.md` | Arquitectura del núcleo del sistema |
| `Autenticacion.md` | Sistema de autenticación y flujos |
| `Backend.md` | Especificación del backend |
| `Backend_API_Completa.md` | API completa del backend |
| `Arquitectura.md` | Arquitectura general del sistema |
