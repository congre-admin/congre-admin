import jsonata from 'jsonata';

export class DataTransformService {
  evaluate<T = any>(expression: string, data: unknown): T {
    const expr = jsonata(expression);
    return expr.evaluate(data) as T;
  }

  filter<T>(data: T[], filterExpr: string): T[] {
    if (!filterExpr || !data) return data;
    try {
      const [field, ...rest] = filterExpr.split('=').map(s => s.trim());
      const value = rest.join('=').replace(/^["']|["']$/g, '');
      return data.filter(item => {
        const itemValue = (item as Record<string, unknown>)[field];
        return itemValue === value || String(itemValue) === value;
      });
    } catch {
      return data;
    }
  }

  map<T, R>(data: T[], _mapExpr: string): R[] {
    if (!_mapExpr || !data) return data as unknown as R[];
    return data.map(item => item as unknown as R);
  }

  sort<T>(data: T[], sortExpr: string): T[] {
    if (!sortExpr || !data) return data;
    try {
      const [field, direction] = sortExpr.split(' ');
      const order = direction === 'desc' ? -1 : 1;
      return [...data].sort((a, b) => {
        const aObj = a as Record<string, unknown>;
        const bObj = b as Record<string, unknown>;
        const aVal = aObj[field] ?? null;
        const bVal = bObj[field] ?? null;
        if (aVal === bVal) return 0;
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        const cmp = aVal < bVal ? -1 : 1;
        return cmp * order;
      });
    } catch {
      return data;
    }
  }

  sanitize<T>(data: T): T;
  sanitize<T>(data: T[]): T[];
  sanitize<T>(data: T | T[]): T | T[] {
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item)) as T[];
    }

    if (data && typeof data === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (!key.startsWith('enc_')) {
          sanitized[key] = value;
        }
      }
      return sanitized as T;
    }

    return data;
  }

  validate<T>(_data: T, _validationExpr: string): string[] {
    return [];
  }

  process<T>(
    data: T[],
    options: {
      filter?: string;
      map?: string;
      sort?: string;
      limit?: number;
      offset?: number;
    }
  ): T[] {
    if (!data) return [];

    let result = data;

    if (options.filter) {
      result = this.filter(result, options.filter);
    }

    if (options.map) {
      result = this.map(result, options.map);
    }

    if (options.sort) {
      result = this.sort(result, options.sort);
    }

    if (options.offset) {
      result = result.slice(options.offset);
    }

    if (options.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }
}

export const dataTransformService = new DataTransformService();
