import { dataService } from './dataService';
import { cacheService } from '../cache/cacheService';
import { getSession, clearSession, setSession } from '../utils/settingsCache';

const SESSION_TOKEN_KEY = 'congre_admin_session_token';
const WRAPPED_MK_KEY = 'congre_admin_wrapped_mk';
const USER_ID_KEY = 'congre_admin_user_id';
const USERNAME_KEY = 'congre_admin_username';
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
    const session = getSession();
    if (session?.sessionToken) {
      try {
        await dataService.logout(session.sessionToken);
      } catch {
        // Ignore errors on logout
      }
    }

    clearSession();

    await cacheService.clearAll();
  }

  async validateSession(): Promise<{ valid: boolean; userId?: string; username?: string }> {
    const session = getSession();
    if (!session?.sessionToken) {
      return { valid: false };
    }

    const result = await dataService.validateSession(session.sessionToken);
    return result;
  }

  async refreshSession(): Promise<boolean> {
    const session = getSession();
    if (!session?.sessionToken) {
      return false;
    }

    try {
      const result = await dataService.refreshSession(session.sessionToken);
      if (result.success && result.sessionToken) {
        setSession(result.sessionToken, session.userData);
        return true;
      }
    } catch {
      // Session refresh failed
    }

    return false;
  }

  async setupTOTP(username: string, password: string, sessionToken?: string): Promise<{ secret: string; otpURI: string }> {
    const result = await dataService.request<{ secret: string; otpURI: string }>('setupTOTP', {
      username,
      password,
      sessionToken,
    });
    return result;
  }

  async confirmTOTP(username: string, code: string, sessionToken?: string): Promise<ApiResponse> {
    return dataService.request<ApiResponse>('confirmTOTP', { username, code, sessionToken });
  }

  async setupPasskey(username: string, deviceName: string, sessionToken?: string, origin?: string): Promise<{ challenge: string; rp: { name: string } }> {
    const result = await dataService.request<{ challenge: string; rp: { name: string } }>('setupPasskey', {
      username,
      deviceName,
      sessionToken,
      origin,
    });
    return result;
  }

  async confirmPasskey(username: string, attestation: any, sessionToken?: string): Promise<ApiResponse> {
    return dataService.request<ApiResponse>('confirmPasskey', { username, attestation, sessionToken });
  }

  async deletePasskey(passkeyId: string): Promise<ApiResponse> {
    return dataService.request<ApiResponse>('deletePasskey', { passkeyId });
  }

  async disableTOTP(sessionToken?: string): Promise<ApiResponse> {
    return dataService.request<ApiResponse>('disableTOTP', { sessionToken });
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

  async confirmAction(sessionToken: string, code?: string, passkeyAssertion?: any): Promise<{
    confirmed: boolean;
    error?: string;
    locked?: boolean;
    needsConfirmation?: boolean;
    remainingAttempts?: number;
  }> {
    return dataService.request('confirmAction', {
      sessionToken,
      code,
      passkeyAssertion,
    });
  }

  async enableRecovery(): Promise<ApiResponse> {
    return dataService.request<ApiResponse>('enableRecovery');
  }

  async disableRecovery(): Promise<ApiResponse> {
    return dataService.request<ApiResponse>('disableRecovery');
  }

  async sendEmail(
    templateKey: string,
    to: string,
    vars: Record<string, string> = {},
    locale: string = 'es'
  ): Promise<ApiResponse> {
    // Auto-add displayName from congregation settings
    const displayName = getConfig('nombre_mostrar') || getConfig('nombre') || 'CongreAdmin';
    const allVars = { ...vars, displayName };
    
    // Get template from frontend (i18n support)
    const template = getEmailTemplate(templateKey, locale);
    if (!template) {
      return { success: false, error: 'ERR_TEMPLATE_NOT_FOUND' };
    }
    const { subject, body } = interpolateTemplate(template, allVars);
    
    return dataService.request<ApiResponse>('sendEmail', {
      templateKey,
      to,
      vars: allVars,
      locale,
      subject,
      body,
    });
  }
}

export const authService = new AuthService();
