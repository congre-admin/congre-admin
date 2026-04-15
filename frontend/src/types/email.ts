/**
 * Email Templates - Multi-language support
 * Keys must match backend action names
 */

export interface EmailVars {
  code?: string;
  username?: string;
  congregationName?: string;
  displayName?: string;
  resetLink?: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface EmailTemplates {
  [key: string]: EmailTemplate;
}

export const EMAIL_TEMPLATES: Record<string, EmailTemplates> = {
  es: {
    sendOTP: {
      subject: 'Código de verificación - {displayName}',
      body: `Tu código de verificación es: {code}

Este código expira en 10 minutos.

Si no solicitaste este código, ignorá este email.`,
    },
    sendWelcome: {
      subject: 'Bienvenido a {displayName}',
      body: `Hola {username},

Tu cuenta en {displayName} ha sido creada exitosamente.

Congregación: {congregationName}
Usuario: {username}

Ya podés iniciar sesión en la aplicación.`,
    },
    sendPasswordReset: {
      subject: 'Restablecer contraseña - {displayName}',
      body: `Hola {username},

Solicitaste restablecer tu contraseña.

Enlace para crear una nueva contraseña:
{resetLink}

Este enlace va a expirar en 1 hora.

Si no solicitaste este cambio, ignorá este email.`,
    },
    sendPasswordChanged: {
      subject: 'Contraseña actualizada - {displayName}',
      body: `Hola {username},

Tu contraseña ha sido actualizada exitosamente.

Si no realizaste este cambio, contactá al administrador inmediatamente.`,
    },
  },
  en: {
    sendOTP: {
      subject: 'Verification code - {displayName}',
      body: `Your verification code is: {code}

This code expires in 10 minutes.

If you didn't request this code, you can ignore this email.`,
    },
    sendWelcome: {
      subject: 'Welcome to {displayName}',
      body: `Hello {username},

Your {displayName} account has been successfully created.

Congregation: {congregationName}
Username: {username}

You can now log in to the application.`,
    },
    sendPasswordReset: {
      subject: 'Reset password - {displayName}',
      body: `Hello {username},

You requested to reset your password.

Link to create a new password:
{resetLink}

This link will expire in 1 hour.

If you didn't request this change, ignore this email.`,
    },
    sendPasswordChanged: {
      subject: 'Password updated - {displayName}',
      body: `Hello {username},

Your password has been successfully updated.

If you didn't make this change, contact the administrator immediately.`,
    },
  },
  pt: {
    sendOTP: {
      subject: 'Código de verificação - {displayName}',
      body: `Seu código de verificação é: {code}

Este código expira em 10 minutos.

Se você não solicitou este código, pode ignorar este email.`,
    },
    sendWelcome: {
      subject: 'Bem-vindo ao {displayName}',
      body: `Olá {username},

Sua conta em {displayName} foi criada com sucesso.

Congregação: {congregationName}
Usuário: {username}

Você já pode fazer login no aplicativo.`,
    },
    sendPasswordReset: {
      subject: 'Redefinir senha - {displayName}',
      body: `Olá {username},

Você solicitou redefinir sua senha.

Link para criar uma nova senha:
{resetLink}

Este link vai expirar em 1 hora.

Se você não solicitou esta mudança, ignore este email.`,
    },
    sendPasswordChanged: {
      subject: 'Senha atualizada - {displayName}',
      body: `Olá {username},

Sua senha foi atualizada com sucesso.

Se você não fez essa mudança, entre em contato com o administrador imediatamente.`,
    },
  },
};

/**
 * Get a template by key and locale
 */
export function getEmailTemplate(
  key: string,
  locale: string = 'es'
): EmailTemplate | null {
  const templates = EMAIL_TEMPLATES[locale] || EMAIL_TEMPLATES['es'];
  return templates[key] || null;
}

/**
 * Interpolate template variables
 */
export function interpolateTemplate(
  template: EmailTemplate,
  vars: EmailVars
): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;

  Object.entries(vars).forEach(([key, value]) => {
    if (value !== undefined) {
      const regex = new RegExp(`{${key}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }
  });

  return { subject, body };
}
