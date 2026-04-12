# Manual del Administrador

Guía completa para administradores de CongreAdmin.

---

## Introducción

### ¿Quién es administrador?

El administrador es un inmue seleccionado para gestionar la información de la congregación. Tiene acceso completo al sistema y puede:

- Gestionar personas
- Programar reuniones
- Publicar anuncios
- Configurar opciones
- Gestionar otros usuarios

### Requisitos Previos

- Tener una cuenta de usuario creada
-Tener acceso a la hoja de cálculo de Google Sheets
- Conocimiento básico de Google Sheets

---

## Acceso al Sistema

### Iniciar Sesión

1. Ve a `/tu-dominio.com/admin`
2. Ingresa tu **usuario** y **contraseña**
3. Si está habilitado, completa la autenticación de dos factores (TOTP o passkey)

### Cerrar Sesión

1. En el menú inferior, ve a **Usuario**
2. Selecciona **Cerrar sesión**
3. Confirma la acción

---

## Estructura del Menú

### Menú Superior (cuando estás logueado)

- **Tablero**: Dashboard principal
- **Personas**: Registro de miembros
- **Reuniones**: Programación
- **Anuncios**: publicar actualizaciones
- **Predicación**: Gestionar territorios

### Menú Inferior

#### Sección: Configuración

- **Módulos**: Activar/desactivar funciones
- **Usuarios**: Gestionar cuentas
- **Congregación**: Ajustes generales
- **Respaldo**: Exportar datos

#### Sección: Usuario

- **Autenticación**: Cambiar password/2FA
- **Cerrar sesión**: Terminar sesión

---

## Módulos del Sistema

### 1. Tablero

El dashboard muestra:

- Resumen de personas
- Próximas reuniones
- Anuncios recientes
- Estadísticas básicas

### 2. Personas

Gestión del registro de miembros.

#### Agregar Persona

1. Ve a **Personas**
2. Click en **Agregar**
3. Completa los campos:
   - Nombre
   - Apellido
   - Teléfono (opcional)
   - Email (opcional)
   - Grupo (opcional)
   - Notas (opcional)
4. Click en **Guardar**

#### Editar Persona

1. Busca la persona en la lista
2. Click en el registro
3. Modifica los datos
4. Click en **Guardar**

#### Eliminar Persona

1. Busca la persona
2. Click en el registro
3. Click en **Eliminar** (marcador lógico, no se borra)

#### Buscar y Filtrar

- Usa la barra de búsqueda para filtrar por nombre
- Los filtros adicionales variarán selon le module

### 3. Reuniones

Programación de reuniones.

#### Agregar Reunión

1. Ve a **Reuniones**
2. Click en **Agregar**
3. Completa:
   - Tipo (semanal, campo, especial)
   - Título
   - Fecha y hora
   - Lugar
   - Descripción
4. **Guardar**

#### Ver Calendario

Las reuniones aparecen en formato de lista.期货

### 4. Anuncios

Publicar actualizaciones.

#### Crear Anuncio

1. Ve a **Anuncios**
2. Click en **Nuevo Anuncio**
3. Escribe el título y contenido
4. Selecciona fecha de publicación
5. **Publicar**

#### Anuncios Activos

Los anuncios activos aparecen en la página pública. Puedes despublicar cuando ya no sean relevantes.

### 5. Predicación

Gestión de predicación pública y territorios.

#### Territorial

- Ver territorios
- Asignar familias
- Registrar visitas

#### Público

- Programar grupos
- Registrar presentaciones

---

## Configuración

### Configuración de Congregación

Ubicación: **Configuración → Congregación**

| Campo | Descripción |
|-------|-------------|
| Nombre de la congregación | Nombre oficial |
| Número | Número de congregación |
| Ciudad | Ciudad |
| Provincia | Provincia/Estado |
| Tema de color | Color principal del sitio |
| Icono | Imagen o emoji |

### Gestión de Usuarios

Ubicación: **Configuración → Usuarios**

#### Crear Usuario

1. Click en **Agregar usuario**
2. Ingresa:
   - Nombre de usuario
   - Email
   - Rol (admin/usuario)
3. Se enviará un enlace para configurar password

#### Editar Usuario

1. Busca el usuario
2. Modifica rol o datos
3. **Guardar**

#### Restablecer Password

1. Busca el usuario
2. Click en **Restablecer**
3. El usuario recibirá un email

### Respaldo

Ubicación: **Configuración → Respaldo**

Exporta todos los datos en formato CSV.

1. Click en **Exportar todo**
2. Selecciona ubicación
3. Guardar

---

## Autenticación y Seguridad

### Cambiar Contraseña

1. Ve a **Usuario → Autenticación**
2. Ingresa password actual
3. Ingresa nuevo password
4. Confirma nuevo password
5. **Guardar**

### Autenticación de Dos Factores (2FA)

#### Configurar TOTP

1. Ve a **Usuario → Autenticación**
2. Click en **Habilitar TOTP**
3. Escanea el código QR con tu app de autenticación
4. Ingresa el código de 6 dígitos
5. **Verificar y guardar**

#### Configurar Passkey

1. Ve a **Usuario → Autenticación**
2. Click en **Agregar passkey**
3. Sigue las instrucciones del navegador
4. Confirma con tu método (huella, face, etc.)

---

## Configurar Hoja Pública

### qué es la hoja pública?

La hoja pública permet que cualquier persona vea información sin login.

### Configurar

1. Ve a **Configuración → Congregación**
2. En "Hoja pública", ingresa el ID de la hoja pública
3. **Guardar**

### qué campos son públicos?

Los campos marcados como públicos se sincronizan automáticamente. Por defecto:

- Nombre a mostrar
- Ciudad
- Provincia
- Nombre de congregación
- Número
- Theme
- Icono

---

## Solución de Problemas

### No puedo iniciar sesión

- Verifica tu usuario y password
- ¿Olvidaste tu password? Solicita help
- ¿Activaste 2FA? Ingresa el código

### No veo los datos

- Verifica tu conexión a internet
- Confirma que la hoja de cálculo Existe
- Consulta con el administrador anterior

### Error al guardar

- Revisa los campos obligatorios
- Verifica que la hoja no esté bloqueada

### La página pública no carga

- Confirma que el ID de hoja pública Sea correcto
- Verifica que la hoja esté compartida como "Cualquiera con el enlace"

---

## Contacto y Soporte

### ¿Necesitas ayuda?

1. Consulta esta guía
2. Contacta al administrator del sistema
3. Reporta errores cuando Detectado

### Información del Sistema

Para reportar un problema, incluye:

- Pasos para reproducir
- Mensaje de error (si hay)
- Navegador y dispositivo us
- Captura de pantalla

---

¡Gracias por administrar CongreAdmin!