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
  error?: string;
  requiresSetup?: boolean;
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
  isPublic?: boolean; // Use public mode (no auth, filter is_public, strip enc_)
}

export interface SaveDataOptions {
  expectedVersion?: number;
  onlyIfNew?: boolean;
  validate?: string;
}

export type DataAction = 'getData' | 'saveData' | 'deleteData' | 'hardDelete' | 'restoreData' | 'initSheet' | 'clearSheet' | 'batchExecute';
export type AuthAction = 'login' | 'register' | 'logout' | 'validateSession' | 'refreshSession';
export type ProfileAction = 'getPerfiles' | 'createProfile' | 'updateProfile' | 'deleteProfile';
export type ConfigAction = 'getConfig' | 'setConfig';

export type BatchMode = 'continue' | 'fail-fast';

export type BatchOp =
  | { op: 'read'; sheet: string; filter?: Record<string, any> }
  | { op: 'readById'; sheet: string; id: string }
  | { op: 'save'; sheet: string; data: Record<string, any> }
  | { op: 'delete'; sheet: string; id: string }
  | { op: 'hardDelete'; sheet: string; id: string }
  | { op: 'restore'; sheet: string; id: string }
  | { op: 'initSheet'; sheet: string; headers: string[]; preserveExisting?: boolean }
  | { op: 'uploadFile'; content: string; fileName: string; mimeType: string; subfolder?: string }
  | { op: 'downloadFile'; fileId: string }
  | { op: 'listFolderFiles'; subfolder?: string }
  | { op: 'deleteFile'; fileId: string }
  | { op: 'setFileSharing'; fileId: string; access: string; permission?: string }
  | { op: 'moveFileToFolder'; fileId: string; subfolder?: string };

export interface BatchResult {
  index: number;
  op: string;
  sheet?: string;
  success: boolean;
  error?: string;
  data?: any;
}

export interface BatchExecuteResponse {
  success: boolean;
  error?: string;
  results?: BatchResult[];
  totalOps?: number;
  succeeded?: number;
  failed?: number;
}

export interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  created: string;
  modified: string;
  url: string;
  shared: boolean;
  access: string;
  permission: string;
}

export interface ListFilesResponse {
  success: boolean;
  files: FileItem[];
}

export interface UploadFileResponse {
  success: boolean;
  fileId: string;
  fileUrl: string;
  fileName: string;
  size: number;
}

export interface DownloadFileResponse {
  success: boolean;
  fileName: string;
  mimeType: string;
  size: number;
  content: string;
}

export interface SetSharingResponse {
  success: boolean;
  fileId: string;
  access: string;
  permission: string;
  shareUrl: string;
}

export interface MoveFileResponse {
  success: boolean;
  fileId: string;
  fileName: string;
  folderId: string;
  fileUrl: string;
}

export type HarmonyMode = 'complementary' | 'analogous' | 'triadic' | 'split' | 'monochromatic';

export interface BgSetting {
  mode: 'auto' | 'neutral' | 'custom';
  value: string | null;
}

export interface ThemeConfig {
  primary: string;
  secondary?: string;
  harmony: HarmonyMode;
  backgrounds: {
    lightPage: BgSetting;
    lightPanel: BgSetting;
    darkPage: BgSetting;
    darkPanel: BgSetting;
  };
}

export interface IconConfig {
  mode: 'default' | 'custom';
  text: string;
  bgMode: 'primary' | 'secondary' | 'custom';
  bgColor: string;
  textMode: 'white' | 'auto' | 'custom';
  textColor: string;
  sizes?: Record<string, string>;
}
