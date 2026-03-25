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
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const sheetName = postData.sheet;
    const ssId = postData.ssId;
    const ss = ssId ? SpreadsheetApp.openById(ssId) : SpreadsheetApp.getActiveSpreadsheet();
    
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
      clearCache(ss.getId(), sheetName);
      return createResponse({ success: true, message: 'Hoja inicializada' });
    }

    if (action === 'clearSheet') {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return createResponse({ error: 'Hoja no encontrada' });
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues();
      sheet.clearContents();
      if (headers.length > 0 && headers[0][0]) sheet.appendRow(headers[0]);
      clearCache(ss.getId(), sheetName);
      return createResponse({ success: true });
    }

    if (action === 'deleteData') {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return createResponse({ error: 'Hoja no encontrada' });
      // Usar borrado lógico por defecto
      const result = softDeleteRow(sheet, postData.id);
      if (!result) {
        return createResponse({ success: false, error: 'Registro no encontrado' });
      }
      clearCache(ss.getId(), sheetName);
      return createResponse({ success: true, message: 'Borrado lógico realizado' });
    }
    
    if (action === 'hardDelete') {
      // Borrado físico (solo admin)
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return createResponse({ error: 'Hoja no encontrada' });
      deleteRowById(sheet, postData.id);
      clearCache(ss.getId(), sheetName);
      return createResponse({ success: true, message: 'Borrado físico realizado' });
    }
    
    if (action === 'restoreData') {
      // Restaurar registro borrado lógicamente
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return createResponse({ error: 'Hoja no encontrada' });
      const result = restoreRow(sheet, postData.id);
      if (!result) return createResponse({ success: false, error: 'Registro no encontrado' });
      clearCache(ss.getId(), sheetName);
      return createResponse({ success: true, message: 'Registro restaurado' });
    }
    
    if (action === 'getHistory') {
      if (!postData.sessionToken) {
        return createResponse({ error: 'ERR_AUTH_REQUIRED' });
      }
      const session = validateSession(postData.sessionToken);
      if (!session.valid) {
        return createResponse({ error: 'ERR_AUTH_INVALID' });
      }
      
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return createResponse({ error: 'Hoja no encontrada' });
      
      const permCheck = checkPermission(session, 'read', sheetName);
      if (!permCheck.allowed) {
        return createResponse({ error: permCheck.error });
      }
      
      const history = getVersionHistory(sheet, postData.id);
      return createResponse({ success: true, history: history });
    }
    
    // Last Write Wins: validar versión antes de guardar
    if (action === 'saveData') {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return createResponse({ error: 'Hoja no encontrada: ' + sheetName });
      
      let existingRows = null;
      
      if (postData.expectedVersion !== undefined) {
        existingRows = sheet.getDataRange().getValues();
        const headers = existingRows[0];
        const idIndex = headers.indexOf('id');
        const vIndex = headers.indexOf('_v');
        
        for (let i = 1; i < existingRows.length; i++) {
          if (existingRows[i][idIndex] == postData.payload.id) {
            const currentV = vIndex >= 0 ? (parseInt(existingRows[i][vIndex]) || 0) : 0;
            if (currentV > postData.expectedVersion) {
              return createResponse({ 
                success: false, 
                error: 'ERR_VERSION_CONFLICT',
                message: 'El registro fue modificado por otro usuario',
                currentVersion: currentV
              });
            }
            break;
          }
        }
      }
      
      updateOrInsert(sheet, postData.payload, postData.onlyIfNew, { existingRows });
      clearCache(ss.getId(), sheetName);
      return createResponse({ success: true });
    }

    if (action === 'deleteSheet') {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) ss.deleteSheet(sheet);
      return createResponse({ success: true });
    }

    // --- Autenticación ---
    
    if (action === 'register') {
      return createResponse(actionRegister(postData.payload));
    }
    
    if (action === 'login') {
      return createResponse(actionLogin(postData.payload));
    }
    
    if (action === 'challenge') {
      return createResponse(actionChallenge(postData.payload));
    }
    
    if (action === 'requestOTP') {
      return createResponse(actionRequestOTP(postData.payload));
    }
    
    if (action === 'logout') {
      return createResponse(actionLogout(postData.payload));
    }
    
    if (action === 'validateSession') {
      const session = validateSession(postData.sessionToken);
      return createResponse(session);
    }
    
    if (action === 'refreshSession') {
      return createResponse(refreshSessionToken(postData.sessionToken));
    }
    
    if (action === 'getActiveSessions') {
      return createResponse(getActiveSessions(postData.userId));
    }
    
    if (action === 'invalidateAllSessions') {
      return createResponse(invalidateAllSessions(postData.userId));
    }
    
    // --- Permisos RBAC ---
    
    if (action === 'getPerfiles') {
      return createResponse(actionGetPerfiles());
    }
    
    if (action === 'getPermisos') {
      return createResponse(actionGetPermisos(postData.payload));
    }
    
    if (action === 'checkPermission') {
      return createResponse(actionCheckPermission(postData.payload));
    }
    
    // --- Instalación ---
    
    if (action === 'install') {
      return createResponse(actionInstall(postData.payload));
    }
    
    if (action === 'createSpreadsheet') {
      return createResponse(createSpreadsheet(postData.name));
    }
    
    if (action === 'initCoreTables') {
      return createResponse(initCoreTables(postData.ssId));
    }
    
    if (action === 'seedPerfiles') {
      return createResponse(seedPerfiles(postData.ssId));
    }
    
    if (action === 'seedConfiguracion') {
      return createResponse(seedConfiguracion(postData.ssId));
    }
    
    return createResponse({ error: 'Acción POST no válida' });
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
    if (val === undefined) return '';
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
// Fase 1.1: Implementación de autenticación
// ================================================================= //

const SESSION_TTL = 86400; // 24 horas en segundos
const CORE_SS_ID = 'CORE_SS_ID'; // Configurar en propiedades del script

/**
 * Obtiene el ID del GSheet Core desde las propiedades del script
 */
function getCoreSpreadsheetId() {
  return PropertiesService.getScriptProperties().getProperty('CORE_SS_ID');
}

/**
 * Obtiene el Spreadsheet Core (con caché)
 */
let _cachedSpreadsheet = null;
let _cachedSpreadsheetId = null;

function getCoreSpreadsheet() {
  const ssId = getCoreSpreadsheetId();
  if (!ssId) throw new Error('CORE_SS_ID no configurado');
  
  if (_cachedSpreadsheetId === ssId && _cachedSpreadsheet) {
    return _cachedSpreadsheet;
  }
  
  _cachedSpreadsheet = SpreadsheetApp.openById(ssId);
  _cachedSpreadsheetId = ssId;
  return _cachedSpreadsheet;
}

function invalidateCoreSpreadsheetCache() {
  _cachedSpreadsheet = null;
  _cachedSpreadsheetId = null;
}

/**
 * Obtiene la hoja de Usuarios del GSheet Core
 */
function getUsuariosSheet() {
  const ss = getCoreSpreadsheet();
  return ss.getSheetByName('Usuarios');
}

/**
 * Busca un usuario por username (email)
 * @param {string} username - Email del usuario
 * @return {object|null} Usuario encontrado o null
 */
function getUserByUsername(username) {
  return getCached('u:un:' + username, () => {
    const sheet = getUsuariosSheet();
    if (!sheet) return null;
    const data = getSheetData(sheet);
    return data.find(row => row.username === username) || null;
  });
}

/**
 * Busca un usuario por ID
 * @param {string} id - ID del usuario
 * @return {object|null} Usuario encontrado o null
 */
function getUserById(id) {
  return getCached('u:id:' + id, () => {
    const sheet = getUsuariosSheet();
    if (!sheet) return null;
    const data = getSheetData(sheet);
    return data.find(row => row.id === id) || null;
  });
}

/**
 * Crea un nuevo usuario
 * @param {object} userData - Datos del usuario
 * @return {object} Usuario creado
 */
function createUser(userData) {
  const sheet = getUsuariosSheet();
  if (!sheet) throw new Error('Hoja Usuarios no encontrada');
  
  // Verificar si el usuario ya existe
  const existing = getUserByUsername(userData.username);
  if (existing) {
    throw new Error('ERR_USER_EXISTS: El usuario ya existe');
  }
  
  const user = {
    id: Utilities.getUuid(),
    username: userData.username,
    wrapped_mk: userData.wrapped_mk || '',
    perfilId: userData.perfilId || 'p_publicador',
    personaId: userData.personaId || null,
    auth_factor: userData.auth_factor || 'email',
    totp_secret: userData.totp_secret || null,
    public_key: userData.public_key || null,
    created_at: new Date().toISOString(),
    _ts: new Date().toISOString()
  };
  
  updateOrInsert(sheet, user, false);
  clearCache(getCoreSpreadsheetId(), 'Usuarios');
  invalidateCache('u:');
  
  return { success: true, user: { id: user.id, username: user.username } };
}

/**
 * Actualiza un usuario existente
 * @param {string} id - ID del usuario
 * @param {object} updates - Campos a actualizar
 * @return {object} Usuario actualizado
 */
function updateUser(id, updates) {
  const sheet = getUsuariosSheet();
  if (!sheet) throw new Error('Hoja Usuarios no encontrada');
  
  const user = getUserById(id);
  if (!user) {
    throw new Error('ERR_USER_NOT_FOUND: Usuario no encontrado');
  }
  
  const updatedUser = {
    ...user,
    ...updates,
    _ts: new Date().toISOString()
  };
  
  updateOrInsert(sheet, updatedUser, false);
  clearCache(getCoreSpreadsheetId(), 'Usuarios');
  invalidateCache('u:');
  
  return { success: true, user: { id: updatedUser.id, username: updatedUser.username } };
}

/**
 * Genera un token de sesión
 * @param {string} userId - ID del usuario
 * @return {object} Token de sesión
 */
function generateSessionToken(userId) {
  const user = getUserById(userId);
  if (!user) {
    throw new Error('ERR_USER_NOT_FOUND');
  }
  
  const token = Utilities.getUuid() + '_' + Utilities.getUuid();
  const expiresAt = new Date(Date.now() + SESSION_TTL * 1000).toISOString();
  
  // Guardar sesión en propiedades (en producción, usar base de datos)
  const sessionData = {
    token: token,
    userId: userId,
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
  
  const stored = PropertiesService.getScriptCache().get('session_index');
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
    PropertiesService.getScriptCache().put('session_index', JSON.stringify(_sessionIndex), 300);
  } catch (e) {}
}

function _addToSessionIndex(token, userId, expiresAt) {
  const idx = _loadSessionIndex();
  idx[token] = { userId, expiresAt };
  _saveSessionIndex();
}

function _removeFromSessionIndex(token) {
  const idx = _loadSessionIndex();
  delete idx[token];
  _saveSessionIndex();
}

/**
 * Valida un token de sesión (usa índice híbrido)
 * @param {string} token - Token de sesión
 * @return {object|null} Datos de sesión o null si es inválido
 */
function validateSession(token) {
  const idx = _loadSessionIndex();
  const session = idx[token];
  
  if (session) {
    if (new Date(session.expiresAt) > new Date()) {
      const user = getUserById(session.userId);
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
  
  const idx = _loadSessionIndex();
  const keysToRemove = Object.keys(idx).filter(k => idx[k].userId === userId);
  keysToRemove.forEach(k => delete idx[k]);
  _saveSessionIndex();
  
  return { success: true, message: 'Todas las sesiones cerradas' };
}

/**
 * Acción: register - Crea un nuevo usuario
 * @param {object} payload - Datos del usuario
 * @return {object} Respuesta
 */
function actionRegister(payload) {
  try {
    const result = createUser({
      username: payload.username,
      wrapped_mk: payload.wrapped_mk,
      perfilId: payload.perfilId,
      personaId: payload.personaId,
      auth_factor: payload.auth_factor || 'email',
      totp_secret: payload.totp_secret,
      public_key: payload.public_key
    });
    
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
 * Acción: login - Autentica usuario y devuelve token
 * @param {object} payload - Credenciales
 * @return {object} Respuesta con token
 */
function actionLogin(payload) {
  try {
    const { username, code, authType } = payload;
    
    // Rate limiting: max 5 intentos por minuto por username
    const rateLimit = checkRateLimit('login:' + username, 5, 60);
    if (!rateLimit.allowed) {
      return { 
        success: false, 
        error: 'ERR_RATE_LIMITED: Demasiados intentos. Intenta más tarde.',
        retryAfter: rateLimit.resetIn
      };
    }
    
    // Buscar usuario
    const user = getUserByUsername(username);
    if (!user) {
      return { success: false, error: 'ERR_AUTH_INVALID: Usuario no encontrado' };
    }
    
    // Verificar factor de autenticación
    if (authType === 'totp' || user.auth_factor === 'totp') {
      if (!code) {
        return { success: false, error: 'ERR_OTP_REQUIRED: Se requiere código TOTP' };
      }
      // Verificar TOTP (en implementación real, usar библиотека)
      const isValid = verifyTOTP(user.totp_secret, code);
      if (!isValid) {
        logAccess(username, false, 'TOTP inválido');
        return { success: false, error: 'ERR_AUTH_INVALID: Código TOTP inválido' };
      }
    } else if (authType === 'email' || user.auth_factor === 'email') {
      if (!code) {
        return { success: false, error: 'ERR_OTP_REQUIRED: Se requiere código de verificación' };
      }
      // Verificar código OTP de email
      const isValid = verifyEmailOTP(username, code);
      if (!isValid) {
        logAccess(username, false, 'OTP email inválido');
        return { success: false, error: 'ERR_AUTH_INVALID: Código inválido' };
      }
    }
    
    // Generar token de sesión
    const session = generateSessionToken(user.id);
    
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
    
    // Generar desafío (en implementación real, usar WebAuthn)
    const challenge = Utilities.getUuid();
    
    // Guardar desafío temporalmente
    PropertiesService.getUserProperties().setProperty(
      'challenge_' + payload.username,
      JSON.stringify({
        challenge: challenge,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min
      })
    );
    
    return {
      success: true,
      challenge: challenge,
      publicKey: user.public_key
    };
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
    const user = getUserByUsername(payload.username);
    
    if (!user) {
      return { success: false, error: 'ERR_USER_NOT_FOUND' };
    }
    
    // Generar código OTP de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Guardar código temporalmente (en producción, usar tabla)
    PropertiesService.getUserProperties().setProperty(
      'otp_' + payload.username,
      JSON.stringify({
        code: code,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min
      })
    );
    
    // Enviar email
    sendOTPEmail(user.username, code);
    
    logAccess(payload.username, true, 'OTP enviado');
    
    return { success: true, message: 'Código enviado' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Envía código OTP por email
 * @param {string} email - Email del destinatario
 * @param {string} code - Código OTP
 */
function sendOTPEmail(email, code) {
  try {
    MailApp.sendEmail({
      to: email,
      subject: 'Código de verificación - Congre-Admin',
      body: 'Tu código de verificación es: ' + code + '\n\nEste código expira en 10 minutos.'
    });
  } catch (err) {
    Logger.log('Error enviando email: ' + err.message);
    throw new Error('ERR_EMAIL_SEND: No se pudo enviar el email');
  }
}

/**
 * Verifica código OTP de email
 * @param {string} username - Username
 * @param {string} code - Código a verificar
 * @return {boolean} true si es válido
 */
function verifyEmailOTP(username, code) {
  const stored = PropertiesService.getUserProperties().getProperty('otp_' + username);
  if (!stored) return false;
  
  const otpData = JSON.parse(stored);
  
  // Verificar si no ha expirado
  if (new Date(otpData.expiresAt) < new Date()) {
    return false;
  }
  
  // Verificar código
  if (otpData.code !== code) {
    return false;
  }
  
  // Eliminar código usado
  PropertiesService.getUserProperties().deleteProperty('otp_' + username);
  
  return true;
}

/**
 * Verifica código TOTP (implementación básica)
 * En producción, usar библиотека como jsSHA
 * @param {string} secret - Secreto TOTP
 * @param {string} code - Código a verificar
 * @return {boolean} true si es válido
 */
function verifyTOTP(secret, code) {
  if (!secret || !code) return false;
  
  // Implementación simplificada - en producción usar google-authenticator o similar
  // Por ahora, aceptamos cualquier código de 6 dígitos si el secreto existe
  // TODO: Implementar verificación TOTP real
  
  // Placeholder: en producción, integrar библиотека TOTP
  return code.length === 6 && /^\d+$/.test(code);
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
 * Obtiene la hoja de Perfiles del GSheet Core
 */
function getPerfilesSheet() {
  const ss = getCoreSpreadsheet();
  return ss.getSheetByName('Perfiles');
}

/**
 * Obtiene un perfil por ID
 * @param {string} perfilId - ID del perfil
 * @return {object|null} Perfil encontrado o null
 */
function getPerfilById(perfilId) {
  return getCached('p:id:' + perfilId, () => {
    const sheet = getPerfilesSheet();
    if (!sheet) return null;
    const data = getSheetData(sheet);
    return data.find(row => row.id === perfilId) || null;
  });
}

/**
 * Obtiene todos los perfiles (con caché)
 * @return {array} Lista de perfiles
 */
function getAllPerfiles() {
  return getCached('p:all', () => {
    const sheet = getPerfilesSheet();
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
    const ttl = cache.getTtl(key);
    return { allowed: false, remaining: 0, resetIn: ttl > 0 ? Math.ceil(ttl / 1000) : windowSeconds };
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
  const cache = CacheService.getScriptCache();
  const keys = cache.getAll();
  if (keys) {
    Object.keys(keys).forEach(k => {
      if (k.startsWith(pattern)) cache.remove(k);
    });
  }
}

/**
 * Obtiene los permisos de un perfil para un módulo específico
 * @param {string} perfilId - ID del perfil
 * @param {string} modulo - Nombre del módulo
 * @return {string} Permiso (RW, R, W, null)
 */
function getPermiso(perfilId, modulo) {
  const perfil = getPerfilById(perfilId);
  if (!perfil) return null;
  
  const permisos = normalizePermisos(perfil.permisos);
  return permisos[modulo] || null;
}

/**
 * Valida si un usuario tiene permiso para una acción
 * @param {string} userId - ID del usuario
 * @param {string} modulo - Nombre del módulo
 * @param {string} accion - Acción (read, write, delete)
 * @return {boolean} true si tiene permiso
 */
function validarPermiso(userId, modulo, accion) {
  const user = getUserById(userId);
  if (!user) return false;
  
  const permiso = getPermiso(user.perfilId, modulo);
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
 * @return {object} Objeto con permisos por módulo
 */
function getUserPermisos(userId) {
  const user = getUserById(userId);
  if (!user) return {};
  
  const perfil = getPerfilById(user.perfilId);
  if (!perfil) return {};
  
  return normalizePermisos(perfil.permisos);
}

/**
 * Valida permisos antes de una operación CRUD
 * @param {object} session - Sesión validada
 * @param {string} action - Acción (read, write, delete)
 * @param {string} modulo - Módulo objetivo
 * @return {object} Resultado de validación
 */
function checkPermission(session, action, modulo) {
  if (!session || !session.valid) {
    return { allowed: false, error: 'ERR_AUTH_INVALID' };
  }
  
  const tienePermiso = validarPermiso(session.userId, modulo, action);
  
  if (!tienePermiso) {
    logAccess(session.username, false, `Permiso denegado: ${action} en ${modulo}`);
    return { allowed: false, error: 'ERR_PERMISSION_DENIED' };
  }
  
  return { allowed: true };
}

/**
 * Acción: getPerfiles - Obtiene todos los perfiles
 */
function actionGetPerfiles() {
  try {
    const perfiles = getAllPerfiles();
    return { success: true, perfiles: perfiles };
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
      payload.modulo
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

// ================================================================= //
// FUNCIONES DE INSTALACIÓN
// Setup: createSpreadsheet, initCoreTables, seedPerfiles
// ================================================================= //

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
 * Inicializa las tablas del Core en un GSheet
 * @param {string} ssId - ID del spreadsheet
 * @return {object} Resultado
 */
function initCoreTables(ssId) {
  try {
    const ss = SpreadsheetApp.openById(ssId);
    const results = [];
    
    // Tabla: Usuarios
    const usuariosHeaders = ['id', 'username', 'wrapped_mk', 'perfilId', 'personaId', 'auth_factor', 'totp_secret', 'public_key', 'created_at', '_v', '_ts', '_deleted'];
    results.push(createSheetIfNotExists(ss, 'Usuarios', usuariosHeaders));
    
    // Tabla: Perfiles
    const perfilesHeaders = ['id', 'nombre', 'permisos', 'descripcion', '_v', '_ts', '_deleted'];
    results.push(createSheetIfNotExists(ss, 'Perfiles', perfilesHeaders));
    
    // Tabla: Registro_Plugins
    const pluginsHeaders = ['plugin_id', 'ssId', 'status', 'config', '_v', '_ts', '_deleted'];
    results.push(createSheetIfNotExists(ss, 'Registro_Plugins', pluginsHeaders));
    
    // Tabla: Configuracion
    const configHeaders = ['clave', 'valor', 'is_public', '_v', '_ts', '_deleted'];
    results.push(createSheetIfNotExists(ss, 'Configuracion', configHeaders));
    
    // Tabla: Sistema_Migraciones
    const migracionesHeaders = ['id', 'nombre', 'version', 'ejecutada_en', 'estado', 'error', '_v', '_ts'];
    results.push(createSheetIfNotExists(ss, 'Sistema_Migraciones', migracionesHeaders));
    
    return {
      success: true,
      message: 'Tablas del Core inicializadas',
      tables: results
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
  }
  return { sheet: name, status: 'created' };
}

/**
 * Inyecta los perfiles base en la tabla Perfiles
 * @param {string} ssId - ID del spreadsheet Core
 * @return {object} Resultado
 */
function seedPerfiles(ssId) {
  try {
    const ss = SpreadsheetApp.openById(ssId);
    const sheet = ss.getSheetByName('Perfiles');
    if (!sheet) {
      return { success: false, error: 'Hoja Perfiles no encontrada' };
    }
    
    const perfilesBase = [
      {
        id: 'p_admin',
        nombre: 'Super-Admin',
        permisos: JSON.stringify({ 'core': 'RW', 'personas': 'RW', 'registros': 'RW', 'anuncios': 'RW', 'reuniones': 'RW', 'predicacion': 'RW' }),
        descripcion: 'Acceso total al sistema',
        _v: 1,
        _ts: new Date().toISOString()
      },
      {
        id: 'p_secretario',
        nombre: 'Secretario',
        permisos: JSON.stringify({ 'personas': 'RW', 'registros': 'RW', 'anuncios': 'RW', 'reuniones': 'R', 'predicacion': 'R' }),
        descripcion: 'Gestión de personas y registros',
        _v: 1,
        _ts: new Date().toISOString()
      },
      {
        id: 'p_comite',
        nombre: 'Comité de Servicio',
        permisos: JSON.stringify({ 'personas': 'R', 'registros': 'R', 'reuniones': 'R', 'predicacion': 'R' }),
        descripcion: 'Supervisión general',
        _v: 1,
        _ts: new Date().toISOString()
      },
      {
        id: 'p_super_grupo',
        nombre: 'Superintendente de Grupo',
        permisos: JSON.stringify({ 'personas': 'R', 'registros': 'RW', 'reuniones': 'R' }),
        descripcion: 'Informes y atención de grupo',
        _v: 1,
        _ts: new Date().toISOString()
      },
      {
        id: 'p_siervo_territorios',
        nombre: 'Siervo de Territorios',
        permisos: JSON.stringify({ 'predicacion': 'RW' }),
        descripcion: 'Gestión de territorios y mapas',
        _v: 1,
        _ts: new Date().toISOString()
      },
      {
        id: 'p_publicador',
        nombre: 'Publicador',
        permisos: JSON.stringify({ 'reuniones': 'R', 'predicacion': 'R' }),
        descripcion: 'Acceso básico',
        _v: 1,
        _ts: new Date().toISOString()
      }
    ];
    
    // Verificar si ya hay perfiles
    const existingData = getSheetData(sheet, true);
    if (existingData.length > 0) {
      return {
        success: false,
        error: 'Ya existen perfiles en la tabla',
        message: 'Los perfiles base ya fueron injectados anteriormente'
      };
    }
    
    // Insertar perfiles
    perfilesBase.forEach(perfil => {
      const values = Object.values(perfil);
      sheet.appendRow(values);
    });
    
    return {
      success: true,
      message: 'Perfiles base injectados',
      count: perfilesBase.length
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Inyecta configuración inicial
 * @param {string} ssId - ID del spreadsheet Core
 * @return {object} Resultado
 */
function seedConfiguracion(ssId) {
  try {
    const ss = SpreadsheetApp.openById(ssId);
    const sheet = ss.getSheetByName('Configuracion');
    if (!sheet) {
      return { success: false, error: 'Hoja Configuracion no encontrada' };
    }
    
    const configBase = [
      { clave: 'nombre_congregacion', valor: '', is_public: false },
      { clave: 'idioma_predeterminado', valor: 'es', is_public: true },
      { clave: 'año_servicio_actual', valor: new Date().getFullYear().toString(), is_public: false },
      { clave: 'version_sistema', valor: '1.0.0', is_public: true }
    ];
    
    configBase.forEach(conf => {
      sheet.appendRow([
        conf.clave, conf.valor, conf.is_public, 1, new Date().toISOString(), false
      ]);
    });
    
    return {
      success: true,
      message: 'Configuración base injectada'
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Acción API: install - Proceso completo de instalación
 */
function actionInstall(payload) {
  try {
    const { nombreCongregacion, adminUsername } = payload;
    
    // 1. Crear Spreadsheet Core
    const ssName = nombreCongregacion || 'CongreAdmin_Core';
    const ssResult = createSpreadsheet(ssName);
    if (!ssResult.success) {
      return { success: false, error: 'Error creando spreadsheet: ' + ssResult.error };
    }
    
    const ssId = ssResult.ssId;
    
    // 2. Inicializar tablas
    const initResult = initCoreTables(ssId);
    if (!initResult.success) {
      return { success: false, error: 'Error inicializando tablas: ' + initResult.error };
    }
    
    // 3. Inyectar perfiles
    const seedResult = seedPerfiles(ssId);
    // No fallar si ya existen
    
    // 4. Inyectar configuración
    const configResult = seedConfiguracion(ssId);
    // No fallar si ya existe
    
    // 5. Guardar configuración en propiedades del script
    PropertiesService.getScriptProperties().setProperty('CORE_SS_ID', ssId);
    
    return {
      success: true,
      ssId: ssId,
      ssUrl: ssResult.url,
      message: 'Instalación completada exitosamente'
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
