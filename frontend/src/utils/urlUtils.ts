/**
 * Utilidades para normalizar URLs y IDs de Google Apps Script y Google Sheets
 */

/**
 * Normaliza Script ID o URL de GAS a URL completa
 * @param input - Script ID o URL completa de GAS
 * @returns URL completa de GAS
 */
export function normalizeGasUrl(input: string): string {
  if (!input) return '';
  
  const trimmed = input.trim();
  
  // Si ya es URL completa de GAS, retornarla
  if (trimmed.includes('script.google.com')) {
    // Asegurar que termina en /exec
    if (!trimmed.endsWith('/exec')) {
      return trimmed.endsWith('/') ? `${trimmed}exec` : `${trimmed}/exec`;
    }
    return trimmed;
  }
  
  // Es Script ID - construir URL
  if (trimmed.match(/^[a-zA-Z0-9-_]+$/)) {
    return `https://script.google.com/macros/s/${trimmed}/exec`;
  }
  
  // Si no coincide con ningún patrón, retornar como está
  return trimmed;
}

/**
 * Normaliza Spreadsheet ID o URL de GSheets a ID
 * @param input - Spreadsheet ID o URL completa
 * @returns Spreadsheet ID
 */
export function normalizeSpreadsheetId(input: string): string {
  if (!input) return '';
  
  const trimmed = input.trim();
  
  // Si es URL completa de Sheets, extraer ID
  if (trimmed.includes('docs.google.com/spreadsheets/d/')) {
    const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Si es URL de edit
  if (trimmed.includes('spreadsheets') && trimmed.includes('/edit')) {
    const match = trimmed.match(/\/edit(?:$|\?)/);
    if (match && match.index) {
      const idPart = trimmed.substring(0, match.index);
      const parts = idPart.split('/');
      return parts[parts.length - 1];
    }
  }
  
  // Es Spreadsheet ID - retornarlo
  return trimmed;
}

/**
 * Valida si es un Script ID válido de GAS
 * @param input - Cadena a validar
 * @returns true si es un Script ID válido
 */
export function isValidScriptId(input: string): boolean {
  if (!input) return false;
  // Script IDs typically start with AKfycb and contain alphanumeric chars and dashes
  return /^[a-zA-Z0-9-_]+$/.test(input.trim());
}

/**
 * Valida si es un Spreadsheet ID válido
 * @param input - Cadena a validar
 * @returns true si es un Spreadsheet ID válido
 */
export function isValidSpreadsheetId(input: string): boolean {
  if (!input) return false;
  // Spreadsheet IDs are typically around 44 characters of alphanumeric, dashes, underscores
  return /^[a-zA-Z0-9-_]{40,}$/.test(input.trim());
}

/**
 * Extrae el Script ID de una URL de GAS
 * @param url - URL completa de GAS
 * @returns Script ID o null si no es válida
 */
export function extractScriptId(url: string): string | null {
  if (!url || !url.includes('script.google.com')) return null;
  
  const match = url.match(/\/s\/([a-zA-Z0-9-_]+)/);
  return match && match[1] ? match[1] : null;
}

/**
 * Extrae el Spreadsheet ID de una URL de Sheets
 * @param url - URL completa de Sheets
 * @returns Spreadsheet ID o null si no es válida
 */
export function extractSpreadsheetId(url: string): string | null {
  if (!url || !url.includes('spreadsheets')) return null;
  
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match && match[1] ? match[1] : null;
}
