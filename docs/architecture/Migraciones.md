# Congre-Admin: Estrategia de Migración de Esquemas

**Version:** 1.1.0  
**Last Updated:** 2026-03-20

---

## Overview

Este documento define la estrategia para evolucionar los esquemas de datos del sistema **sin perder información existente ni requerir downtime**, utilizando **exclusivamente las herramientas del backend GAS**.

**Importante:** Este es un sitio estático (GitHub Pages). No hay servidor Node.js para ejecutar scripts de migración. Todas las migraciones se ejecutan a través de **Google Apps Script**.

---

## Arquitectura de Migración (Static Site + GAS)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Estático)                      │
│  - React App (GitHub Pages)                                 │
│  - Sin capacidad de ejecutar migraciones                    │
│  - Solo lee/escribe datos vía API                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS POST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (GAS)                            │
│  - api.gs                                                   │
│  - Ejecuta migraciones vía doGet/doPost                     │
│  - Acceso directo a Google Sheets                           │
│  - CacheService para rate limiting                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATOS (GSheets)                          │
│  - Sistema_Migraciones (registro)                           │
│  - Personas, Reuniones, etc. (datos)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Tipos de Cambios de Schema

### 1. Cambios Backward-Compatible (SAFE) — Sin Migración Requerida

**Definición:** Un cambio es backward-compatible si los datos existentes siguen siendo válidos sin modificación.

| Cambio | Ejemplo | Risk | Acción Requerida |
|--------|---------|------|-----------------|
| **Agregar campo opcional** | `fechaNacimiento?: string` | ✅ Low | `initSheet` con `preserveExisting: true` |
| **Agregar campo con default** | `estado: string = 'activo'` | ✅ Low | Default en frontend (on read) |
| **Agregar campo nullable** | `segundoNombre: string \| null` | ✅ Low | `initSheet` con `preserveExisting: true` |
| **Extender enum** | `genero: 'H' \| 'M' \| 'X'` | ✅ Low | Sin acción |

**Proceso:**
```
1. Actualizar tipos TypeScript en frontend
2. Ejecutar action `initSheet` vía API con preserveExisting: true
3. Datos antiguos usan undefined/default hasta edición
4. Documentar en CHANGELOG.md
```

**Ejemplo de llamada API:**
```javascript
// Desde la consola del navegador o script externo
fetch('https://script.google.com/macros/s/[SCRIPT_ID]/exec', {
  method: 'POST',
  body: JSON.stringify({
    action: 'initSheet',
    ssId: '[CORE_SHEET_ID]',
    sheet: 'Personas',
    headers: ['id', 'identidad', 'fechaNacimiento', 'enc_contacto', '_v', '_ts', '_deleted'],
    preserveExisting: true
  })
});
```

---

### 2. Cambios No Compatibles (BREAKING) — Requieren Migración GAS

**Definición:** Un cambio es breaking si los datos existentes pueden volverse inválidos o inaccesibles.

| Cambio | Ejemplo | Risk | Migración Required |
|--------|---------|------|-------------------|
| **Eliminar campo** | Remover `enc_apellido` | 🔴 Critical | Sí (data mapping) |
| **Renombrar campo** | `nombre` → `primerNombre` | 🔴 High | Sí (data copy) |
| **Cambiar tipo** | `edad: number` → `edad: string` | 🔴 High | Sí (data transform) |
| **Hacer required sin default** | `fechaBautismo: string` (era optional) | 🟡 Medium | Sí (backfill) |

**Proceso:**
```
1. Crear función de migración en api.gs (o archivo .gs separado)
2. Ejecutar migración vía trigger o llamada API
3. Registrar en Sistema_Migraciones
4. Actualizar frontend types
5. Documentar en CHANGELOG.md
```

---

## Migraciones en GAS (Google Apps Script)

### Estructura de Migración GAS

```javascript
/**
 * Migración 001: Agregar fechaNacimiento a Personas
 * 
 * Objetivo: Backfill de fechaNacimiento = '1900-01-01' para registros sin valor
 * Impacto: ~150 registros en producción
 * Rollback: Restaura a undefined (pierde datos backfilled)
 * 
 * @returns {Object} {success: boolean, affected: number, errors: string[]}
 */
function migrate001_addBirthdateToPersonas() {
  const result = {
    success: false,
    affected: 0,
    errors: []
  };

  try {
    const ss = SpreadsheetApp.openById(CORE_SHEET_ID);
    const sheet = ss.getSheetByName('Personas');
    
    if (!sheet) {
      throw new Error('Hoja Personas no encontrada');
    }
    
    // 1. Obtener todos los datos
    const data = getSheetData(sheet); // Función existente en api.gs
    
    // 2. Filtrar registros que necesitan migración
    const needMigration = data.filter(p => !p.identidad?.fechaNacimiento);
    
    Logger.log(`Migrando ${needMigration.length} de ${data.length} registros`);
    
    // 3. Migrar en batches (GAS tiene límites de escritura)
    const BATCH_SIZE = 50;
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idIndex = headers.indexOf('id');
    
    for (let i = 0; i < needMigration.length; i += BATCH_SIZE) {
      const batch = needMigration.slice(i, i + BATCH_SIZE);
      
      batch.forEach(persona => {
        // Encontrar fila por ID
        const rowIndex = findRowById(sheet, persona.id, idIndex);
        
        if (rowIndex > 0) {
          // Actualizar campo fechaNacimiento dentro del JSON identidad
          const identidadObj = persona.identidad || {};
          identidadObj.fechaNacimiento = '1900-01-01';
          
          // Actualizar celda
          const identidadIndex = headers.indexOf('identidad');
          sheet.getRange(rowIndex, identidadIndex + 1).setValue(JSON.stringify(identidadObj));
          
          // Actualizar _v y _ts
          const vIndex = headers.indexOf('_v');
          const tsIndex = headers.indexOf('_ts');
          sheet.getRange(rowIndex, vIndex + 1).setValue((persona._v || 0) + 1);
          sheet.getRange(rowIndex, tsIndex + 1).setValue(new Date().toISOString());
          
          result.affected++;
        }
      });
      
      Logger.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} completado`);
      Utilities.sleep(100); // Evitar rate limiting
    }
    
    result.success = true;
    Logger.log(`Migración completada: ${result.affected} registros`);
    
    // 4. Registrar migración
    registerMigration('001-add-birthdate', result);
    
  } catch (error) {
    result.errors.push(error.message);
    Logger.error('Error en migración 001:', error);
  }
  
  return result;
}

/**
 * Rollback de migración 001
 * ADVERTENCIA: Pierde los datos backfilled
 */
function rollback001_addBirthdateToPersonas() {
  try {
    const ss = SpreadsheetApp.openById(CORE_SHEET_ID);
    const sheet = ss.getSheetByName('Personas');
    const data = getSheetData(sheet);
    
    const needRollback = data.filter(
      p => p.identidad?.fechaNacimiento === '1900-01-01'
    );
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idIndex = headers.indexOf('id');
    
    needRollback.forEach(persona => {
      const rowIndex = findRowById(sheet, persona.id, idIndex);
      
      if (rowIndex > 0) {
        const identidadObj = persona.identidad || {};
        delete identidadObj.fechaNacimiento;
        
        const identidadIndex = headers.indexOf('identidad');
        sheet.getRange(rowIndex, identidadIndex + 1).setValue(JSON.stringify(identidadObj));
        
        const vIndex = headers.indexOf('_v');
        sheet.getRange(rowIndex, vIndex + 1).setValue((persona._v || 0) + 1);
        sheet.getRange(rowIndex, tsIndex + 1).setValue(new Date().toISOString());
      }
    });
    
    Logger.log(`Rollback completado: ${needRollback.length} registros`);
    return { success: true, affected: needRollback.length };
    
  } catch (error) {
    Logger.error('Error en rollback:', error);
    return { success: false, affected: 0, note: error.message };
  }
}
```

---

## Tabla Sistema_Migraciones

**Ubicación:** GSheet Core, hoja `Sistema_Migraciones`

**Headers:**
```
id | executed_at | status | rows_affected | errors | _v | _ts
```

**Función de Registro (en api.gs):**
```javascript
/**
 * Registra migración ejecutada en Sistema_Migraciones
 */
function registerMigration(migrationId, result) {
  const ss = SpreadsheetApp.openById(CORE_SHEET_ID);
  let sheet = ss.getSheetByName('Sistema_Migraciones');
  
  if (!sheet) {
    sheet = ss.insertSheet('Sistema_Migraciones');
    sheet.appendRow(['id', 'executed_at', 'status', 'rows_affected', 'errors', '_v', '_ts']);
  }
  
  sheet.appendRow([
    migrationId,
    new Date().toISOString(),
    result.success ? 'success' : 'failed',
    result.affected || 0,
    JSON.stringify(result.errors),
    1,
    new Date().toISOString()
  ]);
}
```

---

## Ejecución de Migraciones

### Opción 1: Trigger Manual desde GAS Console

1. Abrir Google Apps Script editor
2. Agregar función de migración al proyecto
3. Seleccionar función desde dropdown
4. Click en "Run"
5. Ver logs en Execution transcript

### Opción 2: Llamada API Externa

```javascript
// Script externo o consola del navegador
fetch('https://script.google.com/macros/s/[SCRIPT_ID]/exec', {
  method: 'POST',
  body: JSON.stringify({
    action: 'migrate',
    migrationId: '001-add-birthdate'
  })
})
.then(r => r.json())
.then(console.log);
```

**En api.gs:**
```javascript
function doPost(e) {
  const postData = JSON.parse(e.postData.contents);
  
  if (postData.action === 'migrate') {
    const migrationId = postData.migrationId;
    
    if (migrationId === '001-add-birthdate') {
      return createResponse(migrate001_addBirthdateToPersonas());
    }
    // ... más migraciones
  }
}
```

### Opción 3: Time-Driven Trigger (Para Migraciones Programadas)

```javascript
/**
 * Ejecuta migraciones pendientes automáticamente
 * Se ejecuta diariamente a las 3 AM
 */
function runPendingMigrations() {
  const pendingMigrations = ['001-add-birthdate']; // Lista de migraciones pendientes
  
  pendingMigrations.forEach(migrationId => {
    if (migrationId === '001-add-birthdate') {
      migrate001_addBirthdateToPersonas();
    }
  });
}

// Configurar trigger:
// Edit → Current project's triggers → Add trigger
// Function: runPendingMigrations
// Event source: Time-driven
// Type: Day timer (3am-4am)
```

---

## Backup Manual (Pre-Migración)

**Importante:** Sin Node.js, el backup es manual via Google Sheets UI.

### Proceso de Backup:

1. **Abrir GSheet Core** en navegador
2. **File → Download → Microsoft Excel (.xlsx)** o **Comma Separated Values (.csv)**
3. **Guardar** con timestamp: `CongreAdmin_Core_Backup_2026-03-20.xlsx`
4. **Repetir** para cada GSheet del sistema (Personas, Reuniones, etc.)

### Backup Automatizado (Opcional - GAS Script):

```javascript
/**
 * Exporta backup de todas las hojas a Google Drive
 */
function createBackup() {
  const ss = SpreadsheetApp.openById(CORE_SHEET_ID);
  const timestamp = Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd_HH-mm-ss');
  const folder = DriveApp.getFolderById(BACKUP_FOLDER_ID);
  
  ss.getSheets().forEach(sheet => {
    const csv = exportSheetToCsv(sheet);
    const blob = Utilities.newBlob(csv, 'text/csv', `${sheet.getName()}_${timestamp}.csv`);
    folder.createFile(blob);
  });
  
  Logger.log('Backup completado');
}

function exportSheetToCsv(sheet) {
  const data = sheet.getDataRange().getValues();
  return data.map(row => row.join(',')).join('\n');
}
```

---

## Checklist de Migración (Static Site + GAS)

### Pre-Migración

- [ ] Tipo de cambio identificado (backward-compatible / breaking)
- [ ] Impacto evaluado (contar registros en GSheet)
- [ ] Función de migración creada en api.gs (si breaking)
- [ ] Rollback plan definido (si breaking)
- [ ] **Backup manual ejecutado** (Download → .xlsx)
- [ ] Función testeada en copia del GSheet (staging)

### Durante Migración

- [ ] Ejecutar función desde GAS Console o vía API
- [ ] Monitorear logs (View → Executions)
- [ ] Verificar resultado
- [ ] Registrar en `Sistema_Migraciones`

### Post-Migración

- [ ] Validar integridad de datos (abrir GSheet, verificar filas)
- [ ] Actualizar tipos TypeScript en frontend
- [ ] Documentar en CHANGELOG.md

---

## Ejemplos de Migraciones GAS

### Ejemplo 1: Agregar Campo Opcional (Backward-Compatible)

**No requiere migración de datos.** Solo actualizar initSheet:

```javascript
// En api.gs o script de despliegue
function initPersonasSheet() {
  const ss = SpreadsheetApp.openById(CORE_SHEET_ID);
  let sheet = ss.getSheetByName('Personas');
  
  if (!sheet) {
    sheet = ss.insertSheet('Personas');
    sheet.appendRow(['id', 'identidad', 'enc_contacto', 'enc_servicio', '_v', '_ts', '_deleted']);
  } else {
    // Agregar columna fechaNacimiento si no existe
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (!headers.includes('fechaNacimiento')) {
      sheet.appendRow([headers.length + 1]); // Nueva columna vacía
      sheet.getRange(1, headers.length + 1).setValue('fechaNacimiento');
    }
  }
}
```

---

### Ejemplo 2: Backfill de Datos (Breaking)

Ver función `migrate001_addBirthdateToPersonas` arriba.

---

### Ejemplo 3: Renombrar Campo (Breaking)

```javascript
/**
 * Migración 002: Copiar campo nombre → primerNombre
 * Mantener ambos campos durante período de transición (30 días)
 */
function migrate002_copyNombreToPrimerNombre() {
  const ss = SpreadsheetApp.openById(CORE_SHEET_ID);
  const sheet = ss.getSheetByName('Personas');
  const data = getSheetData(sheet);
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idIndex = headers.indexOf('id');
  const identidadIndex = headers.indexOf('identidad');
  
  let affected = 0;
  
  data.forEach(persona => {
    if (persona.identidad?.nombre && !persona.identidad.primerNombre) {
      const rowIndex = findRowById(sheet, persona.id, idIndex);
      
      if (rowIndex > 0) {
        const identidadObj = { ...persona.identidad };
        identidadObj.primerNombre = identidadObj.nombre;
        
        sheet.getRange(rowIndex, identidadIndex + 1).setValue(JSON.stringify(identidadObj));
        affected++;
      }
    }
  });
  
  Logger.log(`Migración 002 completada: ${affected} registros`);
  registerMigration('002-copy-nombre-to-primer-nombre', { success: true, affected });
}
```

---

## Reglas de Oro (Static Site + GAS)

| ID | Regla | Descripción |
|----|-------|-------------|
| **M-01** | NUNCA eliminar campos sin período deprecated | Mínimo 30 días de advertencia |
| **M-02** | SIEMPRE usar campos opcionales o con default | En cambios backward-compatible |
| **M-03** | Migraciones breaking DEBEN tener rollback | Plan de reversa obligatorio |
| **M-04** | Migraciones DEBEN ser idempotentes | Pueden ejecutarse N veces sin daño |
| **M-05** | Migraciones DEBEN loguearse | En `Sistema_Migraciones` |
| **M-06** | **NUNCA migrar sin backup manual** | Download → .xlsx antes de producción |
| **M-07** | SIEMPRE probar en copia del GSheet primero | Staging = copia del spreadsheet |
| **M-08** | Documentar en CHANGELOG | Toda migración debe estar documentada |
| **M-09** | Respetar límites de GAS | 6 min execution time, batch writes |
| **M-10** | Usar Utilities.sleep() | Evitar rate limiting en batches |

---

## Límites de GAS a Considerar

| Límite | Valor | Impacto en Migraciones |
|--------|-------|----------------------|
| Execution time | 6 minutos (consumer) | Migraciones grandes requieren batches |
| Read/write celdas | ~100k por ejecución | Batch operations necesarias |
| UrlFetch calls | 20k/día (consumer) | Limitado para migraciones externas |
| CacheService | 10 min TTL | Usar para rate limiting |

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.1.0 | 2026-03-20 | Corregido para arquitectura static site + GAS |
| 1.0.0 | 2026-03-20 | Initial migration strategy (Node.js - incorrecto) |

---

**Este documento es parte de la arquitectura oficial de Congre-Admin.**

---

## Principios de Migración

| Principio | Descripción |
|-----------|-------------|
| **Cero Data Loss** | NUNCA se pierden datos durante una migración |
| **Backward Compatibility** | Los cambios deben ser compatibles hacia atrás siempre que sea posible |
| **Lazy Migration** | Los datos se migran gradualmente al accederse/editarse |
| **Explicit Breaking Changes** | Los cambios no compatibles requieren migración explícita y aprobación |
| **Idempotency** | Las migraciones pueden ejecutarse múltiples veces sin daño |
| **Rollback Plan** | Toda migración breaking debe tener plan de reversa |

---

## Tipos de Cambios de Schema

### 1. Cambios Backward-Compatible (SAFE)

**Definición:** Un cambio es backward-compatible si los datos existentes siguen siendo válidos sin modificación.

| Cambio | Ejemplo | Risk | Migración Required |
|--------|---------|------|-------------------|
| **Agregar campo opcional** | `fechaNacimiento?: string` | ✅ Low | No (lazy migration) |
| **Agregar campo con default** | `estado: string = 'activo'` | ✅ Low | No (default on read) |
| **Agregar campo nullable** | `segundoNombre: string \| null` | ✅ Low | No |
| **Extender enum** | `genero: 'H' \| 'M' \| 'X'` | ✅ Low | No |

**Proceso:**
```
1. Actualizar tipos TypeScript
2. Ejecutar initSheet con preserveExisting: true
3. Datos antiguos usan undefined/default hasta edición
4. Documentar en CHANGELOG.md
```

---

### 2. Cambios No Compatibles (BREAKING)

**Definición:** Un cambio es breaking si los datos existentes pueden volverse inválidos o inaccesibles.

| Cambio | Ejemplo | Risk | Migración Required |
|--------|---------|------|-------------------|
| **Eliminar campo** | Remover `enc_apellido` | 🔴 Critical | Sí (data mapping) |
| **Renombrar campo** | `nombre` → `primerNombre` | 🔴 High | Sí (data copy) |
| **Cambiar tipo** | `edad: number` → `edad: string` | 🔴 High | Sí (data transform) |
| **Hacer required sin default** | `fechaBautismo: string` (era optional) | 🟡 Medium | Sí (backfill) |
| **Cambiar estructura** | `direccion: string` → `direccion: { calle, numero }` | 🔴 High | Sí (data transform) |

**Proceso:**
```
1. Crear script de migración (scripts/migrations/)
2. Ejecutar en staging
3. Backup de datos
4. Ejecutar migración en producción
5. Actualizar tipos TypeScript
6. Ejecutar initSheet con nuevas columnas
7. Verificar integridad
8. Documentar en CHANGELOG.md
```

---

## Proceso de Migración (Paso a Paso)

### Fase 1: Planificación

**Checklist:**

- [ ] Identificar tipo de cambio (backward-compatible vs breaking)
- [ ] Evaluar impacto (cuántos registros afectados)
- [ ] Definir estrategia de migración
- [ ] Estimar tiempo de ejecución
- [ ] Definir rollback plan (si breaking)
- [ ] Crear ticket de migración

**Template de Plan:**

```markdown
## Plan de Migración: [Nombre]

### Schema Change
- **Tabla:** [Nombre de tabla]
- **Cambio:** [Descripción del cambio]
- **Tipo:** Backward-Compatible / Breaking

### Impacto
- **Registros afectados:** [Count]
- **Downtime estimado:** [Tiempo]
- **Riesgo:** Low / Medium / High

### Migración
```javascript
// Script o descripción del proceso
```

### Rollback Plan
[Descripción de cómo revertir si falla]

### Aprobaciones
- [ ] Tech Lead
- [ ] DB Admin (si aplica)
```

---

### Fase 2: Desarrollo (Backward-Compatible)

**Paso 1: Actualizar Tipos TypeScript**

```typescript
// src/core/data/types.ts

export interface Persona {
  id: string;
  identidad: {
    nombre: string;
    enc_apellido: string;
    fechaNacimiento?: string; // ← NUEVO CAMPO (optional)
    genero: 'H' | 'M';
  };
  // ...
}
```

**Paso 2: Actualizar initSheet**

```javascript
// backend/src/api.gs o script de despliegue

await initSheet({
  ssId: CORE_SHEET_ID,
  sheetName: 'Personas',
  headers: [
    'id',
    'identidad',
    'fechaNacimiento',  // ← NUEVA COLUMNA
    'enc_contacto',
    'enc_servicio',
    '_v',
    '_ts',
    '_deleted'
  ],
  preserveExisting: true  // ← CRÍTICO: no borrar datos
});
```

**Paso 3: Manejar undefined en Código**

```typescript
// src/modules/personas/components/PersonaCard.tsx

// ✅ CORRECTO: maneja undefined
const edad = persona.identidad.fechaNacimiento
  ? calculateAge(persona.identidad.fechaNacimiento)
  : 'N/A';

// ❌ INCORRECTO: asume campo siempre existe
const edad = calculateAge(persona.identidad.fechaNacimiento);
```

**Paso 4: Documentar**

```markdown
## CHANGELOG.md

### 2026-03-20

#### Agregado
- **Personas:** Campo `fechaNacimiento` en `identidad` (backward-compatible, nullable)
```

---

### Fase 3: Desarrollo (Breaking Changes)

**Paso 1: Crear Script de Migración**

```javascript
// scripts/migrations/001-add-birthdate-to-personas.js

/**
 * Migración 001: Agregar fechaNacimiento a Personas
 * 
 * Backfill: Establece fechaNacimiento = '1900-01-01' para registros sin valor
 * Rollback: Restaura a undefined (pérdida de datos backfilled)
 * 
 * @param {DataService} dataService
 * @returns {Promise<{success: boolean, affected: number, errors: string[]}>}
 */
export async function migrate001(dataService) {
  const result = {
    success: false,
    affected: 0,
    errors: []
  };

  try {
    // 1. Obtener todos los registros
    const personas = await dataService.getAll('Personas');
    
    // 2. Filtrar los que necesitan migración
    const needMigration = personas.filter(
      p => !p.identidad?.fechaNacimiento
    );

    console.log(`Migrando ${needMigration.length} de ${personas.length} registros`);

    // 3. Migrar en batches de 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < needMigration.length; i += BATCH_SIZE) {
      const batch = needMigration.slice(i, i + BATCH_SIZE);
      
      const updates = batch.map(persona => ({
        ...persona,
        identidad: {
          ...persona.identidad,
          fechaNacimiento: '1900-01-01' // Default value
        },
        _v: (persona._v || 0) + 1,
        _ts: new Date().toISOString()
      }));

      await dataService.batchSave('Personas', updates);
      result.affected += batch.length;
      
      console.log(`Batch ${i / BATCH_SIZE + 1} completado`);
    }

    result.success = true;
    console.log(`Migración completada: ${result.affected} registros actualizados`);

  } catch (error) {
    result.errors.push(error.message);
    console.error('Error en migración:', error);
  }

  return result;
}

/**
 * Rollback de migración 001
 * ADVERTENCIA: Pierde los datos backfilled
 */
export async function rollback001(dataService) {
  const personas = await dataService.getAll('Personas');
  
  const rollback = personas
    .filter(p => p.identidad?.fechaNacimiento === '1900-01-01')
    .map(persona => ({
      ...persona,
      identidad: {
        ...persona.identidad,
        fechaNacimiento: undefined
      },
      _v: (persona._v || 0) + 1,
      _ts: new Date().toISOString()
    }));

  await dataService.batchSave('Personas', rollback);
  return { success: true, affected: rollback.length };
}
```

**Paso 2: Registrar Migración en Tabla**

```javascript
// scripts/migrations/register.js

/**
 * Registra migración ejecutada en Sistema_Migraciones
 */
export async function registerMigration(dataService, migrationId, result) {
  await dataService.save('Sistema_Migraciones', {
    id: migrationId,
    executed_at: new Date().toISOString(),
    status: result.success ? 'success' : 'failed',
    rows_affected: result.affected || 0,
    errors: JSON.stringify(result.errors),
    _v: 1,
    _ts: new Date().toISOString()
  });
}
```

**Paso 3: Ejecutar en Staging**

```bash
# 1. Crear backup
npm run backup:staging

# 2. Ejecutar migración
NODE_ENV=staging npm run migrate -- 001-add-birthdate-to-personas

# 3. Verificar resultado
npm run migration:status 001-add-birthdate-to-personas

# 4. Validar datos manualmente en GSheet
```

**Paso 4: Ejecutar en Producción**

```bash
# 1. Crear backup completo
npm run backup:production

# 2. Ejecutar migración
NODE_ENV=production npm run migrate -- 001-add-birthdate-to-personas

# 3. Verificar resultado
npm run migration:status 001-add-birthdate-to-personas

# 4. Actualizar tipos TypeScript
# 5. Ejecutar initSheet con nuevas columnas
# 6. Validar integridad
```

---

## Tabla Sistema_Migraciones

**Schema:**

```typescript
interface MigrationRecord {
  id: string;              // Ej: '001-add-birthdate'
  executed_at: string;     // ISO 8601
  status: 'pending' | 'success' | 'failed' | 'rolled_back';
  rows_affected: number;
  errors: string;          // JSON stringified array
  _v: number;
  _ts: string;
}
```

**Ubicación:** GSheet Core, hoja `Sistema_Migraciones`

**Headers:**
```
id | executed_at | status | rows_affected | errors | _v | _ts
```

---

## Comandos CLI

### Ejecutar Migración

```bash
npm run migrate -- [migration-id]
```

**Ejemplo:**
```bash
npm run migrate -- 001-add-birthdate-to-personas
```

### Ver Estado de Migraciones

```bash
npm run migration:status [migration-id?]
```

**Ejemplo:**
```bash
# Todas las migraciones
npm run migration:status

# Migración específica
npm run migration:status 001-add-birthdate-to-personas
```

### Rollback

```bash
npm run migrate:rollback -- [migration-id]
```

**Ejemplo:**
```bash
npm run migrate:rollback -- 001-add-birthdate-to-personas
```

### Backup

```bash
npm run backup:staging
npm run backup:production
```

---

## Reglas de Oro

| ID | Regla | Descripción |
|----|-------|-------------|
| **M-01** | NUNCA eliminar campos sin período deprecated | Mínimo 30 días de advertencia |
| **M-02** | SIEMPRE usar campos opcionales o con default | En cambios backward-compatible |
| **M-03** | Las migraciones breaking DEBEN tener rollback | Plan de reversa obligatorio |
| **M-04** | Las migraciones DEBEN ser idempotentes | Pueden ejecutarse N veces sin daño |
| **M-05** | Las migraciones DEBEN loguearse | En `Sistema_Migraciones` |
| **M-06** | NUNCA migrar sin backup | Backup obligatorio antes de producción |
| **M-07** | SIEMPRE probar en staging primero | Staging → Production pipeline |
| **M-08** | Documentar en CHANGELOG | Toda migración debe estar documentada |

---

## Ejemplos de Migraciones

### Ejemplo 1: Agregar Campo Opcional (Backward-Compatible)

```javascript
// scripts/migrations/002-add-telefono-secundario.js

/**
 * Migración 002: Agregar teléfono secundario opcional
 * No requiere backfill - campo es opcional
 */
export async function migrate002(dataService) {
  console.log('Migración 002: No requiere migración de datos (campo opcional)');
  
  // Solo actualizamos initSheet
  await initSheet({
    ssId: CORE_SHEET_ID,
    sheetName: 'Personas',
    headers: [
      'id',
      'identidad',
      'enc_contacto',  // Ahora soporta array de teléfonos
      // ...
    ],
    preserveExisting: true
  });

  return { success: true, affected: 0 };
}
```

---

### Ejemplo 2: Renombrar Campo (Breaking)

```javascript
// scripts/migrations/003-rename-nombre-to-primer-nombre.js

/**
 * Migración 003: Renombrar campo nombre → primerNombre
 * Requiere copiar datos y mantener compatibilidad
 */
export async function migrate003(dataService) {
  const personas = await dataService.getAll('Personas');
  
  const updates = personas.map(persona => ({
    ...persona,
    identidad: {
      ...persona.identidad,
      primerNombre: persona.identidad.nombre,  // Copiar valor
      // nombre: undefined  ← NO eliminar todavía (período deprecated)
    },
    _v: (persona._v || 0) + 1,
    _ts: new Date().toISOString()
  }));

  await dataService.batchSave('Personas', updates);
  
  return { 
    success: true, 
    affected: updates.length,
    note: 'Campo nombre marcado como deprecated (eliminar en v2.0)'
  };
}

export async function rollback003(dataService) {
  // Rollback: restaurar campo nombre desde primerNombre
  const personas = await dataService.getAll('Personas');
  
  const rollback = personas
    .filter(p => p.identidad?.primerNombre)
    .map(persona => ({
      ...persona,
      identidad: {
        ...persona.identidad,
        nombre: persona.identidad.primerNombre
      },
      _v: (persona._v || 0) + 1,
      _ts: new Date().toISOString()
    }));

  await dataService.batchSave('Personas', rollback);
  return { success: true, affected: rollback.length };
}
```

---

### Ejemplo 3: Cambiar Tipo de Dato (Breaking)

```javascript
// scripts/migrations/004-cambiar-edad-a-string.js

/**
 * Migración 004: Cambiar edad de number a string
 * Transforma valores numéricos a string
 */
export async function migrate004(dataService) {
  const personas = await dataService.getAll('Personas');
  
  const updates = personas
    .filter(p => typeof p.identidad?.edad === 'number')
    .map(persona => ({
      ...persona,
      identidad: {
        ...persona.identidad,
        edad: String(persona.identidad.edad)  // Transformar
      },
      _v: (persona._v || 0) + 1,
      _ts: new Date().toISOString()
    }));

  await dataService.batchSave('Personas', updates);
  
  return { success: true, affected: updates.length };
}
```

---

## Checklist de Migración

### Pre-Migración

- [ ] Tipo de cambio identificado (backward-compatible / breaking)
- [ ] Impacto evaluado (registros afectados)
- [ ] Script de migración creado (si breaking)
- [ ] Rollback plan definido (si breaking)
- [ ] Backup ejecutado
- [ ] Staging testeado
- [ ] Aprobaciones obtenidas

### Durante Migración

- [ ] Ejecutar en producción
- [ ] Monitorear logs
- [ ] Verificar resultado
- [ ] Registrar en `Sistema_Migraciones`

### Post-Migración

- [ ] Validar integridad de datos
- [ ] Actualizar tipos TypeScript
- [ ] Ejecutar initSheet con nuevas columnas
- [ ] Documentar en CHANGELOG.md
- [ ] Notificar a equipo

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2026-03-20 | Initial migration strategy |

---

**Este documento es parte de la arquitectura oficial de Congre-Admin.**
