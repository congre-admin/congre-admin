# Congre-Admin: Matriz de Permisos y Roles

Esta matriz define el control de acceso granular (RBAC) para todos los módulos del sistema.

## 1. Definición de Roles

- **Administrador (`admin`)**: Acceso total al Core y a todos los plugins vinculados. Puede gestionar usuarios y configuraciones de seguridad.
- **Usuario Registrado (`user`)**: Puede ver y editar datos operativos (Reuniones, Predicación), pero no tiene acceso a la configuración del sistema ni a la edición masiva de personas (según el plugin).
- **Espectador (`viewer`)**: Acceso de solo lectura a los plugins autorizados.
- **Invitado (`public`)**: Solo accede a datos sanitizados (sin campos `enc_`) y solo a vistas marcadas como públicas.

## 2. Matriz de Acciones por Módulo

| Módulo | Acción | Admin | User | Viewer | Public |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Core** | Gestionar Usuarios | ✅ | ❌ | ❌ | ❌ |
| **Core** | Vincular Plugins | ✅ | ❌ | ❌ | ❌ |
| **Personas** | Ver Lista | ✅ | ✅ | ✅ | ❌ |
| **Personas** | Editar Ficha | ✅ | ⚠️¹ | ❌ | ❌ |
| **Personas** | Exportar (MK) | ✅ | ❌ | ❌ | ❌ |
| **Reuniones** | Confeccionar Programa | ✅ | ✅ | ❌ | ❌ |
| **Reuniones** | Ver Programa | ✅ | ✅ | ✅ | ✅ |
| **Predicación** | Asignar Territorios | ✅ | ✅ | ❌ | ❌ |
| **Predicación** | Ver Mapa Público | ✅ | ✅ | ✅ | ✅ |

*¹ **Nota:** El rol `user` puede tener permiso para editar campos de contacto pero no etiquetas de servicio (configurable en el esquema).*

## 3. Acceso Basado en Contexto (Filtrado por PersonaId)
Cuando un usuario está vinculado a una entidad mediante `personaId`, el sistema aplica reglas de visibilidad dinámica:

- **Propiedad de Grupo:** Los perfiles con alcance limitado (ej: `Superintendente de Grupo`) solo pueden ver y editar registros cuyos metadatos coincidan con los de su propia ficha de persona (ej: mismo `grupoId`).
- **Auto-Consulta:** Cualquier usuario puede acceder a su propia ficha de persona descifrada para consultar sus asignaciones personales y territorios.

## 4. Seguridad de Campos (Nivel de Atributo)
El sistema debe filtrar los campos basándose en el prefijo `enc_`:
- **Si el usuario no tiene una sesión válida (Public):** El backend DEBE omitir todos los campos `enc_`.
- **Si el usuario tiene sesión:** El frontend descifra los campos `enc_` usando la Master Key.
