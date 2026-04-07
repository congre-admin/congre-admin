import jsonata from 'jsonata';

const SANITIZE_EXPR = '$map($, function($r) { $r ~> $filter(function($v, $k) { $k ~> $not($contains(/^enc_/)) }) })';

class JsonataService {
  private _expressionCache = new Map<string, jsonata.Expression>();

  /**
   * Evaluates a JSONata expression against data.
   */
  async evaluate<T = any>(expression: string, data: any): Promise<T> {
    const expr = this.compile(expression);
    return expr.evaluate(data) as Promise<T>;
  }

  /**
   * Filters data using a JSONata expression.
   * @example filter(personas, '[$.estado = "activo"]')
   */
  async filter<T>(data: T[], expression: string): Promise<T[]> {
    return this.evaluate(expression, data);
  }

  /**
   * Maps/transforms data using a JSONata expression.
   * @example map(personas, '[{"id": id, "nombre": nombre}]')
   */
  async map<T, R>(data: T[], expression: string): Promise<R[]> {
    return this.evaluate(expression, data);
  }

  /**
   * Sorts data using a JSONata expression.
   * @example sort(personas, '$sort($, function($a, $b) { $a.nombre < $b.nombre })')
   */
  async sort<T>(data: T[], expression: string): Promise<T[]> {
    return this.evaluate(expression, data);
  }

  /**
   * Removes all fields with prefix 'enc_' (encrypted fields).
   * Useful for public/sanitized views.
   */
  async sanitize<T>(data: T): Promise<T> {
    return this.evaluate(SANITIZE_EXPR, data);
  }

  /**
   * Validates data against a JSONata expression.
   * Returns array of error strings. Empty array = valid.
   * @example validate(persona, '[ $$.nombre ? null : "nombre es requerido" ] ~> $filter(function($e) { $e != null })')
   */
  async validate<T>(data: T, expression: string): Promise<string[]> {
    return this.evaluate(expression, data);
  }

  /**
   * Combined processing: filter → map → sort → limit/offset.
   */
  async process<T>(
    data: T[],
    options: {
      filter?: string;
      map?: string;
      sort?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<T[]> {
    let result = data;

    if (options.filter) {
      result = await this.filter(result, options.filter);
    }
    if (options.map) {
      result = await this.map(result, options.map);
    }
    if (options.sort) {
      result = await this.sort(result, options.sort);
    }
    if (options.limit !== undefined) {
      const start = options.offset || 0;
      result = result.slice(start, start + options.limit);
    }

    return result;
  }

  /**
   * Compiles and caches a JSONata expression for reuse.
   */
  compile(expression: string): jsonata.Expression {
    if (!this._expressionCache.has(expression)) {
      this._expressionCache.set(expression, jsonata(expression));
    }
    return this._expressionCache.get(expression)!;
  }

  /**
   * Clears the expression cache.
   */
  clearCache(): void {
    this._expressionCache.clear();
  }
}

export const jsonataService = new JsonataService();
