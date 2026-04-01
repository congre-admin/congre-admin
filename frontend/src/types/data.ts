export type Permiso = 'R' | 'W' | 'RW';

export interface PluginConfig {
  [key: string]: any;
}

export interface Plugin {
  plugin_id: string;
  ssId: string;
  status: 'active' | 'suspended';
  config?: PluginConfig;
  _v: number;
  _ts: string;
  _deleted?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface GetDataResponse<T = any[]> {
  success: true;
  data: T;
}

export interface VersionConflictResponse {
  success: false;
  error: 'ERR_VERSION_CONFLICT';
  message: string;
  currentVersion: number;
}

export interface LoginResponse {
  success: true;
  sessionToken: string;
  wrapped_mk?: string;
  expiresAt: string;
  user: {
    id: string;
    username: string;
    perfilId: string;
  };
}

export interface LoginStepResponse {
  success: false;
  step: 'email_otp' | 'totp' | 'passkey' | 'method';
  availableMethods?: string[];
  defaultMethod?: string;
  message: string;
}

export interface ValidateSessionResponse {
  valid: boolean;
  userId?: string;
  username?: string;
  expiresAt?: string;
}

export interface GetPerfilesResponse {
  success: true;
  perfiles: any[];
}

export interface AuthMethodsResponse {
  success: true;
  methods: string[];
  defaultMethod: string;
  passkeys: Array<{
    id: string;
    deviceName: string;
    createdAt: string;
  }>;
  totp: { enabled: boolean };
  email_otp: { enabled: boolean };
  recovery_enabled: boolean;
}

export interface GetDataOptions {
  filter?: string;
  map?: string;
  sanitize?: boolean;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface SaveDataOptions {
  expectedVersion?: number;
  onlyIfNew?: boolean;
  validate?: string;
}

export type DataAction = 'getData' | 'batchGetData' | 'saveData' | 'deleteData' | 'hardDelete' | 'restoreData';
export type AuthAction = 'login' | 'register' | 'logout' | 'validateSession' | 'refreshSession';
export type ProfileAction = 'getPerfiles' | 'createProfile' | 'updateProfile' | 'deleteProfile';
export type ConfigAction = 'getConfig' | 'setConfig';
