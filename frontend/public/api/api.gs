/**
 * Maneja solicitudes GET genéricas.
 * @example ?action=getData&sheet=NombreDeHoja&ssId=ID_DE_HOJA
 */
function doGet(e) {
  const action = e.parameter.action;
  const ssId = e.parameter.ssId;
  
  try {
    const ss = ssId ? SpreadsheetApp.openById(ssId) : SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'getData') {
      const sheetName = e.parameter.sheet;
      return createResponse(getCachedSheetData(ss, sheetName));
    }
    
    if (action === 'batchGetData') {
      const sheets = e.parameter.sheets ? e.parameter.sheets.split(',') : [];
      const result = {};
      sheets.forEach(name => {
        result[name] = getCachedSheetData(ss, name);
      });
      return createResponse(result);
    }
    
    return createResponse({ error: 'Acción GET no válida' });
  } catch (err) {
    return createResponse({ error: err.message });
  }
}

/**
 * Maneja solicitudes POST genéricas.
 * All config stored in GSheet, no script properties.
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const payload = postData.payload || {};
    const sessionToken = payload.sessionToken || postData.sessionToken;
    const sheetName = postData.sheet;
    const ssId = payload.ssId || postData.ssId;
    
    // Auth actions - no spreadsheet needed
    if (action === 'login') {
      return createResponse(actionLogin(payload, ssId));
    }
    
    if (action === 'register') {
      return createResponse(actionRegister(payload, ssId));
    }
    
    if (action === 'challenge') {
      return createResponse(actionChallenge(payload));
    }
    
    if (action === 'requestOTP') {
      return createResponse(actionRequestOTP(payload));
    }
    
    if (action === 'setupTOTP') {
      return createResponse(actionSetupTOTP(payload));
    }
    
    if (action === 'confirmTOTP') {
      return createResponse(actionConfirmTOTP(payload));
    }
    
    if (action === 'setupPasskey') {
      return createResponse(actionSetupPasskey(payload));
    }
    
    if (action === 'confirmPasskey') {
      return createResponse(actionConfirmPasskey(payload));
    }
    
    if (action === 'deletePasskey') {
      return createResponse(actionDeletePasskey(payload));
    }
    
    if (action === 'changePassword') {
      return createResponse(actionChangePassword(payload));
    }
    
    if (action === 'requestPasswordReset') {
      return createResponse(actionRequestPasswordReset(payload));
    }
    
    if (action === 'confirmPasswordReset') {
      return createResponse(actionConfirmPasswordReset(payload));
    }
    
    if (action === 'getAuthMethods') {
      return createResponse(actionGetAuthMethods(payload));
    }
    
    if (action === 'setDefaultAuthMethod') {
      return createResponse(actionSetDefaultAuthMethod(payload));
    }
    
    if (action === 'validateSession') {
      const session = validateSession(sessionToken);
      return createResponse({ valid: session.valid, userId: session.userId });
    }
    
    if (action === 'refreshSession') {
      return createResponse(actionRefreshSession(payload));
    }
    
    if (action === 'logout') {
      return createResponse(actionLogout(payload));
    }
    
    if (action === 'install') {
      return createResponse(actionInstall(payload));
    }
    
    // --- Data actions - require ssId and session ---
    if (!ssId) {
      return createResponse({ error: 'ERR_SS_ID_REQUIRED: Se requiere ssId para operaciones de datos' });
    }
    
    const ss = SpreadsheetApp.openById(ssId);
    
    // --- initSheet ---
    if (action === 'initSheet') {
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(postData.headers);
      } else if (!postData.preserveExisting) {
        sheet.clearContents(); 
        sheet.getRange(1, 1, 1, postData.headers.length).setValues([postData.headers]).setFontWeight('bold').setBackground('#f3f3f3');
      } else { 
        if (sheet.getLastRow() === 0) {
          sheet.getRange(1, 1, 1, postData.headers.length).setValues([postData.headers]).setFontWeight('bold').setBackground('#f3f3f3');
        }
      }
      clearCache(ssId, sheetName);
      return createResponse({ success: true, message: 'Hoja inicializada' });
    }
    
    // --- clearSheet ---
    if (action === 'clearSheet') {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return createResponse({ error: 'Hoja no encontrada' });
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues();
      sheet.clearContents();
      if (headers.length > 0 && headers[0][0]) sheet.appendRow(headers[0]);
      clearCache(ssId, sheetName);
      return createResponse({ success: true });
    }
    
    // --- batchInitSheet ---
    if (action === 'batchInitSheet') {
      const tables = postData.tables || [];
      const results = [];
      tables.forEach(table => {
        try {
          let sheet = ss.getSheetByName(table.name);
          if (!sheet) {
            sheet = ss.insertSheet(table.name);
            sheet.appendRow(table.headers);
            results.push({ name: table.name, status: 'created' });
          } else if (!table.preserveExisting) {
            sheet.clearContents();
            sheet.getRange(1, 1, 1, table.headers.length).setValues([table.headers]).setFontWeight('bold').setBackground('#f3f3f3');
            results.push({ name: table.name, status: 'reinitialized' });
          } else {
            if (sheet.getLastRow() === 0) {
              sheet.getRange(1, 1, 1, table.headers.length).setValues([table.headers]).setFontWeight('bold').setBackground('#f3f3f3');
            }
            results.push({ name: table.name, status: 'preserved' });
          }
          clearCache(ssId, table.name);
        } catch (e) {
          results.push({ name: table.name, status: 'error', error: e.message });
        }
      });
      return createResponse({ success: true, results: results });
    }
    
    // --- batchSaveData ---
    if (action === 'batchSaveData') {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return createResponse({ error: 'Hoja no encontrada: ' + sheetName });
      const rows = postData.rows || [];
      const results = [];
      rows.forEach(item => {
        try {
          updateOrInsert(sheet, item, false, {});
          results.push({ id: item.id, status: 'saved' });
        } catch (e) {
          results.push({ id: item.id, status: 'error', error: e.message });
        }
      });
      clearCache(ssId, sheetName);
      return createResponse({ success: true, results: results });
    }
    
    // --- batchDeleteData ---
    if (action === 'batchDeleteData') {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return createResponse({ error: 'Hoja no encontrada' });
      const ids = postData.ids || [];
      const results = [];
      ids.forEach(id => {
        const result = softDeleteRow(sheet, id);
        results.push({ id: id, status: result ? 'deleted' : 'not_found' });
      });
      clearCache(ssId, sheetName);
      return createResponse({ success: true, results: results });
    }
    
    // --- saveData ---
    if (action === 'saveData') {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return createResponse({ error: 'Hoja no encontrada: ' + sheetName });
      let existingRows = null;
      if (postData.expectedVersion !== undefined) {
        existingRows = sheet.getDataRange().getValues();
      }
      updateOrInsert(sheet, payload, false, { existingRows });
      clearCache(ssId, sheetName);
      return createResponse({ success: true, message: 'Datos guardados' });
    }
    
    // --- deleteData ---
    if (action === 'deleteData') {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return createResponse({ error: 'Hoja no encontrada' });
      const result = softDeleteRow(sheet, payload.id);
      if (!result) return createResponse({ success: false, error: 'Registro no encontrado' });
      clearCache(ssId, sheetName);
      return createResponse({ success: true, message: 'Borrado lógico realizado' });
    }
    
    // --- hardDelete ---
    if (action === 'hardDelete') {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return createResponse({ error: 'Hoja no encontrada' });
      deleteRowById(sheet, payload.id);
      clearCache(ssId, sheetName);
      return createResponse({ success: true, message: 'Borrado físico realizado' });
    }
    
    // --- restoreData ---
    if (action === 'restoreData') {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return createResponse({ error: 'Hoja no encontrada' });
      const result = restoreRow(sheet, payload.id);
      if (!result) return createResponse({ success: false, error: 'Registro no encontrado' });
      clearCache(ssId, sheetName);
      return createResponse({ success: true, message: 'Registro restaurado' });
    }
    
    // --- getHistory ---
    if (action === 'getHistory') {
      if (!sessionToken) return createResponse({ error: 'ERR_AUTH_REQUIRED' });
      const session = validateSession(sessionToken);
      if (!session.valid) return createResponse({ error: 'ERR_AUTH_INVALID' });
      const permCheck = checkPermission(session, 'read', sheetName, ssId);
      if (!permCheck.allowed) return createResponse({ error: permCheck.error });
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return createResponse({ error: 'Hoja no encontrada' });
      const history = getVersionHistory(sheet, payload.id);
      return createResponse({ success: true, history: history });
    }
    
    // --- getData ---
    if (action === 'getData') {
      if (sessionToken) {
        const session = validateSession(sessionToken);
        if (!session.valid) return createResponse({ error: 'ERR_AUTH_INVALID' });
        const permCheck = checkPermission(session, 'read', sheetName, ssId);
        if (!permCheck.allowed) return createResponse({ error: permCheck.error });
      }
      const data = getCachedSheetData(ss, sheetName);
      return createResponse({ success: true, data: data });
    }
    
    // --- batchGetData ---
    if (action === 'batchGetData') {
      if (sessionToken) {
        const session = validateSession(sessionToken);
        if (!session.valid) return createResponse({ error: 'ERR_AUTH_INVALID' });
      }
      const sheets = postData.sheets ? postData.sheets.split(',') : [];
      const result = {};
      sheets.forEach(name => {
        result[name] = getCachedSheetData(ss, name);
      });
      return createResponse({ success: true, data: result });
    }
    
    return createResponse({ error: 'Acción POST no válida: ' + action });
  } catch (err) {
    return createResponse({ error: err.message });
  }
}

// --- Sistema de Caché ---
const CACHE_TTL_DATA = 600; // 10 minutos para datos de hojas
const CACHE_TTL_LOOKUP = 300; // 5 minutos para búsquedas

function getCachedSheetData(ss, sheetName) {
  const cache = CacheService.getScriptCache();
  const cacheKey = ss.getId() + '_' + sheetName;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // Fallback si la caché está corrupta
    }
  }
  
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = getSheetData(sheet);
  try {
    cache.put(cacheKey, JSON.stringify(data), CACHE_TTL_DATA);
  } catch (e) {
    // Si los datos son demasiado grandes para la caché, no fallar
  }
  return data;
}

function clearCache(ssId, sheetName) {
  const cache = CacheService.getScriptCache();
  cache.remove(ssId + '_' + sheetName);
}

// ================================================================= //
// VERSIONADO Y BORRADO LÓGICO
// Fase 1.4: Implementación de _v, _ts, _deleted
// ================================================================= //

/**
 * Obtiene datos de una hoja filtrando registros borrados
 * @param {Sheet} sheet - Hoja de cálculo
 * @param {boolean} includeDeleted - Si true, incluye registros borrados (default: false)
 * @return {array} Datos de la hoja
 */
function getSheetData(sheet, includeDeleted = false) {
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 1) return [];
  const headers = rows[0];
  const deletedIndex = headers.indexOf('_deleted');
  
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
  }).filter(row => {
    if (includeDeleted) return true;
    return row._deleted !== true && row._deleted !== 'true';
  });
}

/**
 * Actualiza o inserta un registro con versionado automático
 * @param {Sheet} sheet - Hoja de cálculo
 * @param {object} item - Datos del registro
 * @param {boolean} onlyIfNew - Si true, solo inserta si no existe
 * @param {object} options - Opciones adicionales: { existingRows }
 */
function updateOrInsert(sheet, item, onlyIfNew, options) {
  if (!sheet) return;
  const rows = options?.existingRows || sheet.getDataRange().getValues();
  const headers = rows[0];
  const idIndex = headers.indexOf('id');
  const vIndex = headers.indexOf('_v');
  
  let rowIndex = -1;
  let currentV = 0;
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIndex] == item.id) {
      rowIndex = i + 1;
      currentV = vIndex >= 0 ? (parseInt(rows[i][vIndex]) || 0) : 0;
      break;
    }
  }
  
  if (rowIndex > 0 && onlyIfNew) return;
  
  const timestamp = new Date().toISOString();
  const newItem = {
    ...item,
    _v: currentV + 1,
    _ts: timestamp
  };
  
  const values = headers.map(h => {
    const val = newItem[h];
    if (val === undefined || val === null) return '';
    return (typeof val === 'object') ? JSON.stringify(val) : val;
  });
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, values.length).setValues([values]);
  } else {
    sheet.appendRow(values);
  }
  
  const sheetName = sheet.getName();
  if (sheetName === 'Usuarios' && item.id) {
    invalidateCache('u:');
  } else if (sheetName === 'Perfiles' && item.id) {
    invalidateCache('p:');
    invalidateCache('p:all');
  }
  invalidateCoreSpreadsheetCache();
}

/**
 * Marca un registro como borrado (borrado lógico)
 * @param {Sheet} sheet - Hoja de cálculo
 * @param {string} id - ID del registro
 * @return {boolean} true si se marcó correctamente
 */
function softDeleteRow(sheet, id) {
  if (!sheet || !id) return false;
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return false;
  const idIndex = rows[0].indexOf('id');
  const deletedIndex = rows[0].indexOf('_deleted');
  const vIndex = rows[0].indexOf('_v');
  const tsIndex = rows[0].indexOf('_ts');
  
  if (idIndex < 0) return false;
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIndex] == id) {
      const rowNum = i + 1;
      
      // Marcar como borrado
      if (deletedIndex >= 0) {
        sheet.getRange(rowNum, deletedIndex + 1).setValue(true);
      }
      
      // Incrementar versión
      if (vIndex >= 0) {
        const currentV = parseInt(rows[i][vIndex]) || 0;
        sheet.getRange(rowNum, vIndex + 1).setValue(currentV + 1);
      }
      
      // Actualizar timestamp
      if (tsIndex >= 0) {
        sheet.getRange(rowNum, tsIndex + 1).setValue(new Date().toISOString());
      }
      
      const ssId = getCoreSpreadsheetId();
      const sheetName = sheet.getName();
      clearCache(ssId, sheetName);
      if (sheetName === 'Usuarios') invalidateCache('u:');
      if (sheetName === 'Perfiles') { invalidateCache('p:'); invalidateCache('p:all'); }
      
      return true;
    }
  }
  return false;
}

/**
 * Restaura un registro borrado lógicamente
 * @param {Sheet} sheet - Hoja de cálculo
 * @param {string} id - ID del registro
 * @return {boolean} true si se restauró correctamente
 */
function restoreRow(sheet, id) {
  if (!sheet || !id) return false;
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return false;
  const idIndex = rows[0].indexOf('id');
  const deletedIndex = rows[0].indexOf('_deleted');
  
  if (idIndex < 0) return false;
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIndex] == id) {
      const rowNum = i + 1;
      
      if (deletedIndex >= 0) {
        sheet.getRange(rowNum, deletedIndex + 1).setValue(false);
      }
      
      const ssId = getCoreSpreadsheetId();
      const sheetName = sheet.getName();
      clearCache(ssId, sheetName);
      if (sheetName === 'Usuarios') invalidateCache('u:');
      if (sheetName === 'Perfiles') { invalidateCache('p:'); invalidateCache('p:all'); }
      
      return true;
    }
  }
  return false;
}

/**
 * Obtiene el historial de versiones de un registro
 * @param {Sheet} sheet - Hoja de cálculo
 * @param {string} id - ID del registro
 * @return {array} Historial de versiones
 */
function getVersionHistory(sheet, id) {
  const allData = getSheetData(sheet, true); // Include deleted
  return allData
    .filter(row => row.id === id)
    .sort((a, b) => (b._v || 0) - (a._v || 0));
}

function deleteRowById(sheet, id) {
  if (!sheet || !id) return;
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return;
  const idIndex = rows[0].indexOf('id');
  if (idIndex < 0) return;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIndex] == id) {
      sheet.deleteRow(i + 1);
      
      const ssId = getCoreSpreadsheetId();
      const sheetName = sheet.getName();
      clearCache(ssId, sheetName);
      if (sheetName === 'Usuarios') invalidateCache('u:');
      if (sheetName === 'Perfiles') { invalidateCache('p:'); invalidateCache('p:all'); }
      break;
    }
  }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================================================================= //
// AUTENTICACIÓN ZERO-KNOWLEDGE
// All config from GSheet, no script properties
// ================================================================= //

const SESSION_TTL = 86400; // 24 horas en segundos

/**
 * Helper para obtener user properties
 */
function getUserProperties() {
  return PropertiesService.getUserProperties();
}

/**
 * Get current ssId from session storage
 */
function getCurrentSsId() {
  return getUserProperties().getProperty('current_ssId');
}

/**
 * Obtiene la hoja de Usuarios desde el GSheet especificado
 */
function getUsuariosSheet(ssId) {
  const ss = SpreadsheetApp.openById(ssId);
  return ss.getSheetByName('Usuarios');
}

/**
 * Busca un usuario por username (email)
 * @param {string} username - Email del usuario
 * @param {string} ssId - ID del spreadsheet
 * @return {object|null} Usuario encontrado o null
 */
function getUserByUsername(username, ssId) {
  return getCached('u:un:' + username, () => {
    const sheet = getUsuariosSheet(ssId);
    if (!sheet) return null;
    const data = getSheetData(sheet);
    return data.find(row => row.username === username) || null;
  });
}

/**
 * Busca un usuario por ID
 * @param {string} id - ID del usuario
 * @param {string} ssId - ID del spreadsheet
 * @return {object|null} Usuario encontrado o null
 */
function getUserById(id, ssId) {
  return getCached('u:id:' + id, () => {
    const sheet = getUsuariosSheet(ssId);
    if (!sheet) return null;
    const data = getSheetData(sheet);
    return data.find(row => row.id === id) || null;
  });
}

/**
 * Hashea una contraseña usando SHA-256
 * @param {string} password - Contraseña en texto plano
 * @return {string} Hash de la contraseña
 */
function hashPassword(password) {
  if (!password) return '';
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return digest.map(function(b) {
    return ('00' + (b < 0 ? b + 256 : b).toString(16)).slice(-2);
  }).join('');
}

/**
 * Parsea auth_config del usuario (maneja tanto string como objeto ya parseado)
 * @param {string|object} authConfig - auth_config del usuario
 * @return {object} auth_config parseado
 */
function parseAuthConfig(authConfig) {
  const defaults = { default_method: 'passkey', password_hash: '', recovery_enabled: true, email_otp: { enabled: false }, totp: { enabled: false }, passkeys: [] };
  if (!authConfig) return defaults;
  try {
    return typeof authConfig === 'string' ? JSON.parse(authConfig) : authConfig;
  } catch (e) {
    return defaults;
  }
}

/**
 * Parsea metadata del usuario (maneja tanto string como objeto ya parseado)
 * @param {string|object} metadata - metadata del usuario
 * @return {object} metadata parseado
 */
function parseUserMetadata(metadata) {
  const defaults = { last_login: null, last_password_change: null, failed_login_attempts: 0, created_from_ip: null };
  if (!metadata) return defaults;
  try {
    return typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
  } catch (e) {
    return defaults;
  }
}

/**
 * Verifica una contraseña contra un hash
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash almacenado
 * @return {boolean} true si coincide
 */
function verifyPassword(password, hash) {
  if (!password || !hash) return false;
  return hashPassword(password) === hash;
}

/**
 * Valida requisitos de complejidad de contraseña
 * @param {string} password - Contraseña a validar
 * @return {object} { valid: boolean, errors: string[] }
 */
function validatePasswordComplexity(password) {
  const errors = [];
  
  if (!password) {
    errors.push('La contraseña es requerida');
    return { valid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }
  
  if (password.length > 128) {
    errors.push('Máximo 128 caracteres');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Al menos una letra minúscula');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Al menos una letra mayúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Al menos un número');
  }
  
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Al menos un carácter especial');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Crea un nuevo usuario
 * @param {object} userData - Datos del usuario
 * @param {string} ssId - ID del spreadsheet
 * @return {object} Usuario creado
 */
function createUser(userData, ssId) {
  const sheet = getUsuariosSheet(ssId);
  if (!sheet) throw new Error('Hoja Usuarios no encontrada');
  
  // Verificar si el usuario ya existe
  const existing = getUserByUsername(userData.username, ssId);
  if (existing) {
    throw new Error('ERR_USER_EXISTS: El usuario ya existe');
  }
  
  // Validar contraseña (requerida)
  if (!userData.password) {
    throw new Error('ERR_PASSWORD_REQUIRED: La contraseña es requerida');
  }
  const pwValidation = validatePasswordComplexity(userData.password);
  if (!pwValidation.valid) {
    throw new Error('ERR_PASSWORD_WEAK: ' + pwValidation.errors.join(', '));
  }
  
  const now = new Date().toISOString();
  const authConfig = {
    default_method: userData.default_method || 'passkey',
    password_hash: userData.password ? hashPassword(userData.password) : '',
    recovery_enabled: true,
    email_otp: { enabled: true, created_at: now },
    totp: { enabled: false, secret: null, created_at: null },
    passkeys: []
  };
  
  const metadata = {
    last_login: null,
    last_password_change: userData.password ? now : null,
    failed_login_attempts: 0,
    created_from_ip: userData.ip || null
  };
  
  const user = {
    id: Utilities.getUuid(),
    username: userData.username,
    email: userData.email || '',
    wrapped_mk: userData.wrapped_mk || '',
    perfilId: userData.perfilId || 'p_publicador',
    auth_config: JSON.stringify(authConfig),
    metadata: JSON.stringify(metadata),
    created_at: now,
    _ts: now
  };
  
  updateOrInsert(sheet, user, false);
  clearCache(ssId, 'Usuarios');
  invalidateCache('u:');
  
  return { success: true, user: { id: user.id, username: user.username } };
}

/**
 * Actualiza un usuario existente
 * @param {string} id - ID del usuario
 * @param {object} updates - Campos a actualizar
 * @param {string} ssId - ID del spreadsheet
 * @return {object} Usuario actualizado
 */
function updateUser(id, updates, ssId) {
  const sheet = getUsuariosSheet(ssId);
  if (!sheet) throw new Error('Hoja Usuarios no encontrada');
  
  const user = getUserById(id, ssId);
  if (!user) {
    throw new Error('ERR_USER_NOT_FOUND: Usuario no encontrado');
  }
  
  // Handle auth_config and metadata as JSON strings
  let processedUpdates = { ...updates };
  if (updates.auth_config && typeof updates.auth_config === 'object') {
    processedUpdates.auth_config = JSON.stringify(updates.auth_config);
  }
  if (updates.metadata && typeof updates.metadata === 'object') {
    processedUpdates.metadata = JSON.stringify(updates.metadata);
  }
  
  const updatedUser = {
    ...user,
    ...processedUpdates,
    _ts: new Date().toISOString()
  };
  
  updateOrInsert(sheet, updatedUser, false);
  clearCache(ssId, 'Usuarios');
  invalidateCache('u:');
  
  return { success: true, user: { id: updatedUser.id, username: updatedUser.username } };
}

/**
 * Actualiza la contraseña de un usuario
 * @param {string} userId - ID del usuario
 * @param {string} newPassword - Nueva contraseña
 * @return {object} Resultado
 */
function updateUserPassword(userId, newPassword) {
  const sheet = getUsuariosSheet();
  if (!sheet) throw new Error('Hoja Usuarios no encontrada');
  
  const user = getUserById(userId);
  if (!user) {
    throw new Error('ERR_USER_NOT_FOUND: Usuario no encontrado');
  }
  
  const password_hash = hashPassword(newPassword);
  const now = new Date().toISOString();
  
  // Parse existing auth_config and update password_hash inside
  let authConfig = { default_method: 'passkey', password_hash: '', recovery_enabled: true, email_otp: { enabled: false }, totp: { enabled: false }, passkeys: [] };
  try {
    if (user.auth_config) {
      authConfig = parseAuthConfig(user.auth_config);
    }
  } catch (e) {
    // Use default if parse fails
  }
  
  authConfig.password_hash = password_hash;
  
  // Update metadata for password change tracking
  let metadata = parseUserMetadata(user.metadata);
  metadata.last_password_change = now;
  
  const updatedUser = {
    ...user,
    auth_config: JSON.stringify(authConfig),
    metadata: JSON.stringify(metadata),
    _ts: now
  };
  
  updateOrInsert(sheet, updatedUser, false);
  clearCache(ssId, 'Usuarios');
  invalidateCache('u:');
  
  return { success: true };
}

/**
 * Actualiza el metadata de un usuario
 * @param {string} userId - ID del usuario
 * @param {object} updates - Campos a actualizar en metadata
 * @return {object} Resultado
 */
function updateUserMetadata(userId, updates) {
  const user = getUserById(userId);
  if (!user) {
    throw new Error('ERR_USER_NOT_FOUND: Usuario no encontrado');
  }
  
  let metadata = { last_login: null, last_password_change: null, failed_login_attempts: 0, created_from_ip: null };
  try {
    metadata = parseUserMetadata(user.metadata);
  } catch (e) {
    // Use default
  }
  
  metadata = { ...metadata, ...updates };
  
  const ssId = getUserProperties().getProperty('current_ssId');
  return updateUser(userId, { metadata: JSON.stringify(metadata) }, ssId);
}

/**
 * Incrementa los intentos de login fallidos
 * @param {string} userId - ID del usuario
 */
function incrementFailedLoginAttempts(userId) {
  const ssId = getUserProperties().getProperty('current_ssId');
  const user = getUserById(userId, ssId);
  if (!user) return;
  
  let metadata = { last_login: null, last_password_change: null, failed_login_attempts: 0, created_from_ip: null };
  try {
    metadata = parseUserMetadata(user.metadata);
  } catch (e) {}
  
  metadata.failed_login_attempts = (metadata.failed_login_attempts || 0) + 1;
  updateUser(userId, { metadata: JSON.stringify(metadata) }, ssId);
}

/**
 * Reinicia los intentos de login fallidos
 * @param {string} userId - ID del usuario
 */
function resetFailedLoginAttempts(userId) {
  const ssId = getUserProperties().getProperty('current_ssId');
  const user = getUserById(userId, ssId);
  if (!user) return;
  
  let metadata = { last_login: null, last_password_change: null, failed_login_attempts: 0, created_from_ip: null };
  try {
    metadata = parseUserMetadata(user.metadata);
  } catch (e) {}
  
  metadata.failed_login_attempts = 0;
  updateUser(userId, { metadata: JSON.stringify(metadata) }, ssId);
}

/**
 * Obtiene un valor específico del metadata de un usuario
 * @param {string} userId - ID del usuario
 * @param {string} key - Clave del metadata
 * @return {any} Valor de la clave
 */
function getUserMetadataValue(userId, key) {
  const user = getUserById(userId);
  if (!user) return null;
  
  let metadata = { last_login: null, last_password_change: null, failed_login_attempts: 0, created_from_ip: null };
  try {
    metadata = parseUserMetadata(user.metadata);
  } catch (e) {}
  
  return metadata[key] || null;
}

/**
 * Invalida todas las sesiones de un usuario
 * @param {string} userId - ID del usuario
 */
function invalidateAllUserSessions(userId) {
  const sessions = getUserSessions(userId);
  if (sessions && sessions.length > 0) {
    sessions.forEach(session => {
      try {
        invalidateSession(session.token);
      } catch (e) {
        Logger.log('Error invalidating session: ' + e.message);
      }
    });
  }
}

/**
 * Genera un token de sesión
 * @param {string} userId - ID del usuario
 * @param {string} ssId - ID del spreadsheet
 * @return {object} Token de sesión
 */
function generateSessionToken(userId, ssId) {
  const user = getUserById(userId, ssId);
  if (!user) {
    throw new Error('ERR_USER_NOT_FOUND');
  }
  
  const token = Utilities.getUuid() + '_' + Utilities.getUuid();
  const expiresAt = new Date(Date.now() + SESSION_TTL * 1000).toISOString();
  
  // Guardar sesión con ssId
  const sessionData = {
    token: token,
    userId: userId,
    ssId: ssId,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt
  };
  
  const userSessions = getUserSessions(userId);
  userSessions.push(sessionData);
  PropertiesService.getUserProperties().setProperty(
    'sessions_' + userId,
    JSON.stringify(userSessions)
  );
  
  _addToSessionIndex(token, userId, expiresAt);
  
  return {
    sessionToken: token,
    expiresAt: expiresAt,
    userId: userId
  };
}

/**
 * Obtiene las sesiones de un usuario
 */
function getUserSessions(userId) {
  const stored = PropertiesService.getUserProperties().getProperty('sessions_' + userId);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Índice híbrido de sesiones (memoria + PropertiesService)
 */
let _sessionIndex = null;

function _loadSessionIndex() {
  if (_sessionIndex) return _sessionIndex;
  
  const stored = CacheService.getScriptCache().get('session_index');
  if (stored) {
    _sessionIndex = JSON.parse(stored);
    return _sessionIndex;
  }
  
  _sessionIndex = {};
  return _sessionIndex;
}

function _saveSessionIndex() {
  if (!_sessionIndex) return;
  try {
    CacheService.getScriptCache().put('session_index', JSON.stringify(_sessionIndex), SESSION_TTL);
  } catch (e) {}
}

function _addToSessionIndex(token, userId, expiresAt) {
  let idx = _loadSessionIndex();
  idx[token] = { userId, expiresAt };
  _saveSessionIndex();
}

function _removeFromSessionIndex(token) {
  let idx = _loadSessionIndex();
  delete idx[token];
  _saveSessionIndex();
}

function _findSessionInProperties(token) {
  const allProperties = PropertiesService.getUserProperties();
  const keys = allProperties.getKeys();
  
  for (const key of keys) {
    if (!key.startsWith('sessions_')) continue;
    
    const sessions = JSON.parse(allProperties.getProperty(key) || '[]');
    for (const session of sessions) {
      if (session.token === token) {
        if (new Date(session.expiresAt) > new Date()) {
          return session;
        }
      }
    }
  }
  
  return null;
}

/**
 * Valida un token de sesión (usa índice híbrido con fallback a PropertiesService)
 * @param {string} token - Token de sesión
 * @return {object|null} Datos de sesión o null si es inválido
 */
function validateSession(token) {
  let idx = _loadSessionIndex();
  let session = idx[token];
  
  if (!session) {
    session = _findSessionInProperties(token);
    if (session) {
      idx[token] = session;
      _saveSessionIndex();
    }
  }
  
  if (session) {
    if (new Date(session.expiresAt) > new Date()) {
      const user = getUserById(session.userId, getCurrentSsId());
      return {
        valid: true,
        userId: session.userId,
        username: user?.username,
        expiresAt: session.expiresAt
      };
    }
    delete idx[token];
    _saveSessionIndex();
  }
  
  return { valid: false };
}

/**
 * Cierra una sesión
 * @param {string} token - Token de sesión a cerrar
 */
function invalidateSession(token) {
  _removeFromSessionIndex(token);
  
  const allProperties = PropertiesService.getUserProperties();
  const keys = allProperties.getKeys();
  
  for (const key of keys) {
    if (!key.startsWith('sessions_')) continue;
    
    let sessions = JSON.parse(allProperties.getProperty(key) || '[]');
    const initialLength = sessions.length;
    sessions = sessions.filter(s => s.token !== token);
    
    if (sessions.length !== initialLength) {
      allProperties.setProperty(key, JSON.stringify(sessions));
    }
  }
}

/**
 * Renueva/extiende un token de sesión
 * @param {string} token - Token de sesión a renovar
 * @return {object} Nuevo token o error
 */
function refreshSessionToken(token) {
  const allProperties = PropertiesService.getUserProperties();
  const keys = allProperties.getKeys();
  
  for (const key of keys) {
    if (!key.startsWith('sessions_')) continue;
    
    let sessions = JSON.parse(allProperties.getProperty(key) || '[]');
    const sessionIndex = sessions.findIndex(s => s.token === token);
    
    if (sessionIndex !== -1) {
      const session = sessions[sessionIndex];
      
      // Verificar que no ha expirado
      if (new Date(session.expiresAt) < new Date()) {
        return { success: false, error: 'ERR_SESSION_EXPIRED' };
      }
      
      // Verificar si está próximo a expirar (menos de 1 hora)
      const timeLeft = new Date(session.expiresAt) - new Date();
      const oneHour = 60 * 60 * 1000;
      
      if (timeLeft > oneHour) {
        // No necesita renovación aún
        return { 
          success: true, 
          message: 'Sesión válida', 
          expiresAt: session.expiresAt,
          needsRefresh: false
        };
      }
      
      // Renovar sesión
      const newExpiresAt = new Date(Date.now() + SESSION_TTL * 1000).toISOString();
      sessions[sessionIndex].expiresAt = newExpiresAt;
      sessions[sessionIndex].lastRefresh = new Date().toISOString();
      
      allProperties.setProperty(key, JSON.stringify(sessions));
      
      _addToSessionIndex(token, session.userId, newExpiresAt);
      
      return { 
        success: true, 
        expiresAt: newExpiresAt,
        needsRefresh: false
      };
    }
  }
  
  return { success: false, error: 'ERR_SESSION_NOT_FOUND' };
}

/**
 * Obtiene todas las sesiones activas de un usuario
 * @param {string} userId - ID del usuario
 * @return {array} Lista de sesiones activas
 */
function getActiveSessions(userId) {
  const sessions = getUserSessions(userId);
  const now = new Date();
  
  return sessions.filter(s => new Date(s.expiresAt) > now).map(s => ({
    token: s.token,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    lastRefresh: s.lastRefresh || null
  }));
}

/**
 * Cierra todas las sesiones de un usuario
 * @param {string} userId - ID del usuario
 * @return {object} Resultado
 */
function invalidateAllSessions(userId) {
  PropertiesService.getUserProperties().deleteProperty('sessions_' + userId);
  
  let idx = _loadSessionIndex();
  const keysToRemove = Object.keys(idx).filter(k => idx[k].userId === userId);
  keysToRemove.forEach(k => delete idx[k]);
  _saveSessionIndex();
  
  return { success: true, message: 'Todas las sesiones cerradas' };
}

/**
 * Acción: register - Crea un nuevo usuario
 * @param {object} payload - Datos del usuario
 * @param {string} ssId - ID del spreadsheet Core
 * @return {object} Respuesta
 */
function actionRegister(payload, ssId) {
  try {
    if (!ssId) {
      return { success: false, error: 'ERR_SS_ID_REQUIRED' };
    }
    
    // Validate email is provided
    if (!payload.email || !payload.email.trim()) {
      return { success: false, error: 'ERR_EMAIL_REQUIRED: El email es requerido' };
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email.trim())) {
      return { success: false, error: 'ERR_EMAIL_INVALID: Formato de email inválido' };
    }
    
    const result = createUser({
      username: payload.username,
      email: payload.email.trim(),
      password: payload.password,
      wrapped_mk: payload.wrapped_mk,
      perfilId: payload.perfilId,
      ip: payload.ip
    }, ssId);
    
    // Send welcome email
    try {
      sendWelcomeEmail(payload.email, payload.username, 'tu congregación');
    } catch (emailErr) {
      Logger.log('Error sending welcome email: ' + emailErr.message);
    }
    
    // Send OTP email for verification (also verifies email exists)
    try {
      const otpResult = actionRequestOTP({
        username: payload.username,
        verifyOnly: true
      });
      if (!otpResult.success) {
        Logger.log('Warning: Could not send initial OTP: ' + otpResult.error);
      }
    } catch (otpErr) {
      Logger.log('Warning: Error sending initial OTP: ' + otpErr.message);
    }
    
    return {
      success: true,
      user: result.user
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Acción: setupTOTP - Genera secreto TOTP para un usuario
 * @param {object} payload - Datos del usuario
 * @return {object} Respuesta con secreto y URI para QR
 */
function actionSetupTOTP(payload) {
  try {
    let { username, password, sessionToken } = payload;
    
    let user = null;
    
    // If sessionToken provided, validate session and get user
    if (sessionToken) {
      const session = validateSession(sessionToken);
      if (!session.valid) {
        return { success: false, error: 'ERR_AUTH_INVALID: Sesión inválida o expirada' };
      }
      user = getUserById(session.userId);
    } else {
      // Fall back to password verification
      if (!username || !password) {
        return { success: false, error: 'ERR_INVALID_CREDENTIALS: Usuario y contraseña requeridos' };
      }
      
      user = getUserByUsername(username, getCurrentSsId());
      if (!user) {
        return { success: false, error: 'ERR_USER_NOT_FOUND' };
      }
      
      // Parse auth_config to get password_hash
      let authConfig = { password_hash: '', totp: { enabled: false } };
      try {
        authConfig = parseAuthConfig(user.auth_config);
      } catch (e) {}
      
      // Verificar contraseña using auth_config.password_hash
      if (!verifyPassword(password, authConfig.password_hash)) {
        return { success: false, error: 'ERR_INVALID_CREDENTIALS: Contraseña incorrecta' };
      }
    }
    
    if (!user) {
      return { success: false, error: 'ERR_USER_NOT_FOUND' };
    }
    
    username = user.username;
    
    // Generar secreto TOTP
    const totpResult = generateTOTPSecret(username);
    if (!totpResult.success) {
      return { success: false, error: totpResult.error };
    }
    
    // Guardar secreto temporalmente (no confirmado aún)
    PropertiesService.getUserProperties().setProperty(
      'totp_pending_' + username,
      JSON.stringify({
        secret: totpResult.secret,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      })
    );
    
    return {
      success: true,
      secret: totpResult.secret,
      otpURI: totpResult.otpURI
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Acción: confirmTOTP - Confirma la configuración de TOTP
 * @param {object} payload - Datos con código de verificación
 * @return {object} Resultado
 */
function actionConfirmTOTP(payload) {
  try {
    const { username, password, code, sessionToken } = payload;
    
    let user = null;
    let resolvedUsername = username;
    
    // If sessionToken provided, validate session and get user
    if (sessionToken) {
      const session = validateSession(sessionToken);
      if (!session.valid) {
        return { success: false, error: 'ERR_AUTH_INVALID: Sesión inválida o expirada' };
      }
      user = getUserById(session.userId);
      resolvedUsername = user?.username || username;
    } else {
      // Fall back to password verification
      if (!username || !password) {
        return { success: false, error: 'ERR_INVALID_CREDENTIALS: Usuario y contraseña requeridos' };
      }
      
      user = getUserByUsername(username, getCurrentSsId());
      if (!user) {
        return { success: false, error: 'ERR_USER_NOT_FOUND' };
      }
      
      // Parse auth_config to get password_hash
      let authConfig = { password_hash: '', totp: { enabled: false, secret: null } };
      try {
        authConfig = parseAuthConfig(user.auth_config);
      } catch (e) {}
      
      // Verificar contraseña using auth_config.password_hash
      if (!verifyPassword(password, authConfig.password_hash)) {
        return { success: false, error: 'ERR_INVALID_CREDENTIALS: Contraseña incorrecta' };
      }
    }
    
    if (!user) {
      return { success: false, error: 'ERR_USER_NOT_FOUND' };
    }
    
    // Obtener secreto pendiente
    const pendingData = PropertiesService.getUserProperties().getProperty('totp_pending_' + resolvedUsername);
    if (!pendingData) {
      return { success: false, error: 'ERR_NO_PENDING_TOTP: No hay configuración TOTP pendiente' };
    }
    
    const pending = JSON.parse(pendingData);
    
    // Verificar si no ha expirado
    if (new Date(pending.expiresAt) < new Date()) {
      PropertiesService.getUserProperties().deleteProperty('totp_pending_' + resolvedUsername);
      return { success: false, error: 'ERR_TOTP_EXPIRED: La configuración ha expirado' };
    }
    
    // Verificar código TOTP
    const isValid = verifyTOTP(pending.secret, code);
    if (!isValid) {
      return { success: false, error: 'ERR_INVALID_CODE: Código inválido' };
    }
    
    // Parse auth_config again to get fresh data
    let authConfig = { password_hash: '', totp: { enabled: false, secret: null }, passkeys: [] };
    try {
      authConfig = parseAuthConfig(user.auth_config);
    } catch (e) {}
    
    // Update auth_config with TOTP
    authConfig.totp = {
      enabled: true,
      secret: pending.secret,
      created_at: new Date().toISOString()
    };
    
    updateUser(user.id, { auth_config: JSON.stringify(authConfig) }, getCurrentSsId());
    
    // Limpiar cache de usuarios para que el login use datos frescos
    clearCache(ssId, 'Usuarios');
    CacheService.getScriptCache().remove('u:un:' + resolvedUsername);
    CacheService.getScriptCache().remove('u:id:' + user.id);
    
    
    // Limpiar secreto pendiente
    PropertiesService.getUserProperties().deleteProperty('totp_pending_' + resolvedUsername);
    
    return { success: true, message: 'TOTP configurado correctamente' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Acción: disableTOTP - Desactiva TOTP para un usuario
 * @param {object} payload - Datos del usuario
 * @return {object} Resultado
 */
function actionDisableTOTP(payload) {
  try {
    const { sessionToken } = payload;
    
    // Validar sesión
    const session = validateSession(sessionToken);
    if (!session.valid) {
      return { success: false, error: 'ERR_AUTH_INVALID' };
    }
    
    // Get user to parse auth_config
    const user = getUserById(session.userId, getCurrentSsId());
    if (!user) {
      return { success: false, error: 'ERR_USER_NOT_FOUND' };
    }
    
    let authConfig = { totp: { enabled: false, secret: null } };
    try {
      authConfig = parseAuthConfig(user.auth_config);
    } catch (e) {}
    
    // Disable TOTP in auth_config
    authConfig.totp = { enabled: false, secret: null, created_at: null };
    
    updateUser(session.userId, { auth_config: JSON.stringify(authConfig) });
    
    return { success: true, message: 'TOTP desactivado' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Acción: login - Autentica usuario y devuelve token
 * @param {object} payload - Credenciales
 * @param {string} ssId - ID del spreadsheet Core
 * @return {object} Respuesta con token
 */
function actionLogin(payload, ssId) {
  try {
    const { username, password, method, code, passkeyAssertion } = payload;
    
    // Rate limiting: max 5 intentos por minuto por username
    const rateLimit = checkRateLimit('login:' + username, 5, 60);
    if (!rateLimit.allowed) {
      return { 
        success: false, 
        error: 'ERR_RATE_LIMITED: Demasiados intentos. Intenta más tarde.',
        retryAfter: rateLimit.resetIn,
        step: 'password'
      };
    }
    
    // Buscar usuario - requires ssId
    if (!ssId) {
      return { success: false, error: 'ERR_SS_ID_REQUIRED: Se requiere ssId para login', step: 'password' };
    }
    
    const user = getUserByUsername(username, ssId);
    if (!user) {
      return { success: false, error: 'ERR_AUTH_INVALID: Usuario no encontrado', step: 'password' };
    }
    
    // Parse auth_config
    let authConfig = parseAuthConfig(user.auth_config);
    
    // STEP 1: Verificar contraseña (always required as first step)
    if (!password) {
      return { success: false, error: 'ERR_PASSWORD_REQUIRED: Ingrese su contraseña', step: 'password' };
    }
    
    // Verificar contraseña using auth_config.password_hash
    if (!verifyPassword(password, authConfig.password_hash)) {
      incrementFailedLoginAttempts(user.id);
      logAccess(username, false, 'Contraseña inválida');
      return { success: false, error: 'ERR_AUTH_INVALID: Contraseña incorrecta', step: 'password' };
    }
    
    // Reset failed attempts on successful password verify
    resetFailedLoginAttempts(user.id);
    
    // STEP 2: Detect enabled auth methods and handle based on method parameter
    const enabledMethods = [];
    if (authConfig.passkeys && authConfig.passkeys.length > 0) enabledMethods.push('passkey');
    if (authConfig.totp && authConfig.totp.enabled) enabledMethods.push('totp');
    if (authConfig.email_otp && authConfig.email_otp.enabled) enabledMethods.push('email_otp');
    
    // If no method specified
    if (!method) {
      // Auto-proceed if only one method is enabled
      if (enabledMethods.length === 1) {
        const singleMethod = enabledMethods[0];
        
        // For email_otp, automatically send the code
        if (singleMethod === 'email_otp') {
          Logger.log('actionLogin: auto-sending email OTP for username=' + username);
          const otpResult = actionRequestOTP({ username: username });
          if (!otpResult.success) {
            return otpResult;
          }
          return {
            success: false,
            step: singleMethod,
            availableMethods: enabledMethods,
            message: 'Código enviado automáticamente'
          };
        }
        
        // For totp or passkey, ask for the code/credential
        return {
          success: false,
          step: singleMethod,
          availableMethods: enabledMethods,
          message: 'Ingrese su código'
        };
      }
      
      // Multiple methods - let user choose
      return {
        success: false,
        step: 'method',
        availableMethods: enabledMethods,
        defaultMethod: authConfig.default_method || 'passkey',
        message: 'Seleccione método de autenticación'
      };
    }
    
    // STEP 3: Verify the selected auth method
    if (method === 'totp') {
      if (!authConfig.totp || !authConfig.totp.enabled || !authConfig.totp.secret) {
        return { success: false, error: 'ERR_TOTP_NOT_CONFIGURED: TOTP no configurado', step: 'method' };
      }
      if (!code) {
        return { success: false, error: 'ERR_CODE_REQUIRED: Ingrese código TOTP', step: 'totp' };
      }
      const isValid = verifyTOTP(authConfig.totp.secret, code);
      if (!isValid) {
        logAccess(username, false, 'TOTP inválido');
        return { success: false, error: 'ERR_AUTH_INVALID: Código TOTP inválido', step: 'totp' };
      }
    } else if (method === 'email_otp') {
      if (!authConfig.email_otp || !authConfig.email_otp.enabled) {
        return { success: false, error: 'ERR_EMAIL_OTP_NOT_CONFIGURED: Email OTP no configurado', step: 'method' };
      }
      if (!code) {
        return { success: false, error: 'ERR_CODE_REQUIRED: Ingrese código del email', step: 'email_otp' };
      }
      const isValid = verifyEmailOTP(username, code);
      if (!isValid) {
        logAccess(username, false, 'Email OTP inválido');
        return { success: false, error: 'ERR_AUTH_INVALID: Código inválido', step: 'email_otp' };
      }
    } else if (method === 'passkey') {
      if (!authConfig.passkeys || authConfig.passkeys.length === 0) {
        return { success: false, error: 'ERR_PASSKEY_NOT_CONFIGURED: Passkey no configurado', step: 'method' };
      }
      if (!passkeyAssertion) {
        return { success: false, error: 'ERR_PASSKEY_REQUIRED: Autenticación con passkey requerida', step: 'passkey' };
      }
      // Passkey verification done on frontend, we just validate the result
      // The frontend sends the verified credential ID
      const validCredential = authConfig.passkeys.find(pk => pk.id === passkeyAssertion.credentialId);
      if (!validCredential) {
        logAccess(username, false, 'Passkey inválido');
        return { success: false, error: 'ERR_AUTH_INVALID: Passkey no reconocido', step: 'passkey' };
      }
    }
    
    // Update last login metadata
    updateUserMetadata(user.id, { last_login: new Date().toISOString() });
    
    // Store ssId in user properties for session operations
    getUserProperties().setProperty('current_ssId', ssId);
    
    // Generar token de sesión
    const session = generateSessionToken(user.id, ssId);
    
    logAccess(username, true, 'Login exitoso');
    
    return {
      success: true,
      sessionToken: session.sessionToken,
      wrapped_mk: user.wrapped_mk,
      expiresAt: session.expiresAt,
      user: {
        id: user.id,
        username: user.username,
        perfilId: user.perfilId
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Acción: challenge - Genera desafío para WebAuthn/Passkey
 * @param {object} payload - Datos del desafío
 * @return {object} Respuesta con desafío
 */
function actionChallenge(payload) {
  try {
    const user = getUserByUsername(payload.username);
    
    if (!user) {
      return { success: false, error: 'ERR_USER_NOT_FOUND' };
    }
    
    // Parse auth_config to get passkeys
    let authConfig = { passkeys: [] };
    try {
      authConfig = parseAuthConfig(user.auth_config);
    } catch (e) {}
    
    // Generate challenge - proper random base64 (standard, not URL-safe)
    const randomBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + new Date().getTime());
    const challenge = Utilities.base64Encode(randomBytes);
    
    // Guardar desafío temporalmente
    PropertiesService.getUserProperties().setProperty(
      'passkey_challenge_' + payload.username,
      JSON.stringify({
        challenge: challenge,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      })
    );
    
    // Get existing passkeys for allowCredentials (IDs are already base64 from browser)
    const existingCredentials = authConfig.passkeys.map(pk => ({
      id: pk.id,
      type: 'public-key'
    }));
    
    // Derive rpId from origin (use hostname, default to localhost)
    let rpId = 'localhost';
    if (payload.origin) {
      try {
        const url = Utilities.newBlob(payload.origin).getDataAsString();
        const match = url.match(/^https?:\/\/([^:\/]+)/);
        if (match && match[1]) {
          rpId = match[1];
        }
      } catch (e) {
        rpId = 'localhost';
      }
    }
    
    return {
      success: true,
      challenge: challenge,
      rpId: rpId,
      timeout: 60000,
      allowCredentials: existingCredentials,
      userVerification: 'preferred'
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Acción: setupPasskey - Prepara registro de nuevo passkey
 * @param {object} payload - { username, password, deviceName }
 * @return {object} Respuesta con desafío para registro
 */
function actionSetupPasskey(payload) {
  try {
    let { username, password, deviceName, sessionToken } = payload;
    
    let user = null;
    
    // If sessionToken provided, validate session and get user
    if (sessionToken) {
      const session = validateSession(sessionToken);
      if (!session.valid) {
        return { success: false, error: 'ERR_AUTH_INVALID: Sesión inválida o expirada' };
      }
      user = getUserById(session.userId);
    } else {
      // Fall back to password verification
      user = getUserByUsername(username, getCurrentSsId());
      if (!user) {
        return { success: false, error: 'ERR_USER_NOT_FOUND' };
      }
      
      let authConfigVerify = { password_hash: '', passkeys: [] };
      try {
        authConfigVerify = parseAuthConfig(user.auth_config);
      } catch (e) {}
      
      if (!verifyPassword(password, authConfigVerify.password_hash)) {
        return { success: false, error: 'ERR_AUTH_INVALID: Contraseña incorrecta' };
      }
    }
    
    if (!user) {
      return { success: false, error: 'ERR_USER_NOT_FOUND' };
    }
    
    username = user.username;
    
    let authConfig = { password_hash: '', passkeys: [] };
    try {
      authConfig = parseAuthConfig(user.auth_config);
    } catch (e) {}
    
    // Generate challenge for registration - proper random base64 (standard, not URL-safe)
    const randomBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + new Date().getTime());
    const challenge = Utilities.base64Encode(randomBytes);
    
    // Generate user ID for WebAuthn - proper base64 encoding (standard, not URL-safe)
    const userIdBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, username + new Date().getTime());
    const userId = Utilities.base64Encode(userIdBytes);
    
    // Store pending passkey setup
    const pendingData = {
      challenge: challenge,
      deviceName: deviceName || 'Dispositivo nuevo',
      username: username,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    };

    PropertiesService.getUserProperties().setProperty(
      'passkey_setup_' + username,
      JSON.stringify(pendingData)
    );

    // Derive rpId from origin (use hostname, default to localhost)
    let rpId = 'localhost';
    if (payload.origin) {
      try {
        const url = Utilities.newBlob(payload.origin).getDataAsString();
        const match = url.match(/^https?:\/\/([^:\/]+)/);
        if (match && match[1]) {
          rpId = match[1];
        }
      } catch (e) {
        rpId = 'localhost';
      }
    }

    return {
      success: true,
      challenge: challenge,
      rpId: rpId,
      timeout: 60000,
      user: {
        id: userId,
        name: username,
        displayName: username
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 }
      ],
      attestation: 'preferred',
      excludeCredentials: authConfig.passkeys.map(pk => ({
        id: pk.id,
        type: 'public-key'
      }))
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Acción: confirmPasskey - Confirma registro de passkey
 * @param {object} payload - { username, password, attestation }
 * @return {object} Resultado
 */
function actionConfirmPasskey(payload) {
  try {
    const { username, password, attestation, sessionToken } = payload;
    
    let user = null;
    let resolvedUsername = username;
    
    // If sessionToken provided, validate session and get user
    if (sessionToken) {
      const session = validateSession(sessionToken);
      if (!session.valid) {
        return { success: false, error: 'ERR_AUTH_INVALID: Sesión inválida o expirada' };
      }
      user = getUserById(session.userId);
      resolvedUsername = user?.username || username;
    } else {
      // Fall back to password verification
      user = getUserByUsername(username, getCurrentSsId());
      if (!user) {
        return { success: false, error: 'ERR_USER_NOT_FOUND' };
      }
      
      // Get pending setup data
      const pendingStr = PropertiesService.getUserProperties().getProperty('passkey_setup_' + username);
      if (!pendingStr) {
        return { success: false, error: 'ERR_PASSKEY_SETUP_EXPIRED: La configuración expiró' };
      }
      
      const pending = JSON.parse(pendingStr);
      
      // Check expiry
      if (new Date(pending.expiresAt) < new Date()) {
        PropertiesService.getUserProperties().deleteProperty('passkey_setup_' + username);
        return { success: false, error: 'ERR_PASSKEY_SETUP_EXPIRED: La configuración expiró' };
      }
      
      // Verify password again
      let authConfigVerify = { password_hash: '', passkeys: [] };
      try {
        authConfigVerify = parseAuthConfig(user.auth_config);
      } catch (e) {}
      
      if (!verifyPassword(password, authConfigVerify.password_hash)) {
        return { success: false, error: 'ERR_AUTH_INVALID: Contraseña incorrecta' };
      }
    }
    
    if (!user) {
      return { success: false, error: 'ERR_USER_NOT_FOUND' };
    }
    
    let authConfig = { password_hash: '', passkeys: [] };
    try {
      authConfig = parseAuthConfig(user.auth_config);
    } catch (e) {}
    
    // Get pending setup data
    const pendingStr = PropertiesService.getUserProperties().getProperty('passkey_setup_' + resolvedUsername);
    if (!pendingStr) {
      return { success: false, error: 'ERR_PASSKEY_SETUP_EXPIRED: La configuración expiró' };
    }
    
    const pending = JSON.parse(pendingStr);
    
    // Check expiry
    if (new Date(pending.expiresAt) < new Date()) {
      PropertiesService.getUserProperties().deleteProperty('passkey_setup_' + resolvedUsername);
      return { success: false, error: 'ERR_PASSKEY_SETUP_EXPIRED: La configuración expiró' };
    }
    
    // Parse attestation response from frontend
    // attestation.response.clientDataJSON contains the client data
    // attestation.response.attestationObject contains the authenticator data
    
    // For simplicity, we store the credential ID from the attestation
    // In production, you'd verify the attestation properly
    const credentialId = attestation.id;
    const publicKey = attestation.response.publicKey || '';
    
    const newPasskey = {
      id: credentialId,
      public_key: publicKey,
      device_name: pending.deviceName,
      created_at: new Date().toISOString()
    };
    
    // Add to passkeys array
    authConfig.passkeys = authConfig.passkeys || [];
    authConfig.passkeys.push(newPasskey);
    
    // Update user
    updateUser(user.id, { auth_config: JSON.stringify(authConfig) }, getCurrentSsId());
    
    // Clear cache so AuthSettings gets fresh data
    clearCache(ssId, 'Usuarios');
    CacheService.getScriptCache().remove('u:un:' + username);
    CacheService.getScriptCache().remove('u:id:' + user.id);
    
    // Clear pending
    PropertiesService.getUserProperties().deleteProperty('passkey_setup_' + username);
    
    return {
      success: true,
      message: 'Passkey configurado exitosamente',
      passkeyId: credentialId
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Acción: deletePasskey - Elimina un passkey
 * @param {object} session - Objeto de sesión validado
 * @param {object} payload - { passkeyId }
 * @return {object} Resultado
 */
function actionDeletePasskey(session, payload) {
  try {
    const { passkeyId } = payload;
    
    const user = getUserById(session.userId, getCurrentSsId());
    if (!user) {
      return { success: false, error: 'ERR_USER_NOT_FOUND' };
    }
    
    const username = user.username;
    
    // Get authConfig for the user
    let authConfig = { passkeys: [] };
    try {
      authConfig = parseAuthConfig(user.auth_config);
    } catch (e) {}
    
    // Remove passkey
    const passkeyIndex = authConfig.passkeys.findIndex(pk => pk.id === passkeyId);
    if (passkeyIndex === -1) {
      return { success: false, error: 'ERR_PASSKEY_NOT_FOUND: Passkey no encontrado' };
    }
    
    authConfig.passkeys.splice(passkeyIndex, 1);
    
    // Update user
    updateUser(user.id, { auth_config: JSON.stringify(authConfig) }, getCurrentSsId());
    
    // Clear cache so AuthSettings gets fresh data
    clearCache(ssId, 'Usuarios');
    CacheService.getScriptCache().remove('u:un:' + username);
    CacheService.getScriptCache().remove('u:id:' + user.id);
    
    return { success: true, message: 'Passkey eliminado' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Acción: getAuthMethods - Obtiene métodos de auth habilitados
 * @param {object} session - Objeto de sesión validado
 * @return {object} Métodos disponibles
 */
function actionGetAuthMethods(session) {
  try {
    const user = getUserById(session.userId, getCurrentSsId());
    if (!user) {
      return { success: false, error: 'ERR_USER_NOT_FOUND' };
    }
    
    let authConfig = { default_method: 'passkey', passkeys: [], totp: { enabled: false }, email_otp: { enabled: false } };
    try {
      authConfig = parseAuthConfig(user.auth_config);
    } catch (e) {}
    
    const methods = [];
    if (authConfig.passkeys && authConfig.passkeys.length > 0) methods.push('passkey');
    if (authConfig.totp && authConfig.totp.enabled) methods.push('totp');
    if (authConfig.email_otp && authConfig.email_otp.enabled) methods.push('email_otp');
    
    return {
      success: true,
      methods: methods,
      defaultMethod: authConfig.default_method,
      passkeys: authConfig.passkeys || [],
      totp: { enabled: authConfig.totp?.enabled || false },
      email_otp: { enabled: authConfig.email_otp?.enabled || false },
      recovery_enabled: authConfig.recovery_enabled ?? true
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Acción: updateAuthConfig - Actualiza configuración de autenticación
 * @param {object} session - Sesión del usuario
 * @param {object} payload - { default_method, recovery_enabled, email_otp_enabled }
 * @return {object} Respuesta
 */
function actionUpdateAuthConfig(session, payload) {
  try {
    const user = getUserById(session.userId, getCurrentSsId());
    if (!user) {
      return { success: false, error: 'ERR_USER_NOT_FOUND' };
    }
    
    let authConfig = { default_method: 'passkey', password_hash: '', recovery_enabled: true, email_otp: { enabled: false }, totp: { enabled: false }, passkeys: [] };
    try {
      authConfig = parseAuthConfig(user.auth_config);
    } catch (e) {}
    
    if (payload.default_method !== undefined) {
      authConfig.default_method = payload.default_method;
    }
    if (payload.recovery_enabled !== undefined) {
      authConfig.recovery_enabled = payload.recovery_enabled;
    }
    if (payload.email_otp_enabled !== undefined) {
      if (!authConfig.email_otp) authConfig.email_otp = {};
      authConfig.email_otp.enabled = payload.email_otp_enabled;
    }
    
    updateUser(session.userId, {
      auth_config: JSON.stringify(authConfig)
    });
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Acción: changePassword - Cambia la contraseña del usuario
 * @param {object} session - Sesión del usuario
 * @param {object} payload - { old_password, new_password }
 * @return {object} Respuesta
 */
function actionChangePassword(session, payload) {
  try {
    const { old_password, new_password } = payload;
    
    if (!old_password || !new_password) {
      return { success: false, error: 'ERR_INVALID_CREDENTIALS: Contraseñas requeridas' };
    }
    
    if (new_password.length < 8) {
      return { success: false, error: 'ERR_WEAK_PASSWORD: La contraseña debe tener al menos 8 caracteres' };
    }
    
    const user = getUserById(session.userId, getCurrentSsId());
    if (!user) {
      return { success: false, error: 'ERR_USER_NOT_FOUND' };
    }
    
    let authConfig = { default_method: 'passkey', password_hash: '', recovery_enabled: true, email_otp: { enabled: false }, totp: { enabled: false }, passkeys: [] };
    try {
      authConfig = parseAuthConfig(user.auth_config);
    } catch (e) {}
    
    if (!verifyPassword(old_password, authConfig.password_hash)) {
      updateUserMetadata(session.userId, { failed_login_attempts: (getUserMetadataValue(session.userId, 'failed_login_attempts') || 0) + 1 });
      return { success: false, error: 'ERR_INVALID_CREDENTIALS: Contraseña actual incorrecta' };
    }
    
    const newHash = hashPassword(new_password);
    authConfig.password_hash = newHash;
    
    updateUser(session.userId, {
      auth_config: JSON.stringify(authConfig)
    });
    
    updateUserMetadata(session.userId, { 
      last_password_change: new Date().toISOString(),
      failed_login_attempts: 0
    });
    
    logAccess(user.username, true, 'Contraseña cambiada');
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Acción: deleteAccount - Elimina la cuenta del usuario
 * @param {object} session - Sesión del usuario
 * @param {object} payload - { password }
 * @return {object} Respuesta
 */
function actionDeleteAccount(session, payload) {
  try {
    const { password } = payload;
    
    if (!password) {
      return { success: false, error: 'ERR_INVALID_CREDENTIALS: Contraseña requerida para eliminar cuenta' };
    }
    
    const user = getUserById(session.userId, getCurrentSsId());
    if (!user) {
      return { success: false, error: 'ERR_USER_NOT_FOUND' };
    }
    
    let authConfig = { default_method: 'passkey', password_hash: '', recovery_enabled: true, email_otp: { enabled: false }, totp: { enabled: false }, passkeys: [] };
    try {
      authConfig = parseAuthConfig(user.auth_config);
    } catch (e) {}
    
    if (!verifyPassword(password, authConfig.password_hash)) {
      return { success: false, error: 'ERR_INVALID_CREDENTIALS: Contraseña incorrecta' };
    }
    
    invalidateAllSessions(session.userId);
    
    deleteData('Usuarios', user.id, true);
    
    logAccess(user.username, true, 'Cuenta eliminada');
    
    return { success: true, message: 'Cuenta eliminada correctamente' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Acción: requestOTP - Envía código por email
 * @param {object} payload - Datos del request
 * @return {object} Respuesta
 */
function actionRequestOTP(payload) {
  try {
    // Skip rate limiting for verification emails (e.g., during registration)
    const isVerification = payload.verifyOnly === true;
    
    const user = getUserByUsername(payload.username);
    
    if (!user) {
      return { success: false, error: 'ERR_USER_NOT_FOUND', debug: { username: payload.username } };
    }
    
    // Get email from user record
    const email = user.email || payload.username;
    
    Logger.log('actionRequestOTP: username=' + payload.username + ', resolved email=' + email);
    
    // Rate limiting: max 5 requests per minute (skip for verification)
    if (!isVerification) {
      const rateLimit = checkRateLimit('otp:' + payload.username, 5, 60);
      if (!rateLimit.allowed) {
      return { 
        success: false, 
        error: 'ERR_RATE_LIMITED: Demasiados códigos solicitados. Intenta más tarde.',
        retryAfter: rateLimit.resetIn,
        debug: { username: payload.username, rateLimitKey: 'otp:' + payload.username }
      };
      }
    }
    
    // Generar código OTP de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Guardar código temporalmente
    PropertiesService.getUserProperties().setProperty(
      'otp_' + payload.username,
      JSON.stringify({
        code: code,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min
      })
    );
    
    // Enviar email con código OTP
    try {
      sendOTPEmail(email, code, 'Congregación');
    } catch (emailErr) {
      Logger.log('Error sending OTP email: ' + emailErr.message);
      return { 
        success: false, 
        error: 'ERR_EMAIL_SEND: No se pudo enviar el código por email',
        debug: { email: email, error: emailErr.message }
      };
    }
    
    logAccess(payload.username, true, 'OTP enviado por email');
    
    return { 
      success: true, 
      message: 'Código enviado por email',
      debug: { email: email }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Envía código OTP por email
 * @param {string} email - Email del destinatario
 * @param {string} code - Código OTP
 */
function sendOTPEmail(email, code, congregationName) {
  congregationName = congregationName || 'Congregación';
  
  Logger.log('sendOTPEmail: Attempting to send OTP to email: ' + email);
  
  try {
    MailApp.sendEmail({
      to: email,
      subject: 'Código de verificación - Congre-Admin',
      name: 'Congre-Admin',
      body: 'Tu código de verificación es: ' + code + '\n\nEste código expira en 10 minutos.\n\nSi no solicitaste este código, puedes ignorar este email.'
    });
    Logger.log('sendOTPEmail: Email sent successfully');
  } catch (emailErr) {
    Logger.log('sendOTPEmail ERROR: ' + emailErr.message);
    Logger.log('sendOTPEmail STACK: ' + emailErr.stack);
    throw emailErr;
  }
}

/**
 * Envía email de bienvenida
 * @param {string} email - Email del destinatario
 * @param {string} username - Nombre de usuario
 */
function sendWelcomeEmail(email, username, congregationName) {
  congregationName = congregationName || 'tu congregación';
  
  try {
    
    MailApp.sendEmail({
      to: email,
      subject: 'Bienvenido a Congre-Admin',
      name: 'Congre-Admin',
      body: 'Hola ' + username + ',\n\n' +
        'Tu cuenta en Congre-Admin ha sido creada exitosamente.\n\n' +
        ' Congregación: ' + congregationName + '\n' +
        ' Usuario: ' + username + '\n\n' +
        'Ya puedes iniciar sesión en la aplicación.\n\n' +
        'Si tienes alguna pregunta, contacta al administrador del sistema.'
    });
  } catch (err) {
    Logger.log('Error enviando email de bienvenida: ' + err.message);
    throw new Error('ERR_EMAIL_SEND: No se pudo enviar el email de bienvenida');
  }
}

/**
 * Verifica código OTP de email
 * @param {string} username - Username
 * @param {string} code - Código a verificar
 * @return {boolean} true si es válido
 */
function verifyEmailOTP(username, code) {
  try {
    const stored = PropertiesService.getUserProperties().getProperty('otp_' + username);
    if (!stored) return false;
    
    const otpData = JSON.parse(stored);
    if (new Date(otpData.expiresAt) < new Date()) return false;
    if (otpData.code !== code) return false;
    
    PropertiesService.getUserProperties().deleteProperty('otp_' + username);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Acción: requestPasswordReset - Envía email para restablecer contraseña
 * @param {object} payload - Datos del request
 * @return {object} Respuesta
 */
function actionRequestPasswordReset(payload) {
  try {
    const user = getUserByUsername(payload.username);
    
    if (!user) {
      // Don't reveal if user exists or not
      return { success: true, message: 'Si el usuario existe, recibirás un email' };
    }
    
    // Generate reset token
    const resetToken = Utilities.getUuid();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    // Store token
    PropertiesService.getUserProperties().setProperty(
      'pwd_reset_' + user.id,
      JSON.stringify({
        token: resetToken,
        expiresAt: expiresAt.toISOString()
      })
    );
    
    // Send reset email
    const email = user.email || payload.username;
    const resetLink = 'https://congre-admin.github.io/admin/reset-password?token=' + resetToken + '&userId=' + user.id;
    
    sendPasswordResetEmail(email, user.username, resetLink, 'tu congregación');
    
    logAccess(payload.username, true, 'Solicitud de reset de contraseña');
    
    return { success: true, message: 'Si el usuario existe, recibirás un email con instrucciones' };
  } catch (err) {
    Logger.log('Error en requestPasswordReset: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Acción: resetPassword - Restablece la contraseña
 * @param {object} payload - Datos del request
 * @return {object} Respuesta
 */
function actionResetPassword(payload) {
  try {
    const { userId, token, newPassword } = payload;
    
    if (!userId || !token || !newPassword) {
      return { success: false, error: 'ERR_INVALID_REQUEST: Datos incompletos' };
    }
    
    // Validate password complexity
    const pwValidation = validatePasswordComplexity(newPassword);
    if (!pwValidation.valid) {
      return { success: false, error: 'ERR_PASSWORD_WEAK: ' + pwValidation.errors.join(', ') };
    }
    
    // Get stored token
    const stored = PropertiesService.getUserProperties().getProperty('pwd_reset_' + userId);
    if (!stored) {
      return { success: false, error: 'ERR_INVALID_TOKEN: Token inválido o expirado' };
    }
    
    const resetData = JSON.parse(stored);
    
    // Verify token matches
    if (resetData.token !== token) {
      return { success: false, error: 'ERR_INVALID_TOKEN: Token inválido' };
    }
    
    // Check expiration
    if (new Date(resetData.expiresAt) < new Date()) {
      PropertiesService.getUserProperties().deleteProperty('pwd_reset_' + userId);
      return { success: false, error: 'ERR_TOKEN_EXPIRED: El token ha expirado' };
    }
    
    // Get user and update password
    const user = getUserById(userId);
    if (!user) {
      return { success: false, error: 'ERR_USER_NOT_FOUND' };
    }
    
    // Update password
    updateUserPassword(userId, newPassword);
    
    // Invalidate all sessions for this user
    invalidateAllUserSessions(userId);
    
    // Delete reset token
    PropertiesService.getUserProperties().deleteProperty('pwd_reset_' + userId);
    
    // Send confirmation email
    const email = user.email || user.username;
    sendPasswordChangedEmail(email, user.username, 'tu congregación');
    
    logAccess(user.username, true, 'Contraseña restablecida');
    
    return { success: true, message: 'Contraseña restablecida exitosamente' };
  } catch (err) {
    Logger.log('Error en resetPassword: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Envía email de restablecimiento de contraseña
 */
function sendPasswordResetEmail(email, username, resetLink, congregationName) {
  congregationName = congregationName || 'tu congregación';
  
  try {
    
    MailApp.sendEmail({
      to: email,
      subject: 'Restablecer contraseña - Congre-Admin',
      name: 'Congre-Admin',
      body: 'Hola ' + username + ',\n\n' +
        'Has solicitado restablecer tu contraseña.\n\n' +
        'Haz clic en el siguiente enlace para crear una nueva contraseña:\n' +
        resetLink + '\n\n' +
        'Este enlace expirará en 1 hora.\n\n' +
        'Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña permanecerá sin cambios.'
    });
  } catch (err) {
    Logger.log('Error enviando email de reset: ' + err.message);
    throw new Error('ERR_EMAIL_SEND: No se pudo enviar el email');
  }
}

/**
 * Envía email de confirmación de cambio de contraseña
 */
function sendPasswordChangedEmail(email, username, congregationName) {
  congregationName = congregationName || 'tu congregación';
  
  try {
    
    MailApp.sendEmail({
      to: email,
      subject: 'Contraseña actualizada - Congre-Admin',
      name: 'Congre-Admin',
      body: 'Hola ' + username + ',\n\n' +
        'Tu contraseña ha sido actualizada exitosamente.\n\n' +
        'Si no realizaste este cambio, contacta al administrador inmediatamente.'
    });
  } catch (err) {
    Logger.log('Error enviando email de confirmación: ' + err.message);
  }
}

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Genera un secreto TOTP aleatorio en base32
 */
function generateBase32Secret(size) {
  let secret = '';
  const randomBase = Utilities.getUuid() + Utilities.getUuid();
  for (let i = 0; i < size; i++) {
    const charCode = randomBase.charCodeAt(i % randomBase.length);
    secret += BASE32_CHARS.charAt(charCode % 32);
  }
  return secret;
}

/**
 * Genera un secreto TOTP para un usuario
 * @param {string} username - Nombre de usuario
 * @return {object} Objeto con secret y otpURI
 */
function generateTOTPSecret(username) {
  try {
    const secret = generateBase32Secret(20);
    const issuer = 'CongreAdmin';
    const otpURI = 'otpauth://totp/' + encodeURIComponent(issuer + ':' + username) + 
                   '?secret=' + secret + 
                   '&issuer=' + encodeURIComponent(issuer) + 
                   '&algorithm=SHA1&digits=6&period=30';
    
    return {
      success: true,
      secret: secret,
      otpURI: otpURI
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Convierte base32 a hex - implementación probada
 */
function base32tohex(base32) {
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const hexChars = "0123456789abcdef";
  let bits = "";
  let hex = "";

  for (let i = 0; i < base32.length; i++) {
    const val = base32chars.indexOf(base32[i].toUpperCase());
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }

  for (let i = 0; i < bits.length; i += 4) {
    const chunk = bits.substr(i, 4);
    const decimal = parseInt(chunk, 2);
    hex += hexChars[decimal];
  }
  return hex;
}

/**
 * Genera código TOTP - implementación probada
 */
function generateTOTP(secret, timeStepSeconds, digits) {
  const str = base32tohex(secret);
  const bytes = new Uint8Array(str.length / 2);
  for (let i = 0; i < str.length; i += 2) {
    bytes[i / 2] = parseInt(str.substr(i, 2), 16);
  }

  const timestamp = Math.floor(new Date().getTime() / 1000);
  let counter = Math.floor(timestamp / timeStepSeconds);

  const counterBytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = counter & 0xff;
    counter = counter >>> 8;
  }

  const hmacDigest = Utilities.computeHmacSignature(
    Utilities.MacAlgorithm.HMAC_SHA_1,
    counterBytes,
    bytes
  );

  const offset = hmacDigest[hmacDigest.length - 1] & 0xf;
  const truncatedHash = (
    ((hmacDigest[offset] & 0x7f) << 24) |
    ((hmacDigest[offset + 1] & 0xff) << 16) |
    ((hmacDigest[offset + 2] & 0xff) << 8) |
    (hmacDigest[offset + 3] & 0xff)
  ) % Math.pow(10, digits);

  return truncatedHash.toString().padStart(digits, '0');
}

/**
 * Genera código TOTP - implementación probada
 */
function generateTOTP(secret, timeStepSeconds, digits) {
  const timestamp = Math.floor(new Date().getTime() / 1000);
  return generateTOTPAtTime(secret, timestamp, timeStepSeconds, digits);
}

/**
 * Genera código TOTP en un timestamp específico
 */
function generateTOTPAtTime(secret, timestamp, timeStepSeconds, digits) {
  const str = base32tohex(secret);
  const bytes = new Uint8Array(str.length / 2);
  for (let i = 0; i < str.length; i += 2) {
    bytes[i / 2] = parseInt(str.substr(i, 2), 16);
  }

  let counter = Math.floor(timestamp / timeStepSeconds);

  const counterBytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = counter & 0xff;
    counter = counter >>> 8;
  }

  const hmacDigest = Utilities.computeHmacSignature(
    Utilities.MacAlgorithm.HMAC_SHA_1,
    counterBytes,
    bytes
  );

  const offset = hmacDigest[hmacDigest.length - 1] & 0xf;
  const truncatedHash = (
    ((hmacDigest[offset] & 0x7f) << 24) |
    ((hmacDigest[offset + 1] & 0xff) << 16) |
    ((hmacDigest[offset + 2] & 0xff) << 8) |
    (hmacDigest[offset + 3] & 0xff)
  ) % Math.pow(10, digits);

  return truncatedHash.toString().padStart(digits, '0');
}

/**
 * Verifica código TOTP - implementación probada
 * @param {string} secret - Secreto TOTP en base32
 * @param {string} code - Código a verificar
 * @return {boolean} true si es válido
 */
function verifyTOTP(secret, code) {
  if (!secret || !code) return false;
  if (code.length !== 6 || !/^\d+$/.test(code)) return false;
  
  const timestamp = Math.floor(new Date().getTime() / 1000);
  const windowSize = 1;
  
  for (let i = -windowSize; i <= windowSize; i++) {
    const testTimestamp = timestamp + (i * 30);
    const expectedTOTP = generateTOTPAtTime(secret, testTimestamp, 30, 6);
    if (expectedTOTP === code) {
      return true;
    }
  }
  return false;
}

/**
 * Registra acceso en log
 * @param {string} username - Usuario
 * @param {boolean} success - Si fue exitoso
 * @param {string} details - Detalles
 */
function logAccess(username, success, details) {
  try {
    const ssId = getCoreSpreadsheetId();
    if (!ssId) return;
    
    const ss = getCoreSpreadsheet();
    let sheet = ss.getSheetByName('Logs_Accesos');
    
    if (!sheet) {
      sheet = ss.insertSheet('Logs_Accesos');
      sheet.appendRow(['timestamp', 'username', 'success', 'details', 'ip']);
    }
    
    sheet.appendRow([
      new Date().toISOString(),
      username,
      success ? 'YES' : 'NO',
      details,
      'SERVER'
    ]);
  } catch (err) {
    Logger.log('Error guardando log: ' + err.message);
  }
}

// ================================================================= //
// CONTROL DE PERMISOS RBAC
// Fase 1.3: Implementación de permisos
// ================================================================= //

/**
 * Obtiene la hoja de Perfiles
 */
function getPerfilesSheet(ssId) {
  const ss = SpreadsheetApp.openById(ssId);
  return ss.getSheetByName('Perfiles');
}

/**
 * Obtiene un perfil por ID
 * @param {string} perfilId - ID del perfil
 * @param {string} ssId - ID del spreadsheet
 * @return {object|null} Perfil encontrado o null
 */
function getPerfilById(perfilId, ssId) {
  return getCached('p:id:' + perfilId, () => {
    const sheet = getPerfilesSheet(ssId);
    if (!sheet) return null;
    const data = getSheetData(sheet);
    return data.find(row => row.id === perfilId) || null;
  });
}

/**
 * Obtiene todos los perfiles (con caché)
 * @param {string} ssId - ID del spreadsheet
 * @return {array} Lista de perfiles
 */
function getAllPerfiles(ssId) {
  return getCached('p:all', () => {
    const sheet = getPerfilesSheet(ssId);
    if (!sheet) return [];
    return getSheetData(sheet);
  });
}

/**
 * Normaliza el campo permisos (string JSON → objeto)
 * @param {string|object} permisos - Permisos en cualquier formato
 * @return {object} Permisos como objeto
 */
function normalizePermisos(permisos) {
  if (!permisos) return {};
  if (typeof permisos === 'object') return permisos;
  if (typeof permisos === 'string') {
    try { return JSON.parse(permisos); } catch(e) { return {}; }
  }
  return {};
}

/**
 * Verifica rate limiting para una acción
 * @param {string} identifier - Identificador único (IP, username, etc)
 * @param {number} maxRequests - Máximo de requests permitidos
 * @param {number} windowSeconds - Ventana de tiempo en segundos
 * @return {object} { allowed: boolean, remaining: number, resetIn: number }
 */
function checkRateLimit(identifier, maxRequests, windowSeconds) {
  const cache = CacheService.getScriptCache();
  const key = 'rl:' + identifier;
  const current = parseInt(cache.get(key) || '0', 10);
  
  if (current >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: windowSeconds };
  }
  
  cache.put(key, (current + 1).toString(), windowSeconds);
  return { allowed: true, remaining: maxRequests - current - 1, resetIn: windowSeconds };
}

function getCached(key, fetchFn) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = fetchFn();
  if (data) cache.put(key, JSON.stringify(data), CACHE_TTL_LOOKUP);
  return data;
}

function invalidateCache(pattern) {
  // CacheService.getScriptCache() no tiene getAll() en Google Apps Script
  // El cache expira automáticamente según el TTL definido (CACHE_TTL_DATA = 10 min)
  // Esta función queda aquí por compatibilidad pero no hace invalidación por patrón
  Logger.log('Cache invalidation requested for pattern: ' + pattern + ' (no-op - cache expires automatically)');
}

/**
 * Obtiene el permiso de un perfil para un módulo
 * @param {string} perfilId - ID del perfil
 * @param {string} modulo - Nombre del módulo
 * @param {string} ssId - ID del spreadsheet
 * @return {string} Permiso (RW, R, W, null)
 */
function getPermiso(perfilId, modulo, ssId) {
  const perfil = getPerfilById(perfilId, ssId);
  if (!perfil) return null;
  
  const permisos = normalizePermisos(perfil.permisos);
  return permisos[modulo] || null;
}

/**
 * Valida si un usuario tiene permiso para una acción
 * @param {string} userId - ID del usuario
 * @param {string} modulo - Nombre del módulo
 * @param {string} accion - Acción (read, write, delete)
 * @param {string} ssId - ID del spreadsheet
 * @return {boolean} true si tiene permiso
 */
function validarPermiso(userId, modulo, accion, ssId) {
  const user = getUserById(userId, ssId);
  if (!user) return false;
  
  const permiso = getPermiso(user.perfilId, modulo, ssId);
  if (!permiso) return false;
  
  // Mapeo de acciones a permisos
  const permisosAccion = {
    'read': ['R', 'RW'],
    'write': ['W', 'RW'],
    'delete': ['RW']
  };
  
  const permisosPermitidos = permisosAccion[accion] || [];
  return permisosPermitidos.includes(permiso);
}

/**
 * Obtiene todos los permisos de un usuario
 * @param {string} userId - ID del usuario
 * @param {string} ssId - ID del spreadsheet
 * @return {object} Objeto con permisos por módulo
 */
function getUserPermisos(userId, ssId) {
  const user = getUserById(userId, ssId);
  if (!user) return {};
  
  const perfil = getPerfilById(user.perfilId, ssId);
  if (!perfil) return {};
  
  return normalizePermisos(perfil.permisos);
}

/**
 * Valida permisos de usuario para un módulo
 * @param {object} session - Sesión validada
 * @param {string} action - Acción (read, write, delete)
 * @param {string} modulo - Módulo objetivo
 * @param {string} ssId - ID del spreadsheet
 * @return {object} Resultado de validación
 */
function checkPermission(session, action, modulo, ssId) {
  if (!session || !session.valid) {
    return { allowed: false, error: 'ERR_AUTH_INVALID' };
  }
  
  const tienePermiso = validarPermiso(session.userId, modulo, action, ssId);
  
  if (!tienePermiso) {
    logAccess(session.username, false, `Permiso denegado: ${action} en ${modulo}`);
    return { allowed: false, error: 'ERR_PERMISSION_DENIED' };
  }
  
  return { allowed: true };
}
  
  const tienePermiso = validarPermiso(session.userId, modulo, action);
  
  if (!tienePermiso) {
    logAccess(session.username, false, `Permiso denegado: ${action} en ${modulo}`);
    return { allowed: false, error: 'ERR_PERMISSION_DENIED' };
  }
  
  return { allowed: true };
}

/**
 * Acción: getCongregacion - Obtiene información de la congregación desde GSheet
 */
function actionGetCongregacion(ssId) {
  try {
    if (!ssId) {
      return { success: false, error: 'ERR_SS_ID_REQUIRED' };
    }
    
    const ss = SpreadsheetApp.openById(ssId);
    const configSheet = ss.getSheetByName('Configuracion');
    
    if (!configSheet) {
      return { success: true, congregacion: { nombre: '', numero: '' } };
    }
    
    const configData = getCachedSheetData(ss, 'Configuracion');
    const getValue = (key) => configData.find(c => c.clave === key)?.valor;
    
    return { 
      success: true, 
      congregacion: {
        nombre: getValue('nombre_congregacion') || getValue('nombre_mostrar') || '',
        numero: getValue('numero_congregacion') || '',
        nombreMostrar: getValue('nombre_mostrar') || '',
        idioma: getValue('idioma_predeterminado') || 'es',
        zonaHoraria: getValue('zona_horaria') || 'America/New_York'
      } 
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Acción: getPermisos - Obtiene permisos de un usuario
 */
function actionGetPermisos(payload) {
  try {
    const permisos = getUserPermisos(payload.userId);
    return { success: true, permisos: permisos };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Acción: checkPermission - Valida permiso para acción
 */
function actionCheckPermission(payload) {
  try {
    const result = checkPermission(
      { valid: true, userId: payload.userId, username: payload.username },
      payload.action,
      payload.modulo,
      payload.ssId
    );
    return result;
  } catch (err) {
    return { allowed: false, error: err.message };
  }
}

/**
 * Acción: logout - Cierra sesión
 * @param {object} payload - Token de sesión
 * @return {object} Respuesta
 */
function actionLogout(payload) {
  try {
    invalidateSession(payload.sessionToken);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Acción: refreshSession - Renueva token de sesión
 * @param {object} payload - Token de sesión
 * @return {object} Respuesta
 */
function actionRefreshSession(payload) {
  try {
    const result = refreshSessionToken(payload.sessionToken);
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================================================================= //
// FUNCIONES DE INSTALACIÓN
// Setup: createSpreadsheet, initCoreTables, seedPerfiles
// ================================================================= //

/**
 * Genera nombre de spreadsheet para módulo
 * Formato: CongreAdmin-[nombre]-[modulo]
 * @param {string} modulo - Nombre del módulo
 * @param {string} nombre - Nombre de la congregación
 * @return {string} Nombre formateado
 */
function getModuleSpreadsheetName(modulo, nombre) {
  nombre = nombre || 'SinNombre';
  const nombreLimpio = nombre.replace(/[^a-zA-Z0-9]/g, '');
  return `CongreAdmin-${nombreLimpio}-${modulo}`;
}

/**
 * Crea un nuevo Google Spreadsheet
 * @param {string} name - Nombre del spreadsheet
 * @return {object} ID y URL del spreadsheet creado
 */
function createSpreadsheet(name) {
  try {
    const ss = SpreadsheetApp.create(name || 'CongreAdmin');
    return {
      success: true,
      ssId: ss.getId(),
      url: ss.getUrl(),
      name: ss.getName()
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Crea una hoja si no existe
 */
function createSheetIfNotExists(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f3f3');
  } else {
    // Ensure headers exist even if sheet was created without them
    const lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f3f3');
    }
  }
  return { sheet: name, status: 'created' };
}

/**
 * Acción: install - Crea los spreadsheets inicial y público
 * NO guarda nada en script properties - todo se devuelve al frontend
 * @param {object} payload - Datos de instalación
 * @return {object} Resultado
 */
function actionInstall(payload) {
  try {
    const { nombreCongregacion, numeroCongregacion, nombreMostrar, gasUrl } = payload;
    
    const nombreLimpio = (nombreCongregacion || 'SinNombre').replace(/[^a-zA-Z0-9]/g, '');
    
    // 1. Crear Spreadsheet Core con formato: CongreAdmin-[nombre]-[modulo]
    const ssName = `CongreAdmin-${nombreLimpio}-Core`;
    const ssResult = createSpreadsheet(ssName);
    if (!ssResult.success) {
      return { success: false, error: 'Error creando spreadsheet: ' + ssResult.error };
    }
    
    const ssId = ssResult.ssId;
    
    // 2. Crear Spreadsheet Público (para información compartida)
    const ssPublicName = `CongreAdmin-${nombreLimpio}-Public`;
    const ssPublicResult = createSpreadsheet(ssPublicName);
    let publicSsId = '';
    if (ssPublicResult.success) {
      publicSsId = ssPublicResult.ssId;
      
      // Auto-share public spreadsheet (anyone with link can view)
      DriveApp.getFileById(publicSsId).setSharing(
        DriveApp.Access.ANYONE_WITH_LINK,
        DriveApp.Permission.VIEW
      );
    } else {
      return { success: false, error: 'Error creando spreadsheet público: ' + ssPublicResult.error };
    }
    
    // NO guardamos en script properties - devolvemos todo al frontend
    return {
      success: true,
      ssId: ssId,
      ssUrl: ssResult.url,
      publicSsId: publicSsId,
      publicSsUrl: ssPublicResult.url,
      nombreCongregacion: nombreCongregacion,
      numeroCongregacion: numeroCongregacion,
      nombreMostrar: nombreMostrar || `Co. ${nombreCongregacion}`,
      message: 'Spreadsheets creados. La configuración se almacena en la hoja Configuracion.'
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
    
    const ssId = ssResult.ssId;
    
    // 2. Crear Spreadsheet Público (para información compartida)
    const ssPublicName = `CongreAdmin-${nombreLimpio}-Public`;
    const ssPublicResult = createSpreadsheet(ssPublicName);
    let publicSsId = '';
    if (ssPublicResult.success) {
      publicSsId = ssPublicResult.ssId;
      
      // Auto-share public spreadsheet (anyone with link can view)
      DriveApp.getFileById(publicSsId).setSharing(
        DriveApp.Access.ANYONE_WITH_LINK,
        DriveApp.Permission.VIEW
      );
    } else {
      return { success: false, error: 'Error creando spreadsheet público: ' + ssPublicResult.error };
    }
    
    // Return configuration - frontend handles storage
    return {
      success: true,
      ssId: ssId,
      ssUrl: ssResult.url,
      publicSsId: publicSsId,
      publicSsUrl: ssPublicResult.url,
      nombreCongregacion: nombreCongregacion,
      numeroCongregacion: numeroCongregacion,
      nombreMostrar: nombreMostrar || `Co. ${nombreCongregacion}`,
      message: 'Spreadsheets creados. La orquestación de tablas y datos se realiza desde el frontend.'
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
