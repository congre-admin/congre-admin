# Migraciones de Datos (Google Apps Script)

**Importante:** Este es un sitio estático (GitHub Pages). No hay servidor Node.js para ejecutar scripts de migración. Todas las migraciones se ejecutan a través de **Google Apps Script**.

---

## Ubicación Real de las Migraciones

Las migraciones **NO** están en este directorio local. Están en:

```
backend/src/
└── api.gs              ← Funciones migrateXXX() van aquí
└── migrations.gs       ← Opcional: archivo separado para migraciones
```

---

## Estructura de Migración GAS

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
    const data = getSheetData(sheet);
    
    // 2. Filtrar registros que necesitan migración
    const needMigration = data.filter(p => !p.identidad?.fechaNacimiento);
    
    Logger.log(`Migrando ${needMigration.length} de ${data.length} registros`);
    
    // 3. Migrar en batches
    const BATCH_SIZE = 50;
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idIndex = headers.indexOf('id');
    
    for (let i = 0; i < needMigration.length; i += BATCH_SIZE) {
      const batch = needMigration.slice(i, i + BATCH_SIZE);
      
      batch.forEach(persona => {
        const rowIndex = findRowById(sheet, persona.id, idIndex);
        
        if (rowIndex > 0) {
          const identidadObj = persona.identidad || {};
          identidadObj.fechaNacimiento = '1900-01-01';
          
          const identidadIndex = headers.indexOf('identidad');
          sheet.getRange(rowIndex, identidadIndex + 1).setValue(JSON.stringify(identidadObj));
          
          const vIndex = headers.indexOf('_v');
          const tsIndex = headers.indexOf('_ts');
          sheet.getRange(rowIndex, vIndex + 1).setValue((persona._v || 0) + 1);
          sheet.getRange(rowIndex, tsIndex + 1).setValue(new Date().toISOString());
          
          result.affected++;
        }
      });
      
      Logger.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} completado`);
      Utilities.sleep(100);
    }
    
    result.success = true;
    Logger.log(`Migración completada: ${result.affected} registros`);
    
    registerMigration('001-add-birthdate', result);
    
  } catch (error) {
    result.errors.push(error.message);
    Logger.error('Error en migración 001:', error);
  }
  
  return result;
}
```

---

## Ejecución de Migraciones

### Opción 1: Manual desde GAS Console (RECOMENDADA)

1. Abrir Google Apps Script editor
2. Pegar función de migración en `api.gs` o `migrations.gs`
3. Seleccionar función desde dropdown
4. Click en **"Run"**
5. Ver logs en **View → Executions**

### Opción 2: Vía API POST

```javascript
// Desde consola del navegador
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
  }
}
```

### Opción 3: Time-Driven Trigger

```javascript
function runPendingMigrations() {
  migrate001_addBirthdateToPersonas();
}

// Configurar: Edit → Current project's triggers → Add trigger
// Function: runPendingMigrations
// Event source: Time-driven
// Type: Day timer (3am-4am)
```

---

## Backup Manual (Pre-Migración)

**Importante:** Sin Node.js, el backup es manual via Google Sheets UI.

### Proceso:

1. **Abrir GSheet Core** en navegador
2. **File → Download → Microsoft Excel (.xlsx)**
3. **Guardar** con timestamp: `CongreAdmin_Core_Backup_2026-03-20.xlsx`
4. **Repetir** para cada GSheet (Personas, Reuniones, etc.)

---

## Checklist de Migración

### Pre-Migración

- [ ] Tipo de cambio identificado (backward-compatible / breaking)
- [ ] Impacto evaluado (contar registros en GSheet)
- [ ] Función de migración creada en `api.gs` (si breaking)
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

## Funciones Utilitarias (en api.gs)

```javascript
/**
 * Obtiene datos de una hoja como array de objetos
 */
function getSheetData(sheet) {
  if (!sheet || sheet.getLastRow() < 1) return [];
  
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  
  return rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
        try {
          obj[h] = JSON.parse(val);
        } catch (e) {
          obj[h] = val;
        }
      } else {
        obj[h] = val;
      }
    });
    return obj;
  });
}

/**
 * Encuentra fila por ID
 */
function findRowById(sheet, id, idIndex) {
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIndex] == id) {
      return i + 1; // +1 porque rows es 0-indexed pero getRange es 1-indexed
    }
  }
  
  return -1; // No encontrado
}

/**
 * Registra migración en Sistema_Migraciones
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

## Recursos

- [Estrategia de Migración de Esquemas](../../docs/architecture/Migraciones.md)
- [Backend.md](../../docs/architecture/Backend.md) - Política de initSheet
- [CHANGELOG.md](../../docs/CHANGELOG.md) - Historial de cambios

---

**Version:** 1.1.0 (GAS-compatible)  
**Last Updated:** 2026-03-20
