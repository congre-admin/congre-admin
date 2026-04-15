import { cacheService } from '../cache/cacheService';

export class PublicService {
  private getPublicSsId(): string {
    const cached = cacheService.getPublicSsId();
    if (cached) return cached;

    const stored = localStorage.getItem('congre_public_ss_publico');
    if (stored) {
      cacheService.setPublicSsId(stored);
      return stored;
    }

    throw new Error('PUBLIC_SS_ID not configured');
  }

  private buildGvizUrl(ssId: string, sheet: string, query?: string): string {
    const baseUrl = `https://docs.google.com/spreadsheets/d/${ssId}/gviz/tq`;
    const params = new URLSearchParams();
    params.set('sheet', sheet);
    if (query) {
      params.set('tq', query);
    }
    return `${baseUrl}?${params.toString()}`;
  }

  async getPublicData<T = any[]>(
    sheet: string,
    query?: string
  ): Promise<T> {
    const ssId = this.getPublicSsId();
    const url = this.buildGvizUrl(ssId, sheet, query);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch public data: ${response.status}`);
    }

    const text = await response.text();
    const jsonMatch = text.match(/\((.*)\)/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Google Sheets');
    }

    const parsed = JSON.parse(jsonMatch[1]);

    if (parsed.status !== 'ok') {
      throw new Error(`Google Sheets error: ${parsed.status}`);
    }

    const rows = parsed.table.rows || [];
    const headers = parsed.table.cols?.map((col: { label: string }) => col.label) || [];

    const data = rows.map((row: { c: any[] }) => {
      const obj: Record<string, any> = {};
      row.c.forEach((cell, index) => {
        const key = headers[index];
        obj[key] = cell?.v ?? null;
      });
      return obj;
    });

    return data as T;
  }

  async batchGetPublicData(
    sheets: string[]
  ): Promise<Record<string, any[]>> {
    const results: Record<string, any[]> = {};

    await Promise.all(
      sheets.map(async (sheet) => {
        results[sheet] = await this.getPublicData(sheet);
      })
    );

    return results;
  }
}

export const publicService = new PublicService();
