import type { EmailDriver } from '#/config/email/index.js';

import {
  RETRYABLE_EMAIL_TRANSPORT_ERROR_CODES,
  type EmailTransportErrorCode,
} from '../constants/index.js';

export class EmailTransportError extends Error {
  constructor(
    readonly code: EmailTransportErrorCode,
    readonly provider: EmailDriver,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);

    this.name = new.target.name;
  }

  get retryable(): boolean {
    return RETRYABLE_EMAIL_TRANSPORT_ERROR_CODES.has(this.code);
  }
}
