# Congre-Admin: Arquitectura de Localización (i18n)

Para garantizar la extensibilidad y personalización teocrática, el sistema utiliza un enfoque de localización desacoplado.

## 1. Principio de "Zero-Hardcoding"
Queda estrictamente prohibido el uso de texto plano en componentes UI. Todo texto debe ser invocado mediante una clave jerárquica:
- **Ejemplo:** `<span>{t('auth.login.title')}</span>` en lugar de `<span>Iniciar Sesión</span>`.

## 2. Niveles de Traducción

### A. Localización del Core (Estática)
- **Tecnología:** [i18next](https://www.i18next.com/) con archivos JSON locales.
- **Ubicación:** `src/core/locales/`.
- **Idiomas Soportados Iniciales:** `es` (Español), `en` (Inglés), `pt` (Portugués).
- **Alcance:** Interfaz de sistema, errores de red y navegación base.

### B. Localización de Plug-ins (Inyectada)
Cada plug-in debe registrar sus propias cadenas de traducción en su `Manifest`.
- **Estructura del Manifiesto:**
  ~~~json
  {
    "id": "mi_plugin",
    "i18n": {
      "es": { "nombre": "Título", "accion": "Guardar" },
      "en": { "nombre": "Title", "accion": "Save" }
    }
  }
  ~~~
- **Carga:** El Core fusiona estas traducciones en el motor i18n al activar el módulo.

### C. Overrides Teocráticos (Dinámicos)
Para términos específicos de cada región o congregación (ej: "Siervo Ministerial" vs "Servidor"), el sistema permite sobreescribir claves desde la configuración del Core.
- **Prioridad:** El valor en `GSheet Core > Configuracion` tiene prioridad sobre el JSON estático.

## 3. Formateo Regional (Native Intl)
No se utilizarán librerías externas para fechas o números. El sistema se apoya exclusivamente en la [Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) nativa del navegador:
- **Fechas:** `Intl.DateTimeFormat(lang, options).format(date)`
- **Listas:** `Intl.ListFormat(lang, { style: 'long', type: 'conjunction' }).format(['A', 'B', 'C'])` (A, B y C).

## 4. Detección de Idioma
El orden de prioridad para establecer el idioma es:
1. Parámetro `?lang=` en la URL.
2. Idioma preferido en el perfil de usuario (si hay sesión).
3. Idioma detectado en el navegador (`navigator.language`).
4. Fallback: `es` (Español).
