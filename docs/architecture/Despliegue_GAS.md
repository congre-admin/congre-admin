# Despliegue del Backend (Google Apps Script)

El backend de Congre-Admin está implementado en **Google Apps Script (GAS)** y se despliega usando **clasp** (CLI para GAS).

## Requisitos Previos

1. **Cuenta Google** con acceso al proyecto de Apps Script
2. **clasp instalado** (`npm install -g @google/clasp`)

## Configuración

### 1. Archivo `.clasp.json`

El proyecto ya tiene la configuración:

```json
{
  "scriptId": "1Wse1_PzTarnbnBediQTtU5wf5WW9hVc7wnIU9vRt2RTmSp-EIy06Jrx5",
  "rootDir": "src",
  "fileExtension": "gs"
}
```

### 2. Autenticación

```bash
cd frontend
npx @google/clasp login --no-localhost
```

Sigue las instrucciones en pantalla para autorizar acceso.

## Comandos Disponibles

Desde el directorio `frontend/`:

| Comando | Descripción |
|---------|-------------|
| `npm run clasp:status` | Ver archivos modificados localmente |
| `npm run clasp:push` | Subir código local al GAS |
| `npm run clasp:pull` | Descargar código del GAS a local |
| `npm run clasp:deploy` | Crear nueva versión deployada |
| `npm run clasp:open` | Abrir editor GAS en navegador |
| `npm run clasp:versions` | Listar versiones deployadas |
| `npm run clasp:list` | Listar proyectos clasp |

## Flujo de Trabajo Típico

### Opción 1: Pull → Editar → Push → Deploy

```bash
# 1. Descargar código actual desde GAS
npm run clasp:pull

# 2. Editar archivos en backend/src/api.gs

# 3. Subir cambios al GAS
npm run clasp:push

# 4. Deployar nueva versión
npm run clasp:deploy
```

### Opción 2: Editar local → Push → Deploy

```bash
# 1. Editar directamente en backend/src/api.gs

# 2. Ver qué archivos cambiarán
npm run clasp:status

# 3. Subir al GAS
npm run clasp:push

# 4. Deployar
npm run clasp:deploy
```

## Estructura de Archivos

```
backend/
├── .clasp.json        # Configuración (Script ID)
├── appsscript.json    # Manifiesto de GAS
└── src/
    └── api.gs         # Código principal del backend
```

## Notas

- El Script ID está configurado en `.clasp.json`
- `rootDir: "src"` indica que los archivos .gs están en `backend/src/`
- Después de `push`, se debe hacer `deploy` para que los cambios sean visibles

## Despliegue mediante el Agente AI

El agente AI puede ejecutar los comandos de clasp para desplegar el backend. Solo indica:

> "Despliega el backend a GAS" o "Haz push del código al GAS"

El agente ejecutará:
1. `npm run clasp:push` - Subir código
2. `npm run clasp:deploy` - Deployar versión

También puede ayudarte con:
- **Debugging**: Consultar y revisar el código actual
- **Cambios específicos**: Aplicar modificaciones en `backend/src/api.gs`
- **Estado**: Verificar qué archivos han cambiado

### Ejemplo de conversación

```
Usuario: Despliega los cambios del backend a GAS
Agente: Ejecutando npm run clasp:push...
       ✓ Archivos subidos
       Ejecutando npm run clasp:deploy...
       ✓ Versión deployada exitosamente
```

## Véase también

- [Backend.md](./Backend.md) - Implementación completa del API
- [Backend_API_Completa.md](./Backend_API_Completa.md) - Referencia técnica del API
- [Estructura_Proyecto.md](./Estructura_Proyecto.md) - Estructura general del proyecto
