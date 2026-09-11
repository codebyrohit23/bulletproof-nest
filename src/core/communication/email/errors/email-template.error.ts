import type { EmailTemplateId } from '../constants/index.js';

export abstract class EmailTemplateError extends Error {
  abstract readonly retryable: boolean;

  protected constructor(message: string, options?: ErrorOptions) {
    super(message, options);

    this.name = new.target.name;
  }
}

export class UnknownEmailTemplateError extends EmailTemplateError {
  readonly retryable = false;

  constructor(readonly template: string) {
    super(`No email template is registered for "${template}".`);
  }
}

export class InvalidTemplateDataError extends EmailTemplateError {
  readonly retryable = false;

  constructor(
    readonly template: EmailTemplateId,
    readonly issues: readonly string[],
    options?: ErrorOptions,
  ) {
    super(`Data for email template "${template}" is invalid: ${issues.join('; ')}`, options);
  }
}
