# Congre-Admin: Guía de Instalación y Configuración Inicial

Este documento describe el flujo de trabajo para poner en marcha una nueva instancia del sistema (Setup Wizard).

## 1. Fase 1: Preparación del Backend
1. **Crear Google Script:** El administrador crea un nuevo proyecto de Apps Script y pega el contenido de `api.gs`.
2. **Desplegar como Web App:** Se publica con acceso para "Cualquiera".
3. **Copiar URL:** Se obtiene la URL de ejecución (ej: `https://script.google.com/.../exec`).

### Diagrama del Proceso de Instalación

```mermaid
sequenceDiagram
    participant Admin
    participant Frontend
    participant Backend as Google Apps Script
    participant Core as GSheet Core

    Note over Admin,Core: FASE 1: Preparación del Backend

    Admin->>Backend: 1. Desplegar api.gs como Web App
    Backend-->>Admin: URL del endpoint (exec)

    Note over Admin,Core: FASE 2: Setup Wizard

    Admin->>Frontend: 2. Accede a la app (sin configuración)
    Frontend->>Frontend: Detecta que no hay api/ssId<br/>Inicia Setup Wizard

    rect rgb(240, 248, 255)
        Note over Frontend,Backend: Paso 1: Enlace de API
        Admin->>Frontend: Ingresa URL del GAS
        Frontend->>Backend: GET /exec?action=getData&sheet=...
        Backend-->>Frontend: ✓ Conexión validada
    end

    rect rgb(240, 248, 255)
        Note over Frontend,Core: Paso 2: Crear GSheet Core
        Admin->>Frontend: Ingresa nombre de congregación
        Frontend->>Frontend: Carga backend/data/seed_perfiles.json
        
        Frontend->>Backend: POST /exec action=install
        activate Backend
        rect rgb(255, 250, 240)
            Note over Backend,Core: Proceso en Backend
            Backend->>Core: createSpreadsheet(nombre)
            Core-->>Backend: ssId del nuevo GSheet
            
            Backend->>Core: initCoreTables(ssId)
            Note over Core: Crea hojas:<br/>- Usuarios<br/>- Perfiles<br/>- Registro_Plugins<br/>- Configuracion<br/>- Sistema_Migraciones
            
            Backend->>Core: seedPerfiles(ssId, perfiles)
            Note over Core: Inserta 6 perfiles base<br/>desde payload JSON
            
            Backend->>Core: seedConfiguracion(ssId)
            Note over Core: Inserta config inicial
            
            Backend->>Backend: Guarda CORE_SS_ID<br/>en Properties
        end
        Backend-->>Frontend: { success: true, ssId, ssUrl }
        deactivate Backend
        
        Frontend->>Frontend: Guarda apiUrl y ssId<br/>en localStorage
    end

    rect rgb(240, 248, 255)
        Note over Frontend,Backend: Paso 3: Registro Super-Admin
        Admin->>Frontend: Ingresa username, password, auth factor
        Frontend->>Frontend: 1. Genera Master Key (MK)<br/>2. Deriva clave del password<br/>3. Cifra MK → wrapped_mk
        
        Frontend->>Backend: POST /exec action=register
        activate Backend
        Backend->>Core: createUser(username, wrapped_mk, perfilId)
        Core-->>Backend: Usuario creado
        deactivate Backend
        
        Backend-->>Frontend: { success: true, user }
        
        Frontend->>Backend: POST /exec action=login
        Backend-->>Frontend: { sessionToken, wrapped_mk }
        
        Frontend->>Frontend: Guarda sessionToken<br/>Inicia sesión
    end

    Note over Admin,Core: ✓ Instalación Completa

    Admin->>Frontend: Redirigido al Dashboard
    Frontend->>Core: Carga datos con sessionToken
    Core-->>Frontend: Datos del usuario y permisos
```

### Flujo Resumido

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FASE 1: PREPARACIÓN                              │
├─────────────────────────────────────────────────────────────────────┤
│  1. Crear proyecto Google Apps Script                              │
│  2. Pegar código de api.gs                                        │
│  3. Desplegar como Web App (Cualquiera)                           │
│  4. Obtener URL → https://script.google.com/.../exec              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    FASE 2: SETUP WIZARD                            │
├─────────────────────────────────────────────────────────────────────┤
│  Paso 1: Enlace de API                                            │
│  └─ Frontend valida conexión con backend                          │
│                              ↓                                      │
│  Paso 2: Crear GSheet Core                                        │
│  ├─ Frontend carga seed_perfiles.json                             │
│  ├─ POST install (nombreCongregacion, perfiles)                  │
│  ├─ Backend: createSpreadsheet → initCoreTables → seedPerfiles    │
│  └─ Backend retorna ssId                                          │
│                              ↓                                      │
│  Paso 3: Registro Super-Admin                                     │
│  ├─ Frontend genera Master Key                                    │
│  ├─ POST register (username, wrapped_mk)                         │
│  └─ POST login → Obtiene sessionToken                             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    ✓ INSTALACIÓN COMPLETA                          │
│  - GSheet Core creado con tablas y perfiles                       │
│  - Usuario admin registrado                                       │
│  - Sesión activa                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Fase 2: El Asistente de Configuración (Setup UI)
Cuando el frontend detecta que no hay `api` ni `ssId` en `localStorage`, lanza el **Setup Wizard**:

### Paso 1: Enlace de API
- **Input:** URL del Google Apps Script.
- **Acción:** El frontend realiza un `ping` (vía `doGet`) para validar la conexión.

### Paso 2: Creación del Orquestador (GSheet Core)
- **Opción A (Recomendada):** El frontend solicita al backend crear una nueva hoja mediante la acción `createSpreadsheet`. 
    - **Acción:** El backend ejecuta `SpreadsheetApp.create('CongreAdmin_Core')` y devuelve el `ssId`.
    - **Provisión:** El backend inicializa automáticamente las tablas `Usuarios`, `Perfiles`, `Registro_Plugins` y `Configuracion` con sus cabeceras mediante `initCoreTables`.
    - **Seed Data de Perfiles:** 
        - El frontend carga el archivo `backend/data/seed_perfiles.json` que contiene los perfiles base.
        - Los perfiles se envían en el payload de la acción `install` al backend.
        - Perfiles base injectados:
            *   `p_admin` - Super-Admin (Acceso total)
            *   `p_secretario` - Secretario (Gestión de personas y registros)
            *   `p_comite` - Comité de Servicio (Supervisión general)
            *   `p_super_grupo` - Superintendente de Grupo (Informes y atención de grupo)
            *   `p_siervo_territorios` - Siervo de Territorios (Gestión de territorios y mapas)
            *   `p_publicador` - Publicador (Acceso básico)
    - **Seed Data de Configuración:** Se injectan configuraciones iniciales (nombre congregación, idioma, año de servicio, versión).
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
