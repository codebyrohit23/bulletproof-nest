import type { z } from 'zod';

import { EMAIL_TEMPLATE, type EmailTemplateId } from '../constants/index.js';
import { InvalidTemplateDataError, UnknownEmailTemplateError } from '../errors/index.js';
import type { EmailTemplate } from '../interfaces/index.js';

import { loginOtpTemplate } from './catalog/auth/login-otp.template.js';
import { otpVerificationTemplate } from './catalog/auth/otp-verification.template.js';
import { passwordResetTemplate } from './catalog/auth/password-reset.template.js';
import { welcomeTemplate } from './catalog/auth/welcome.template.js';

/**
 * Every template, by id.
 *
 * `satisfies Record<EmailTemplateId, …>` is the whole point: adding an id to
 * `EMAIL_TEMPLATE` without registering its template here fails the build. A
 * plain object would let the two drift until a job discovered it at runtime.
 *
 * `satisfies` rather than a type annotation, so the exact type of each entry
 * survives — that is what lets `EmailTemplateData` read a template's data type
 * back out. Annotating would flatten them all to one shape and lose it.
 *
 * The constraint checks only the fields that do not involve the data type.
 * Whether an entry is really a well-formed template is already settled in its
 * own file, where it is declared as `EmailTemplate<z.infer<typeof schema>>`.
 */
export const EMAIL_TEMPLATES = {
  [EMAIL_TEMPLATE.OTP_VERIFICATION]: otpVerificationTemplate,
  [EMAIL_TEMPLATE.LOGIN_OTP]: loginOtpTemplate,
  [EMAIL_TEMPLATE.PASSWORD_RESET]: passwordResetTemplate,
  [EMAIL_TEMPLATE.WELCOME]: welcomeTemplate,
} satisfies Record<EmailTemplateId, Pick<EmailTemplate<never>, 'id' | 'category'>>;

export type RegisteredEmailTemplate = (typeof EMAIL_TEMPLATES)[EmailTemplateId];

/**
 * The data one template expects, read from its own schema.
 *
 * This is what types a call site: `EmailService.send` infers the template first,
 * then checks `data` against this. The schema stays the single source of truth —
 * no second declaration to keep in step with it.
 */
export type EmailTemplateData<T extends EmailTemplateId> = z.infer<
  (typeof EMAIL_TEMPLATES)[T]['schema']
>;

/**
 * Takes a plain `string`, not an `EmailTemplateId`, because that is what the
 * caller actually has: a template id off a queue payload is whatever was
 * serialised before the last deploy, and the type says nothing about whether it
 * still exists. Returning `undefined` lets the caller raise
 * `UnknownEmailTemplateError` with the id that was missing.
 */
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

/**
 * Checks data against a template's schema, raising with the offending fields.
 *
 * Shared by both ends of the queue deliberately. `EmailService.send` runs it so
 * a bad payload fails at the call site, in the request that caused it; the
 * renderer runs it again because by then the data has been through JSON and
 * survived a deploy, and nothing about its shape is guaranteed any more.
 *
 * Returns `unknown` rather than the parsed type: the caller holds a union of
 * templates, so there is no single type to return. The renderer narrows it at
 * the one point it has to.
 */
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
