import type { z } from 'zod';

import { EMAIL_TEMPLATE, type EmailTemplateId } from '../constants/index.js';
import { InvalidTemplateDataError, UnknownEmailTemplateError } from '../errors/index.js';
import type { EmailTemplate } from '../interfaces/index.js';

import { adminPasswordChangedTemplate } from './catalog/admin-auth/password-changed.template.js';
import { adminPasswordResetCodeTemplate } from './catalog/admin-auth/password-reset-code.template.js';
import { userLoginCodeTemplate } from './catalog/user-auth/login-code.template.js';
import { userPasswordChangedTemplate } from './catalog/user-auth/password-changed.template.js';
import { userPasswordResetCodeTemplate } from './catalog/user-auth/password-reset-code.template.js';
import { userVerificationCodeTemplate } from './catalog/user-auth/verification-code.template.js';
import { userWelcomeTemplate } from './catalog/user-auth/welcome.template.js';

const { USER_AUTH, ADMIN_AUTH } = EMAIL_TEMPLATE;

export const EMAIL_TEMPLATES = {
  [USER_AUTH.VERIFICATION_CODE]: userVerificationCodeTemplate,
  [USER_AUTH.LOGIN_CODE]: userLoginCodeTemplate,
  [USER_AUTH.PASSWORD_RESET_CODE]: userPasswordResetCodeTemplate,
  [USER_AUTH.WELCOME]: userWelcomeTemplate,
  [USER_AUTH.PASSWORD_CHANGED]: userPasswordChangedTemplate,

  [ADMIN_AUTH.PASSWORD_RESET_CODE]: adminPasswordResetCodeTemplate,
  [ADMIN_AUTH.PASSWORD_CHANGED]: adminPasswordChangedTemplate,
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
