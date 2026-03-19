# Congre-Admin: Índice de Documentación

Este sistema modular permite la gestión integral de una congregación bajo una arquitectura de **Núcleo y Plug-ins**, garantizando seguridad de **Conocimiento Cero**.

## 🏗️ Arquitectura y Core
1.  [**Arquitectura del Sistema**](./architecture/Arquitectura.md): Definición del Núcleo, Plug-ins y Segmentación de Datos.
2.  [**Especificación Tecnológica**](./architecture/Tecnologia.md): Stack React/GAS, JSONata y AES-GCM.
3.  [**Interfaz y UX**](./architecture/Interfaz.md): Guía de diseño, Componentes M3 y Patrones de Interacción.
4.  [**Especificación de API**](./architecture/API.md): Protocolo de comunicación y Handshake de seguridad.
5.  [**Estrategia de Localización (i18n)**](./architecture/Localizacion.md): Multi-idioma y personalización teocrática.
6.  [**Matriz de Permisos**](./architecture/Permisos.md): Control de acceso RBAC y seguridad de campos.
7.  [**Esquemas Comunes**](./architecture/Esquemas_Comunes.md): Estructuras de Logs, Sesión y GeoJSON.
8.  [**Estrategia de Pruebas**](./architecture/Testing.md): Validación de seguridad y Zero-Knowledge.
9.  [**Especificación de Reportes**](./architecture/Reportes.md): Definición de PDFs y Formularios Oficiales.
10. [**Notificaciones Locales**](./architecture/Notificaciones.md): Estrategia de Background Sync y Privacidad.
11. [**Guía de Instalación (Setup)**](./architecture/Instalacion.md): Manual para el "Día 0" y despliegue.
12. [**Acceso y Despliegue**](./architecture/Despliegue.md): Estrategia de hosting y parámetros de URL.

## 📦 Especificación del Backend
- [**Protocolo del Backend**](./architecture/Backend.md): Implementación en GAS y GSheets.
- [**Estándar de Documentación**](./architecture/Guia_Documentacion.md): Cómo definir nuevos plug-ins.

## 🧩 Módulos del Sistema (Plug-ins)

### Administración
- [**Índice de Administración**](./modules/Administracion.md)
- [**Base de Datos de Personas**](./modules/Personas.md): Censo compartido y campos cifrados.
- [**Gestión de Personas**](./modules/Admin_Personas.md): Interfaz administrativa del censo.
- [**Usuarios**](./modules/Admin_Usuarios.md) | [**Sistema**](./modules/Admin_Sistema.md) | [**Registros**](./modules/Admin_Registros.md)

### Reuniones
- [**Índice de Reuniones**](./modules/Reuniones.md)
- [**Programa de Reuniones**](./modules/Reuniones_Programa.md): Confección y plantillas.
- [**Discursos Públicos**](./modules/Reuniones_Discursos.md): Agenda y oradores.

### Predicación
- [**Índice de Predicación**](./modules/Predicacion.md)
- [**Territorios**](./modules/Predicacion_Territorios.md): Gestión central de territorios.
    - [**Mapas y GeoJSON**](./modules/Predicacion_Mapas.md): Editor y visor de mapas.
    - [**Sistema de Asignaciones**](./modules/Predicacion_Asignaciones.md): Flujo de trabajo de asignaciones.
- [**De Casa en Casa**](./modules/Predicacion_DeCasaEnCasa.md) | [**Edificios**](./modules/Predicacion_Edificios.md) | [**Pública**](./modules/Predicacion_Publica.md) | [**Telefónica**](./modules/Predicacion_Telefonica.md)
