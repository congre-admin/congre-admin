import { cacheService } from '../cache/cacheService';
import type {
  ApiResponse,
  GetDataOptions,
  SaveDataOptions,
  LoginPayload,
  LoginResponse,
  LoginStepResponse,
  ValidateSessionResponse,
  GetPerfilesResponse,
  GetDataResponse,
  Perfil,
} from '../types';

const ERROR_MESSAGES: Record<string, string> = {
  ERR_AUTH_REQUIRED: 'Se requiere autenticación',
  ERR_AUTH_INVALID: 'Credenciales inválidas',
  ERR_SESSION_EXPIRED: 'La sesión ha expirado',
  ERR_SESSION_NOT_FOUND: 'Sesión no encontrada',
  ERR_USER_NOT_FOUND: 'Usuario no encontrado',
  ERR_USER_EXISTS: 'El usuario ya existe',
  ERR_VERSION_CONFLICT: 'Conflicto de versión',
  ERR_PERMISSION_DENIED: 'Permiso denegado',
  ERR_RATE_LIMITED: 'Demasiados intentos. Intenta más tarde.',
  ERR_INVALID_CREDENTIALS: 'Credenciales inválidas',
  ERR_PASSWORD_WEAK: 'Contraseña muy débil',
  ERR_PROFILE_EXISTS: 'El perfil ya existe',
  ERR_PROFILE_NOT_FOUND: 'Perfil no encontrado',
  ERR_PROFILE_IN_USE: 'El perfil está en uso',
};

const SESSION_TOKEN_KEY = 'congre_admin_session_token';
const ADMIN_SS_ID_KEY = 'congre_admin_ss_id';

export class DataService {
  private apiUrl: string | null = null;

  constructor() {
    this.apiUrl = localStorage.getItem('congre_admin_api_url');
  }

  private normalizeUrl(input: string): string {
    if (!input) return '';
    if (input.includes('script.google.com')) {
      return input.endsWith('/exec') ? input : `${input}/exec`;
    }
    return `https://script.google.com/macros/s/${input}/exec`;
  }

  setApiUrl(url: string): void {
    this.apiUrl = url;
    localStorage.setItem('congre_admin_api_url', url);
  }

  getApiUrl(): string | null {
    return this.apiUrl;
  }

  async resolveModule(moduleOrSsId: string): Promise<string> {
    if (moduleOrSsId.length > 20) {
      return moduleOrSsId;
    }

    const cached = cacheService.getModuleSsId(moduleOrSsId);
    if (cached) return cached;

    const coreSsId = localStorage.getItem(ADMIN_SS_ID_KEY);
    if (!coreSsId) {
      throw new Error('CORE_SS_ID not configured');
    }

    const response = await this.getData<{ plugin_id: string; ssId: string }[]>(
      'Registro_Plugins',
      coreSsId
    );
    const plugin = response.find((p) => p.plugin_id === moduleOrSsId);

    if (!plugin) {
      throw new Error(`Module ${moduleOrSsId} not found`);
    }

    cacheService.setModuleSsId(moduleOrSsId, plugin.ssId);
    return plugin.ssId;
  }

  async request<T = any>(action: string, payload: Record<string, any> = {}): Promise<T> {
    // Always read fresh from localStorage
    this.apiUrl = localStorage.getItem('congre_admin_api_url') || this.apiUrl;
    
    if (!this.apiUrl) {
      throw new Error('API URL not configured');
    }

    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    const coreSsId = localStorage.getItem(ADMIN_SS_ID_KEY);

    const body: Record<string, any> = {
      action,
      payload,
    };

    if (sessionToken && !['login', 'register', 'challenge', 'requestOTP', 'install'].includes(action)) {
      body.sessionToken = sessionToken;
    }

    if (coreSsId && !body.payload?.ssId) {
      body.payload = { ...body.payload, ssId: coreSsId };
    }

    const url = this.normalizeUrl(this.apiUrl);
    
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
        mode: 'cors',
        redirect: 'follow',
      });
    } catch (fetchError) {
      const error = fetchError as Error;
      if (error.message === 'Failed to fetch' || error.message.includes('CORS') || error.name === 'TypeError') {
        throw new Error('Error de conexión con el servidor. Verifica que:\n1. El Google Apps Script esté desplegado como "Cualquier persona"\n2. La URL del script sea correcta\n3. Intenta en una ventana de incógnito');
      }
      throw error;
    }

    if (!response.ok) {
      if (response.status === 0 || response.status === undefined) {
        throw new Error('Error de CORS. El servidor no permite solicitudes desde este origen.');
      }
      throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
    }

    let result: T & { success: boolean; error?: string };
    try {
      result = await response.json() as T & { success: boolean; error?: string };
    } catch (e) {
      throw new Error(`Respuesta inválida del servidor: ${response.statusText}`);
    }

    if (!result.success && result.error) {
      const message = ERROR_MESSAGES[result.error] || result.error;
      throw new Error(message);
    }

    return result;
  }

  async getData<T = any[]>(sheet: string, ssId: string, options?: GetDataOptions): Promise<T> {
    // Flatten payload for backend - getData expects sheet/ssId at top level
    const result = await this.request<GetDataResponse<T>>('getData', {
      ...options,
      sheet,
      ssId,
    });

    return result.data;
  }

  async batchGetData<T = Record<string, any[]>>(
    sheets: string[],
    ssId: string
  ): Promise<T> {
    const result = await this.request<{ success: true; data: T }>('batchGetData', {
      sheets: sheets.join(','),
      ssId,
    });
    return result.data;
  }

  async saveData(
    sheet: string,
    ssId: string,
    payload: any,
    options?: SaveDataOptions
  ): Promise<ApiResponse> {
    return this.request<ApiResponse>('saveData', {
      sheet,
      ssId,
      payload,
      expectedVersion: options?.expectedVersion,
      onlyIfNew: options?.onlyIfNew,
      validate: options?.validate,
    });
  }

  async deleteData(sheet: string, ssId: string, id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('deleteData', { sheet, ssId, id });
  }

  async hardDelete(sheet: string, ssId: string, id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('hardDelete', { sheet, ssId, id });
  }

  async restoreData(sheet: string, ssId: string, id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('restoreData', { sheet, ssId, id });
  }

  async login(payload: LoginPayload): Promise<LoginResponse | LoginStepResponse> {
    return this.request<LoginResponse | LoginStepResponse>('login', payload);
  }

  async register(payload: { username: string; password: string; perfilId: string; email?: string }): Promise<ApiResponse & { user: any }> {
    return this.request<ApiResponse & { user: any }>('register', payload);
  }

  async logout(sessionToken: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('logout', { sessionToken });
  }

  async validateSession(sessionToken: string): Promise<ValidateSessionResponse> {
    return this.request<ValidateSessionResponse>('validateSession', { sessionToken });
  }

  async refreshSession(sessionToken: string): Promise<ApiResponse & { sessionToken: string }> {
    return this.request<ApiResponse & { sessionToken: string }>('refreshSession', { sessionToken });
  }

  async getPerfiles(ssId: string): Promise<Perfil[]> {
    return this.getData<Perfil>('Perfiles', ssId);
  }

  async createProfile(ssId: string, payload: Partial<Perfil>): Promise<ApiResponse> {
    return this.saveData('Perfiles', ssId, {
      ...payload,
      _v: 1,
      _ts: new Date().toISOString(),
      _deleted: false,
    });
  }

  async updateProfile(ssId: string, payload: Partial<Perfil>): Promise<ApiResponse> {
    return this.saveData('Perfiles', ssId, payload);
  }

  async deleteProfile(ssId: string, profileId: string): Promise<ApiResponse> {
    return this.deleteData('Perfiles', ssId, profileId);
  }

  async batchInitSheet(ssId: string, tables: { name: string; headers: string[]; preserveExisting?: boolean }[]): Promise<{ success: boolean; results: { name: string; status: string }[] }> {
    return this.request<{ success: boolean; results: { name: string; status: string }[] }>('batchInitSheet', {
      ssId: ssId,
      tables: tables,
    });
  }

  async batchSaveData(ssId: string, sheet: string, rows: any[]): Promise<{ success: boolean; results: { id: string; status: string }[] }> {
    return this.request<{ success: boolean; results: { id: string; status: string }[] }>('batchSaveData', {
      ssId: ssId,
      sheet: sheet,
      rows: rows,
    });
  }

  async batchDeleteData(ssId: string, sheet: string, ids: string[]): Promise<{ success: boolean; results: { id: string; status: string }[] }> {
    return this.request<{ success: boolean; results: { id: string; status: string }[] }>('batchDeleteData', {
      ssId: ssId,
      sheet: sheet,
      ids: ids,
    });
  }

  async getConfig(key: string, ssId: string): Promise<{ clave: string; valor: string } | null> {
    const result = await this.getData<{ clave: string; valor: string }[]>('Configuracion', ssId);
    return result.find((c) => c.clave === key) || null;
  }

  async setConfig(
    key: string,
    value: string,
    ssId: string,
    isPublic = false
  ): Promise<ApiResponse> {
    const existing = await this.getConfig(key, ssId);
    return this.saveData('Configuracion', ssId, {
      ...(existing || {}),
      clave: key,
      valor: value,
      is_public: isPublic,
    });
  }
}

export const dataService = new DataService();
