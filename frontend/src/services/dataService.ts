import { cacheService } from '../cache/cacheService';
import { jsonataService } from './jsonataService';
import { getConfig, setConfig } from '../utils/settingsCache';
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
  AdminUser,
  BatchOp,
  BatchMode,
  BatchExecuteResponse,
  BatchResult,
  FileItem,
  ListFilesResponse,
  UploadFileResponse,
  DownloadFileResponse,
  SetSharingResponse,
  MoveFileResponse,
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
  ERR_SS_ID_REQUIRED: 'Se requiere ID de hoja de cálculo',
  ERR_FILE_NOT_FOUND: 'Archivo no encontrado',
  ERR_FILE_TOO_LARGE: 'Archivo demasiado grande (máx 37MB)',
  ERR_INVALID_MIMETYPE: 'Tipo de archivo no permitido',
  ERR_FOLDER_NOT_FOUND: 'Carpeta no encontrada',
  ERR_SUBFOLDER_NOT_FOUND: 'Subcarpeta no encontrada',
  ERR_INVALID_BASE64: 'Contenido inválido',
  ERR_BATCH_EMPTY: 'No se proporcionaron operaciones',
  ERR_BATCH_TOO_LARGE: 'Demasiadas operaciones (máx 50 por llamada)',
  ERR_SKIPPED: 'Omitida por error anterior',
  ERR_UNKNOWN_OP: 'Operación desconocida',
};

const SESSION_TOKEN_KEY = 'congre_admin_session_token';
const FOLDER_ID_KEY = 'congre_admin_folder_id';
const MODULE_MAP_KEY = 'congre_module_map';

const BATCH_MAX_OPS = 50;

export class DataService {
  private apiUrl: string | null = null;
  private _moduleMap: Record<string, string> | null = null;
  private _inFlight = new Map<string, Promise<any>>();

  constructor() {
    this.apiUrl = getConfig('gas_url');
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
    setConfig('gas_url', url, true);
  }

  getApiUrl(): string | null {
    return this.apiUrl;
  }

  resolveModule(sheetName: string, ssId: string): string | null {
    if (!this._moduleMap) {
      try {
        this._moduleMap = JSON.parse(localStorage.getItem(MODULE_MAP_KEY) || '{}');
      } catch {
        this._moduleMap = {};
      }
    }
    if (ssId === getConfig('ss_core')) return 'core';
    return this._moduleMap?.[ssId] || null;
  }

  async refreshModuleMap(): Promise<void> {
    this._moduleMap = null;
    const coreSsId = getConfig('ss_core');
    if (!coreSsId) return;

    try {
      const plugins = await this.getData<{ plugin_id: string; ssId: string }[]>('Registro_Plugins', coreSsId);
      const map: Record<string, string> = { [coreSsId]: 'core' };
      for (const p of plugins) {
        if (p.ssId && p.plugin_id) {
          map[p.ssId] = p.plugin_id;
        }
      }
      localStorage.setItem(MODULE_MAP_KEY, JSON.stringify(map));
      this._moduleMap = map;
    } catch {
      this._moduleMap = null;
    }
  }

  async resolveModuleLegacy(moduleOrSsId: string): Promise<string> {
    if (moduleOrSsId.length > 20) {
      return moduleOrSsId;
    }

    const cached = cacheService.getModuleSsId(moduleOrSsId);
    if (cached) return cached;

    const coreSsId = getConfig('ss_core');
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

  async request<T = any>(action: string, payload: Record<string, any> = {}, options?: { mode?: 'admin' | 'public' }): Promise<T> {
    const key = `${action}:${JSON.stringify(payload)}`;
    if (this._inFlight.has(key)) return this._inFlight.get(key) as Promise<T>;

    const promise = this._doRequest<T>(action, payload, options?.mode);
    this._inFlight.set(key, promise);
    try {
      return await promise;
    } finally {
      this._inFlight.delete(key);
    }
  }

  private async _doRequest<T = any>(action: string, payload: Record<string, any> = {}, accessMode?: 'admin' | 'public'): Promise<T> {
    this.apiUrl = getConfig('gas_url') || this.apiUrl;
    
    if (!this.apiUrl) {
      throw new Error('API URL not configured');
    }
    
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    const coreSsId = getConfig('ss_core');
    const requestSsId = payload.ssId || coreSsId;

    const body: Record<string, any> = {
      action,
      payload,
    };

    // Public mode: skip session, pass mode flag
    if (accessMode === 'public') {
      body.payload = { ...body.payload, mode: 'public' };
    } else if (sessionToken && !['login', 'register', 'challenge', 'requestOTP', 'install'].includes(action)) {
      body.sessionToken = sessionToken;
    }

    if (coreSsId) {
      body.payload = { ...body.payload, coreSsId };
    }

    if (requestSsId) {
      body.payload = { ...body.payload, ssId: requestSsId };
      const module = this.resolveModule(payload.sheet, requestSsId);
      if (module) {
        body.payload = { ...body.payload, module };
      }
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

    if (action === 'batchExecute') {
      const batchResult = result as unknown as BatchExecuteResponse;
      if (!batchResult.success) {
        if (batchResult.results?.length) {
          const firstError = batchResult.results.find((r: BatchResult) => !r.success);
          if (firstError?.error) {
            const message = ERROR_MESSAGES[firstError.error] || firstError.error;
            throw new Error(message);
          }
        } else if (batchResult.error) {
          const message = ERROR_MESSAGES[batchResult.error] || batchResult.error;
          throw new Error(message);
        }
      }
      return result as T;
    }

    if (!result.success && result.error) {
      const message = ERROR_MESSAGES[result.error] || result.error;
      throw new Error(message);
    }

    return result;
  }

  async getData<T = any[]>(sheet: string, ssId: string, options?: GetDataOptions): Promise<T> {
    const result = await this.request<GetDataResponse<T>>('getData', {
      sheet,
      ssId,
    }, { mode: options?.isPublic ? 'public' : 'admin' });

    let data = result.data as any[];

    if (options?.filter) {
      data = await jsonataService.filter(data, options.filter);
    }
    if (options?.map) {
      data = await jsonataService.map(data, options.map);
    }
    if (options?.sanitize) {
      data = await jsonataService.sanitize(data);
    }
    if (options?.sort) {
      data = await jsonataService.sort(data, options.sort);
    }
    if (options?.limit !== undefined) {
      const start = options.offset || 0;
      data = data.slice(start, start + options.limit);
    }

    return data as T;
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

  async batchExecute(
    operations: BatchOp[],
    options?: {
      mode?: BatchMode;
      folderId?: string;
      isSetup?: boolean;
      ssId?: string;
      onProgress?: (completed: number, total: number, chunkResult: BatchExecuteResponse) => void;
    }
  ): Promise<BatchExecuteResponse> {
    if (!operations.length) {
      throw new Error(ERROR_MESSAGES.ERR_BATCH_EMPTY);
    }

    const chunkSize = BATCH_MAX_OPS;
    const mode = options?.mode || 'continue';
    const folderId = options?.folderId || localStorage.getItem(FOLDER_ID_KEY) || undefined;
    const allResults: BatchResult[] = [];
    let totalSucceeded = 0;
    let totalFailed = 0;

    for (let i = 0; i < operations.length; i += chunkSize) {
      const chunk = operations.slice(i, i + chunkSize);

      if (mode === 'fail-fast' && totalFailed > 0) {
        const remaining = operations.length - i;
        for (let j = 0; j < remaining; j++) {
          allResults.push({
            index: i + j,
            op: operations[i + j].op,
            success: false,
            error: 'ERR_SKIPPED: Previous chunk failed',
          });
        }
        totalFailed += remaining;
        break;
      }

      const requestPayload: Record<string, any> = {
        operations: chunk,
        mode,
      };
      if (options?.ssId) {
        requestPayload.ssId = options.ssId;
      }
      if (folderId) {
        requestPayload.folderId = folderId;
      }
      if (options?.isSetup) {
        requestPayload.isSetup = true;
      }

      const response = await this.request<BatchExecuteResponse>('batchExecute', requestPayload);

      for (const result of (response.results || [])) {
        allResults.push({ ...result, index: i + result.index });
        if (result.success) totalSucceeded++; else totalFailed++;
      }

      options?.onProgress?.(i + chunk.length, operations.length, response);
    }

    return {
      success: totalFailed === 0,
      results: allResults,
      totalOps: operations.length,
      succeeded: totalSucceeded,
      failed: totalFailed,
    };
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
    return this.getData<Perfil[]>('Perfiles', ssId);
  }

  // --- User & Profile Admin Actions (via admin actions API) ---
  
  async getUsers(ssId: string): Promise<AdminUser[]> {
    return this.request<{ success: boolean; users: AdminUser[] }>('getUsers', { ssId }).then(r => r.users);
  }
  
  async createUser(ssId: string, payload: { username: string; email?: string; password: string; perfilIds?: string[]; wrapped_mk?: string }): Promise<ApiResponse> {
    return this.request<ApiResponse>('createUser', { ssId, ...payload });
  }
  
  async updateUser(ssId: string, payload: { id: string; username?: string; email?: string; perfilIds?: string[]; active?: boolean }): Promise<ApiResponse> {
    return this.request<ApiResponse>('updateUser', { ssId, ...payload });
  }
  
  async deleteUser(ssId: string, userId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('deleteUser', { ssId, id: userId });
  }
  
  async getPerfilesAdmin(ssId: string): Promise<Perfil[]> {
    return this.request<{ success: boolean; perfiles: Perfil[] }>('getPerfiles', { ssId }).then(r => r.perfiles);
  }
  
  async createProfile(ssId: string, payload: { id: string; nombre: string; descripcion?: string; permisos: Record<string, any> }): Promise<ApiResponse> {
    return this.request<ApiResponse>('createProfile', { ssId, ...payload });
  }
  
  async updateProfile(ssId: string, payload: { id: string; nombre?: string; descripcion?: string; permisos?: Record<string, any> }): Promise<ApiResponse> {
    return this.request<ApiResponse>('updateProfile', { ssId, ...payload });
  }
  
  async deleteProfile(ssId: string, profileId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('deleteProfile', { ssId, id: profileId });
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
    const op: BatchOp = {
      sheet: 'Configuracion',
      op: existing ? 'update' : 'create',
      ...(existing || {}),
      clave: key,
      valor: value,
      is_public: isPublic ? 'true' : 'false',
    };
    return this.batchExecute([op], { ssId });
  }

  // --- File Operations ---

  async listFolderFiles(folderId?: string, subfolder?: string): Promise<ListFilesResponse> {
    const resolvedFolder = folderId || localStorage.getItem(FOLDER_ID_KEY);
    if (!resolvedFolder) {
      throw new Error('ERR_FOLDER_NOT_FOUND: No folder ID configured');
    }
    return this.request<ListFilesResponse>('listFolderFiles', {
      folderId: resolvedFolder,
      subfolder,
    });
  }

  async uploadFile(
    content: string,
    fileName: string,
    mimeType: string,
    options?: { folderId?: string; subfolder?: string }
  ): Promise<UploadFileResponse> {
    const resolvedFolder = options?.folderId || localStorage.getItem(FOLDER_ID_KEY);
    if (!resolvedFolder) {
      throw new Error('ERR_FOLDER_NOT_FOUND: No folder ID configured');
    }
    return this.request<UploadFileResponse>('uploadFile', {
      folderId: resolvedFolder,
      content,
      fileName,
      mimeType,
      subfolder: options?.subfolder,
    });
  }

  async downloadFile(fileId: string): Promise<DownloadFileResponse> {
    return this.request<DownloadFileResponse>('downloadFile', { fileId });
  }

  async deleteFile(fileId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('deleteFile', { fileId });
  }

  async setFileSharing(
    fileId: string,
    access: 'PRIVATE' | 'ANYONE_WITH_LINK' | 'DOMAIN' | 'ANYONE',
    permission: 'VIEW' | 'COMMENT' | 'EDIT' = 'VIEW'
  ): Promise<SetSharingResponse> {
    return this.request<SetSharingResponse>('setFileSharing', {
      fileId,
      access,
      permission,
    });
  }

  async moveFileToFolder(
    fileId: string,
    options?: { folderId?: string; subfolder?: string }
  ): Promise<MoveFileResponse> {
    const resolvedFolder = options?.folderId || localStorage.getItem(FOLDER_ID_KEY);
    if (!resolvedFolder) {
      throw new Error('ERR_FOLDER_NOT_FOUND: No folder ID configured');
    }
    return this.request<MoveFileResponse>('moveFileToFolder', {
      folderId: resolvedFolder,
      fileId,
      subfolder: options?.subfolder,
    });
  }
}

export const dataService = new DataService();
