# Congre-Admin: Guía de Instalación y Configuración Inicial

Este documento describe el flujo de trabajo para poner en marcha una nueva instancia del sistema (Setup Wizard).

## 1. Fase 1: Preparación del Backend
1. **Crear Google Script:** El administrador crea un nuevo proyecto de Apps Script y pega el contenido de `api.gs` y `xxtea.gs`.
2. **Desplegar como Web App:** Se publica con acceso para "Cualquiera".
3. **Copiar URL:** Se obtiene la URL de ejecución (ej: `https://script.google.com/.../exec`).

## 2. Fase 2: El Asistente de Configuración (Setup UI)
Cuando el frontend detecta que no hay `api` ni `ssId` en `localStorage`, lanza el **Setup Wizard**:

### Paso 1: Enlace de API
- **Input:** URL del Google Apps Script.
- **Acción:** El frontend realiza un `ping` (vía `doGet`) para validar la conexión.

### Paso 2: Creación del Orquestador (GSheet Core)
- **Opción A (Recomendada):** El frontend solicita al backend crear una nueva hoja mediante la acción `createResource`. 
    - **Acción:** El backend ejecuta `SpreadsheetApp.create('CongreAdmin_Core')` y devuelve el `ssId`.
    - **Provisión:** El backend inicializa automáticamente las tablas `Usuarios`, `Perfiles`, `Registro_Plugins` y `Configuracion` con sus cabeceras.
    - **Seed Data:** Se inyectan los perfiles base:
        *   `Super-Admin` (Acceso total)
        *   `Comité de Servicio` (Supervisión general)
        *   `Secretario` (Gestión de personas y registros)
        *   `Superintendente de Reunión VyM` (Programa de entre semana)
        *   `Siervo de Discursos` (Agenda de fin de semana)
        *   `Siervo de Territorios` (Inventario y mapas)
        *   `Siervo de Predicación Pública` (Exhibidores/Carritos)
        *   `Conductor de Predicación Telefónica` (Listados de números)
        *   `Superintendente de Grupo` (Informes y atención de grupo)
- **Opción B:** Vincular una GSheet existente proporcionando su ID manualmente.

### Paso 3: Registro del Super-Admin
- **Input:** Username, Password (para derivar la Master Key inicial) y Factor de Auth (TOTP/Passkey).
- **Acción:** 
    1. El cliente genera una **Master Key (MK)** aleatoria de 256 bits.
    2. Cifra la MK con la clave derivada del password -> `wrapped_mk`.
    3. Envía `register` al backend con el `username` y `wrapped_mk`.

## 3. Fase 3: Provisión de Plugins
Una vez logueado, el Admin accede al panel de "Administración del Sistema":
1. **Seleccionar Plugin:** (ej: `predicacion_territorios`).
2. **Proporcionar ssId:** ID de una nueva GSheet para ese plugin.
3. **Inicializar:** 
    - El Core envía el esquema del plugin al backend para crear las tablas necesarias (`initSheet`).
    - El Core detecta si el plugin tiene **Seed Data** y realiza una carga inicial de datos (plantillas, catálogos) para que el módulo sea operativo inmediatamente.

## 4. Persistencia del Acceso
El sistema genera un enlace de acceso rápido:
`https://congre-admin.pages.dev/?api=[URL_ENC]&ssId=[ID_ENC]`
*Este enlace permite a otros administradores configurar sus dispositivos instantáneamente.*
