import type { z } from 'zod';

import { EMAIL_TEMPLATE, type EmailTemplateId } from '../constants/index.js';
import { InvalidTemplateDataError, UnknownEmailTemplateError } from '../errors/index.js';
import type { EmailTemplate } from '../interfaces/index.js';

import { adminPasswordChangedTemplate } from './catalog/admin-auth/password-changed.template.js';
import { adminPasswordResetTemplate } from './catalog/admin-auth/password-reset.template.js';
import { loginOtpTemplate } from './catalog/user-auth/login-otp.template.js';
import { otpVerificationTemplate } from './catalog/user-auth/otp-verification.template.js';
import { passwordChangedTemplate } from './catalog/user-auth/password-changed.template.js';
import { passwordResetTemplate } from './catalog/user-auth/password-reset.template.js';
import { welcomeTemplate } from './catalog/user-auth/welcome.template.js';

export const EMAIL_TEMPLATES = {
  [EMAIL_TEMPLATE.OTP_VERIFICATION]: otpVerificationTemplate,
  [EMAIL_TEMPLATE.LOGIN_OTP]: loginOtpTemplate,
  [EMAIL_TEMPLATE.PASSWORD_RESET]: passwordResetTemplate,
  [EMAIL_TEMPLATE.WELCOME]: welcomeTemplate,
  [EMAIL_TEMPLATE.PASSWORD_CHANGED]: passwordChangedTemplate,
  [EMAIL_TEMPLATE.ADMIN_PASSWORD_RESET]: adminPasswordResetTemplate,
  [EMAIL_TEMPLATE.ADMIN_PASSWORD_CHANGED]: adminPasswordChangedTemplate,
} satisfies Record<EmailTemplateId, Pick<EmailTemplate<never>, 'id' | 'category'>>;

export type RegisteredEmailTemplate = (typeof EMAIL_TEMPLATES)[EmailTemplateId];

export type EmailTemplateData<T extends EmailTemplateId> = z.infer<
  (typeof EMAIL_TEMPLATES)[T]['schema']
>;

export function findEmailTemplate(id: string): RegisteredEmailTemplate | undefined {
  return Object.hasOwn(EMAIL_TEMPLATES, id) ? EMAIL_TEMPLATES[id as EmailTemplateId] : undefined;
}

export function requireEmailTemplate(id: string): RegisteredEmailTemplate {
  const template = findEmailTemplate(id);

  if (template === undefined) {
    throw new UnknownEmailTemplateError(id);
  }

  return template;
}

export function parseTemplateData(template: RegisteredEmailTemplate, data: unknown): unknown {
  const parsed = template.schema.safeParse(data);

  if (!parsed.success) {
    throw new InvalidTemplateDataError(
      template.id,
      parsed.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
      { cause: parsed.error },
    );
  }

  return parsed.data;
}
