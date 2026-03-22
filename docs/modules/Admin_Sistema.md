# Congre-Admin: Plug-in de Configuración del Sistema

Este módulo gestiona los ajustes globales del marco de trabajo, la administración del ecosistema de plug-ins, y las **herramientas de importación de datos asistidas por IA**.

## 1. Manifiesto del Módulo
-   **ID:** `admin_sistema`
-   **Sección:** `Administración`
-   **Icono:** `settings`
-   **Dependencias:** `[]`
-   **Navegación:**
    -   `{ "nombre": "Ajustes", "icono": "shield_lock", "ruta": "/configuracion", "publico": false }`
    -   `{ "nombre": "Importar datos", "icono": "shield_lock", "ruta": "/importacion", "publico": false }`
-   **Permisos:** `admin` (Secretario, Superintendentes).
-   **Tablas Requeridas:** `Sistema_Esquema`, `Registro_Plugins`, `Sistema_Migraciones`.
-   **Herramientas:**
    -   `{ "id": "importador-ia", "nombre": "Importador con IA", "descripcion": "Transforma datos externos con JSONata generado por IA" }`

## 2. Estructura de Datos

### 2.1. Esquema y Plugins
Se basa en la tabla maestra de **Esquemas** y el **Registro de Plug-ins** definidos en la [Arquitectura](../architecture/Arquitectura.md).

### 2.2. Registro de Migraciones/Importaciones

Tabla `Sistema_Migraciones` para auditar todas las importaciones:

```json
{
  "id": "import-2026-03-20-001",
  "tipo": "import",
  "tabla_destino": "Personas",
  "origen": "CSV (sistema externo)",
  "ejecutado_por": "usuario@congregacion.com",
  "ejecutado_at": "2026-03-20T10:00:00Z",
  "status": "success|partial|failed",
  "registros_totales": 150,
  "registros_importados": 145,
  "registros_saltados": 5,
  "errores": [
    {
      "fila": 23,
      "campo": "email",
      "mensaje": "Email inválido",
      "valor": "email-sin-arroba"
    }
  ],
  "query_jsonata": "[...query usado...]",
  "_v": 1,
  "_ts": "2026-03-20T10:00:00Z"
}
```

**Headers en GSheet:**
```
id | tipo | tabla_destino | origen | ejecutado_por | 
ejecutado_at | status | registros_totales | registros_importados | 
registros_saltados | errores | query_jsonata | _v | _ts
```

---

## 3. Flujo de Trabajo (Workflow)

### 3.1. Configuración Global
1.  **Configuración Global:** Ajuste de nombres de la congregación, zona horaria y preferencias visuales.
2.  **Marketplace de Plug-ins:** Instalación y vinculación de nuevos módulos mediante el Spreadsheet ID.
3.  **Mantenimiento de Esquema:** Actualización de cabeceras en Google Sheets cuando el esquema cambia.

### 3.2. Importación de Datos Asistida por IA

**Propósito:** Permitir a los usuarios importar datos desde sistemas externos (CSV, Excel, JSON) utilizando **IA generativa** para transformar los datos al formato de Congre-Admin mediante queries **JSONata**.

**Flujo Completo:**

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: EXPORTAR DATOS                                     │
│  Usuario exporta datos desde su sistema actual              │
│  - CSV, Excel, JSON                                         │
│  - Recomendar: 10-20 filas de muestra para IA               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 2: GENERAR QUERY CON IA                               │
│  Usuario copia prompt template + pega datos de muestra      │
│  - IA (ChatGPT/Claude) genera query JSONata                 │
│  - Usuario copia query generado                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 3: PROBAR TRANSFORMACIÓN                              │
│  Usuario pega query en Congre-Admin                         │
│  - Preview de 5 registros transformados                     │
│  - Validar que formato coincide con esquema                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 4: IMPORTAR DATOS                                     │
│  Usuario confirma importación                               │
│  - Batches de 50 registros                                  │
│  - Progreso visible                                         │
│  - Reporte de errores                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 5: REGISTRAR IMPORTACIÓN                              │
│  Sistema registra en Sistema_Migraciones                    │
│  - Log completo con errores                                 │
│  - Query JSONata usado                                      │
│  - Disponible para auditoría                                │
└─────────────────────────────────────────────────────────────┘
```

**Prompt Template para IA:**

El sistema DEBE proveer un prompt template predefinido que el usuario puede copiar y pegar en su IA preferida (ChatGPT, Claude, etc.):

```markdown
# Generar Query JSONata para Importación a Congre-Admin

## Contexto
Necesito transformar datos exportados al formato de Congre-Admin ([TABLA_DESTINO]).

## Datos de Entrada (Ejemplo)
[PEGAR AQUÍ 10-20 FILAS DE DATOS EXPORTADOS]

## Formato de Salida Esperado
[URL al esquema en docs/modules/]

## Reglas de Transformación

1. **IDs:** Si los datos de entrada tienen ID, usarlos. Si no, dejar como `null` (el sistema asignará UUID).
2. **Género:** Mapear "Male" → "H", "Female" → "M", "M" → "H", "F" → "M".
3. **Fechas:** Convertir a formato `YYYY-MM-DD`. Soportar formatos comunes: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD.
4. **Teléfonos:** Si hay múltiples, crear array de objetos `{ tipo, valor }`.
5. **Campos vacíos:** Omitir o usar `null`, no usar strings vacíos `""`.
6. **Etiquetas:** Si el sistema origen tiene "rol", "estado", etc., mapear a array `etiquetas`.
7. **Arrays:** Asegurar que el resultado sea un array de objetos, incluso si es un solo registro.

## Ejemplo de Salida Deseada

```json
{
  "id": "123",
  "identidad": {
    "nombre": "Juan",
    "enc_apellido": "",
    "nombreAbreviado": "J. Perez",
    "genero": "H",
    "fechaNacimiento": "1990-05-15"
  },
  "enc_contacto": {
    "telefonos": [
      { "tipo": "celular", "valor": "+54 9 11 1234-5678" }
    ],
    "email": "juan@email.com"
  },
  "enc_servicio": {
    "etiquetas": ["Publicador", "Bautizado"]
  },
  "_v": 1,
  "_ts": "2026-03-20T10:00:00Z",
  "_deleted": false
}
```

## Tarea

Genera un **query JSONata** que transforme los datos de entrada al formato de salida.

El query debe:
1. Ser válido en https://try.jsonata.org/
2. Manejar casos donde campos faltan (usar `~= null`, `$exists()`)
3. Usar funciones de JSONata para transformación de fechas si es necesario
4. Filtrar registros inválidos (sin nombre, por ejemplo)
5. Ser idempotente (mismo input → mismo output)

## Formato de Respuesta

```jsonata
[TU QUERY AQUÍ]
```
```

**Transformaciones JSONata Comunes:**

```jsonata
/* Conversión de fechas DD/MM/YYYY → YYYY-MM-DD */
$split(fecha, '/')[2] & '-' & $pad($split(fecha, '/')[1], 2) & '-' & $pad($split(fecha, '/')[0], 2)

/* Mapeo de género Male/Female → H/M */
sexo = 'Male' ? 'H' : (sexo = 'Female' ? 'M' : 'H')

/* IDs auto-generados si no existen */
id: id ~= null ? id : $string($random())

/* Teléfonos múltiples a array */
telefonos: [
  telefono1 ~= null ? { "tipo": "celular", "valor": telefono1 },
  telefono2 ~= null ? { "tipo": "casa", "valor": telefono2 }
] ~> $filter(function($v) { $v ~= null })
```

**Validación de Datos:**

- **Frontend (Preview):** Ejecutar query JSONata, mostrar preview de 5 registros, validar sintaxis
- **Backend (GAS):** Validar campos requeridos, formato de emails, fechas, IDs duplicados

**Manejo de Errores:**

| Error | Causa | Acción |
|-------|-------|--------|
| `Syntax error` | Query JSONata inválido | Mostrar línea/columna del error |
| `Campo requerido faltante` | Input no tiene campo obligatorio | Saltar fila, registrar error |
| `Email inválido` | Formato de email incorrecto | Saltar fila, registrar error |
| `ID duplicado` | ID ya existe en tabla destino | Saltar fila, registrar error |

**Límites de Importación:**

| Límite | Valor | Rationale |
|--------|-------|-----------|
| **Batch size** | 50 registros | Evitar timeout de 6 min en GAS |
| **Preview** | 5 registros | Suficiente para validar, no abrumar |
| **Archivo máximo** | 1000 registros | Sugerir dividir archivos grandes |
| **Timeout** | 5 minutos | Límite seguro antes de 6 min de GAS |

---

## 4. Especificación de Interfaces

### 4.1. Panel de Configuración
-   **Panel de Plugins:** Lista de módulos instalados con opción de activar/desactivar y configurar su almacenamiento.
-   **Consola de Esquema:** Editor JSON para la tabla `Sistema_Esquema` (solo nivel experto).
-   **Ajustes Visuales:** Selector de colores corporativos y carga de logotipos SVG.

### 4.2. Herramienta de Importación

**Componente Principal:** `JsonataImporter`

**Stepper de 4 Pasos:**

```
┌─────────────────────────────────────────────────────────────┐
│  [1] Exportar  →  [2] Generar  →  [3] Probar  →  [4] Importar│
└─────────────────────────────────────────────────────────────┘
```

**Paso 1: Exportar**
- Textarea para pegar datos (CSV/JSON)
- Botón "Continuar" (habilitado si hay datos)

**Paso 2: Generar**
- Prompt template (copiable al portapapeles)
- Links a IA (ChatGPT, Claude, JSONata Tester)
- Textarea para pegar query JSONata generado
- Botones "Atrás" / "Continuar"

**Paso 3: Probar**
- Botón "Probar transformación"
- Preview de 5 registros transformados
- Alert de errores de sintaxis
- Botones "Atrás" / "Continuar"

**Paso 4: Importar**
- Botón "Iniciar importación"
- Progress bar (0-100%)
- Resultado final (importados, saltados, errores)
- Botón "Atrás" / "Cerrar"

### 4.3. Log de Importaciones

**Vista:** Lista de importaciones realizadas con filtros por:
- Fecha
- Tabla destino
- Estado (success/partial/failed)

**Detalle:** Al hacer clic en una importación, mostrar:
- Query JSONata usado
- Errores detallados
- Opción de reintentar (con mismo query)

---

## 5. Reglas de Negocio (JSONata)

### 5.1. Validación de Plug-in
```jsonata
$exists(registro_plugins[id = $nuevo_id]) = false
```

### 5.2. Validación de Importación
```jsonata
/* Filtrar registros sin nombre */
[$exists(nombre) and nombre ~= null]

/* Filtrar emails inválidos */
[email ~= null ? email ~> $match("^[^\s@]+@[^\s@]+\.[^\s@]+$") ~= null : false]

/* Filtrar fechas inválidas */
[fecha_nacimiento ~= null ? fecha_nacimiento ~> $match("^\d{4}-\d{2}-\d{2}$") ~= null : true]
```

### 5.3. Registro de Importación
```jsonata
{
  "id": 'import-' & $now('[Y0001]-[M01]-[D01]') & '-' & $string($random()),
  "tipo": "import",
  "tabla_destino": $tablaDestino,
  "origen": $origen,
  "ejecutado_por": $usuarioActual,
  "ejecutado_at": $now(),
  "status": $importados > 0 and $errores = 0 ? 'success' : ($importados > 0 ? 'partial' : 'failed'),
  "registros_totales": $count($datos),
  "registros_importados": $importados,
  "registros_saltados": $saltados,
  "errores": $errores,
  "query_jsonata": $query,
  "_v": 1,
  "_ts": $now()
}
```

---

## 6. Consideraciones de Seguridad

### 6.1. Validación de Datos Sensibles
- **Regla:** NUNCA confiar en datos de entrada sin validar.
- **Implementación:**
  - Validar emails con regex
  - Validar fechas con formato estricto
  - Sanitizar strings (prevenir XSS si se renderizan)
  - No permitir campos `enc_` en datos de entrada (se cifran después)

### 6.2. Auditoría
- Toda importación DEBE registrarse en `Sistema_Migraciones`
- El registro DEBE incluir query JSONata usado
- El registro DEBE incluir errores detallados
- Los registros DEBEN ser inmutables (no editar, solo agregar)

---

## 7. Ejemplos de Uso

### 7.1. Escenario 1: Importar 50 Personas desde CSV
**Contexto:** Secretario exporta datos de sistema anterior (CSV).

**Pasos:**
1. Exporta CSV desde sistema anterior
2. Copia primeras 20 filas
3. Pega prompt template + datos en ChatGPT
4. Copia query JSONata generado
5. Pega datos completos en Congre-Admin
6. Pega query JSONata
7. Prueba transformación (preview de 5 registros)
8. Confirma importación
9. Revisa resultado: 48 importados, 2 saltados (emails inválidos)
10. Corrige CSV con emails válidos
11. Re-importa solo registros fallidos

### 7.2. Escenario 2: Migración Masiva desde Excel
**Contexto:** Congregación grande (500+ registros) migra desde Excel.

**Pasos:**
1. Exporta Excel a CSV (mejor compatibilidad)
2. Divide en 5 archivos de 100 registros (recomendado)
3. Genera query JSONata con primer archivo
4. Prueba con 10 registros
5. Importa archivo 1 (100 registros)
6. Verifica resultado en Sistema_Migraciones
7. Repite para archivos 2-5
8. Valida total: 500 registros importados

### 7.3. Escenario 3: Importación Recurrente
**Contexto:** Superintendente importa reportes mensuales.

**Pasos:**
1. Primera vez: Genera query JSONata (se guarda)
2. Mes siguiente: Reusa mismo query
3. Solo cambia datos de entrada
4. Importa directamente (sin generar query de nuevo)

**Ventaja:** Query JSONata es reusable — una vez generado, sirve para futuras importaciones del mismo formato.

---

## 8. Referencias

| Documento | Propósito |
|-----------|-----------|
| [`docs/modules/Personas.md`](./Personas.md) | Esquema de Personas |
| [`docs/architecture/Migraciones.md`](../architecture/Migraciones.md) | Estrategia de migraciones |
| [`docs/architecture/Backend.md`](../architecture/Backend.md) | API del backend |
| [JSONata Documentation](https://docs.jsonata.org/) | Referencia de JSONata |
| [JSONata Tester](https://try.jsonata.org/) | Herramienta para probar queries |

---

**Version:** 1.1.0  
**Last Updated:** 2026-03-20

**Este documento es parte de la especificación oficial de Congre-Admin.**
