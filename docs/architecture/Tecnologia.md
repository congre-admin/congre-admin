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
    - **Passkeys (WebAuthn):** Acceso biométrico seguro sin contraseñas.
    - **TOTP:** Generación de códigos temporales (Google Authenticator).

## 4. Backend y Persistencia
- **Proveedor Primario:** [Google Apps Script (GAS)](https://developers.google.com/apps-script).
- **Base de Datos:** [Google Sheets](https://www.google.com/sheets/about/) como motor de almacenamiento distribuido.
- **Estrategia de Segmentación:**
    - Uso de múltiples `Spreadsheet IDs` para aislar físicamente los datos sensibles (Censo) de los operativos (Programas) y los públicos.
- **Protocolo:** Comunicación vía HTTPS (doGet/doPost) con payloads JSON.

## 5. Despliegue e Infraestructura
- **Hosting:** [GitHub Pages](https://pages.github.com/) (Estático).
- **Persistencia de Sesión:** Los parámetros de conexión (`api` url y `ssId` inicial) se pueden pasar vía URL y se persisten en `localStorage`.
- **PWA (Progressive Web App):** Soporte para instalación en dispositivos móviles y funcionamiento offline parcial mediante Service Workers.

## 6. Catálogo de Validaciones JSONata (Ejemplos Reales)
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

- **`$personas`**: Acceso directo al censo completo descifrado.
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

### Colecciones Inteligentes (Computed Variables)
El Core permite definir alias para subconjuntos de datos complejos en el `Manifest`. Estas variables se evalúan dinámicamente y están disponibles globalmente o localmente.
- **Ejemplo (Personas):** Si el manifest define `"ancianos": "$personas['Anciano' in enc_servicio.etiquetas]"`, cualquier parte del sistema puede usar `$ancianos` para obtener la lista filtrada.
- **Uso en Selectores:** Un componente `<PersonaSelector />` puede configurarse para mostrar solo `$ancianos` de forma declarativa.

### Funciones Extendidas
El Core registra funciones personalizadas dentro del motor:
- **`$isRole('admin')`**: Valida si el usuario actual pertenece a un perfil.
- **`$decrypt(campo)`**: Función interna para manejar campos `enc_` de forma transparente.
