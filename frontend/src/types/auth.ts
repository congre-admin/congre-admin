export interface Passkey {
  id: string;
  public_key?: string;
  device_name: string;
  created_at: string;
}

export interface AuthConfig {
  default_method: 'password' | 'passkey' | 'totp' | 'email_otp';
  password_hash?: string;
  recovery_enabled: boolean;
  email_otp?: {
    enabled: boolean;
    created_at: string;
  };
  totp?: {
    enabled: boolean;
    secret?: string;
    created_at: string;
  };
  passkeys?: Passkey[];
}

export interface UserMetadata {
  last_login?: string;
  last_password_change?: string;
  failed_login_attempts: number;
  created_from_ip?: string;
}

export interface User {
  id: string;
  username: string;
  perfilId: string;
  wrapped_mk?: string;
  auth_config: AuthConfig;
  metadata: UserMetadata;
  created_at: string;
  _v: number;
  _ts: string;
  _deleted?: boolean;
}

export interface LoginPayload {
  username: string;
  password?: string;
  method?: 'password' | 'passkey' | 'totp' | 'email_otp';
  passkeyAssertion?: any;
  totpCode?: string;
  emailOtpCode?: string;
  challengeToken?: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  perfilId: string;
  email?: string;
}
