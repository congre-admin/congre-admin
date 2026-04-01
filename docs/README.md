# Congre-Admin: Índice de Documentación

Este sistema modular permite la gestión integral de una congregación bajo una arquitectura de **Núcleo y Plug-ins**, garantizando seguridad de **Conocimiento Cero**.

## 🤖 AI Agent System

La especificación del agente AI se encuentra en `/system` (raíz del proyecto):
- [**System Prompt**](../system/prompt.md): Punto de entrada del agente
- [**Execution Loop**](../system/execution.md): Flujo de trabajo obligatorio
- [**Output Specification**](../system/output-spec.md): Formato de salida
- [**Rules**](../system/rules.md): Reglas y restricciones
- [**Acceptance Criteria**](../system/acceptance.md): Criterios de validación
- [**Error Handling**](../system/error-handling.md): Manejo de ambigüedades
- [**Examples**](../examples/): Ejemplos completos

## 🏗️ Arquitectura y Core
1.  [**Arquitectura del Sistema**](./architecture/Arquitectura.md): Definición del Núcleo, Plug-ins y Segmentación de Datos.
2.  [**Arquitectura del Núcleo**](./architecture/Core.md): Componentes del Core, datos y flujos de orquestación.
3.  [**Sistema de Autenticación**](./architecture/Autenticacion.md): Passkeys, TOTP, Email OTP y flujos de login.
4.  [**Especificación Tecnológica**](./architecture/Tecnologia.md): Stack React/GAS, JSONata y AES-GCM.
5.  [**DataService**](./architecture/DataService.md): Arquitectura de servicios, tipos TypeScript y hooks de TanStack Query.
6.  [**Interfaz y UX**](./architecture/Interfaz.md): Guía de diseño, Componentes M3 y Patrones de Interacción.
7.  [**Backend_API_Completa.md**](./architecture/Backend_API_Completa.md): Referencia completa del API
7.  [**Estrategia de Localización (i18n)**](./architecture/Localizacion.md): Multi-idioma y personalización teocrática.
8.  [**Matriz de Permisos**](./architecture/Permisos.md): Control de acceso RBAC y seguridad de campos.
9.  [**Esquemas Comunes**](./architecture/Esquemas_Comunes.md): Estructuras de Logs, Sesión y GeoJSON.
10. [**Estrategia de Pruebas**](./architecture/Testing.md): Validación de seguridad y Zero-Knowledge.
11. [**Especificación de Reportes**](./architecture/Reportes.md): Definición de PDFs y Formularios Oficiales.
12. [**Notificaciones Locales**](./architecture/Notificaciones.md): Estrategia de Background Sync y Privacidad.
13. [**Guía de Instalación (Setup)**](./architecture/Instalacion.md): Manual para el "Día 0" y despliegue.
14. [**Acceso y Despliegue**](./architecture/Despliegue.md): Estrategia de hosting y parámetros de URL.
15. [**Estructura del Proyecto**](./architecture/Estructura_Proyecto.md): Organización de carpetas `/src` y reglas de acoplamiento.
16. [**Diagramas de Procesos**](./architecture/Diagramas_Procesos.md): Workflows visuales (Setup, Cierre, Handshake) en Mermaid.

## 📦 Especificación del Backend
- [**Protocolo del Backend**](./architecture/Backend.md): Implementación en GAS y GSheets.
- [**Documentación Técnica API**](./architecture/Backend_API_Completa.md): Referencia completa con todas las acciones, ejemplos y optimización de quota GAS.
- [**Arquitectura del Núcleo**](./architecture/Core.md): Core del sistema y orquestación de datos.
- [**Sistema de Autenticación**](./architecture/Autenticacion.md): Passkeys, TOTP, Email OTP y flujos de login.
- [**Estándar de Documentación**](./architecture/Guia_Documentacion.md): Cómo definir nuevos plug-ins.

## 📋 Mantenimiento
- [**Changelog**](./CHANGELOG.md): Registro de cambios en la documentación.

## 🧩 Módulos del Sistema (Plug-ins)

### Administración
- [**Índice de Administración**](./modules/Administracion.md)
- [**Base de Datos de Personas**](./modules/Personas.md): Censo compartido y campos cifrados.
- [**Gestión de Personas**](./modules/Admin_Personas.md): Interfaz administrativa del listado de personas.
- [**Anuncios y Cartelera**](./modules/Admin_Anuncios.md): Hub de inicio y avisos oficiales.
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
