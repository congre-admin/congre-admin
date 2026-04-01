import { dataService } from './dataService';
import { cacheService } from '../cache/cacheService';
import type {
  LoginPayload,
  LoginResponse,
  LoginStepResponse,
  User,
  ApiResponse,
} from '../types';

const SESSION_TOKEN_KEY = 'congre_admin_session_token';
const WRAPPED_MK_KEY = 'congre_wrapped_mk';
const USER_ID_KEY = 'congre_user_id';
const USERNAME_KEY = 'congre_username';
const PERFIL_ID_KEY = 'congre_perfil_id';

export class AuthService {
  async loginWithPassword(username: string, password: string): Promise<LoginResponse | LoginStepResponse> {
    return dataService.login({
      username,
      password,
    });
  }

  async loginWithPasskey(username: string, assertion: any, password?: string): Promise<LoginResponse | LoginStepResponse> {
    return dataService.login({
      username,
      password,
      method: 'passkey',
      passkeyAssertion: assertion,
    });
  }

  async loginWithTOTP(username: string, code: string, password?: string): Promise<LoginResponse | LoginStepResponse> {
    return dataService.login({
      username,
      password,
      method: 'totp',
      code,
    });
  }

  async loginWithEmailOTP(username: string, code: string, password?: string): Promise<LoginResponse | LoginStepResponse> {
    return dataService.login({
      username,
      password,
      method: 'email_otp',
      code,
    });
  }

  async register(username: string, password: string, perfilId: string, email?: string): Promise<ApiResponse & { user: User }> {
    return dataService.register({ username, password, perfilId, email });
  }

  async logout(): Promise<void> {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (sessionToken) {
      try {
        await dataService.logout(sessionToken);
      } catch {
        // Ignore errors on logout
      }
    }

    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(WRAPPED_MK_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(PERFIL_ID_KEY);

    await cacheService.clearAll();
  }

  async validateSession(): Promise<{ valid: boolean; userId?: string; username?: string }> {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!sessionToken) {
      return { valid: false };
    }

    const result = await dataService.validateSession(sessionToken);
    return result;
  }

  async refreshSession(): Promise<boolean> {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!sessionToken) {
      return false;
    }

    try {
      const result = await dataService.refreshSession(sessionToken);
      if (result.success && result.sessionToken) {
        localStorage.setItem(SESSION_TOKEN_KEY, result.sessionToken);
        return true;
      }
    } catch {
      // Session refresh failed
    }

    return false;
  }

  async setupTOTP(username: string, password: string): Promise<{ secret: string; otpURI: string }> {
    const result = await dataService.request<{ secret: string; otpURI: string }>('setupTOTP', {
      username,
      password,
    });
    return result;
  }

  async confirmTOTP(username: string, code: string): Promise<ApiResponse> {
    return dataService.request<ApiResponse>('confirmTOTP', { username, code });
  }

  async setupPasskey(username: string, deviceName: string): Promise<{ challenge: string; rp: { name: string } }> {
    const result = await dataService.request<{ challenge: string; rp: { name: string } }>('setupPasskey', {
      username,
      deviceName,
    });
    return result;
  }

  async confirmPasskey(username: string, attestation: any): Promise<ApiResponse> {
    return dataService.request<ApiResponse>('confirmPasskey', { username, attestation });
  }

  async deletePasskey(passkeyId: string): Promise<ApiResponse> {
    return dataService.request<ApiResponse>('deletePasskey', { passkeyId });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse> {
    return dataService.request<ApiResponse>('changePassword', {
      oldPassword,
      newPassword,
    });
  }

  async requestPasswordReset(username: string): Promise<ApiResponse> {
    return dataService.request<ApiResponse>('requestPasswordReset', { username });
  }

  async confirmPasswordReset(username: string, resetToken: string, newPassword: string): Promise<ApiResponse> {
    return dataService.request<ApiResponse>('confirmPasswordReset', {
      username,
      resetToken,
      newPassword,
    });
  }

  async getAuthMethods(): Promise<{
    methods: string[];
    defaultMethod: string;
    passkeys: Array<{ id: string; deviceName: string; createdAt: string }>;
    totp: { enabled: boolean };
    email_otp: { enabled: boolean };
    recovery_enabled: boolean;
  }> {
    return dataService.request('getAuthMethods');
  }

  async setDefaultAuthMethod(method: string): Promise<ApiResponse> {
    return dataService.request<ApiResponse>('setDefaultAuthMethod', { method });
  }

  async enableRecovery(): Promise<ApiResponse> {
    return dataService.request<ApiResponse>('enableRecovery');
  }

  async disableRecovery(): Promise<ApiResponse> {
    return dataService.request<ApiResponse>('disableRecovery');
  }
}

export const authService = new AuthService();
