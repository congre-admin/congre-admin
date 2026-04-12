/**
 * Utilidades para parsing de CSV
 */

/**
 * Convierte texto CSV a array de objetos
 * @param csv - Texto CSV con headers en primera fila
 * @returns Array de objetos con ключ=значение
 */
export function parseCsvToJson(csv: string): Record<string, string>[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Parse headers, handling quoted field names
  const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''));
  
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      // Remove quotes from value if present
      const val = values[i]?.trim() || '';
      obj[header] = val.replace(/^"|"$/g, '');
    });
    return obj;
  });
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

/**
 * Convierte array de objetos a texto CSV
 * @param data - Array de objetos a convertir
 * @returns Texto CSV
 */
export function jsonToCsv(data: Record<string, string>[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const headerLine = headers.join(',');
  
  const dataLines = data.map(row => 
    headers.map(h => {
      const val = row[h] || '';
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(',')
  );
  
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Descarga datos como archivo CSV
 * @param data - Array de objetos
 * @param filename - Nombre del archivo
 */
export function downloadCsv(data: Record<string, string>[], filename: string): void {
  const csv = jsonToCsv(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}