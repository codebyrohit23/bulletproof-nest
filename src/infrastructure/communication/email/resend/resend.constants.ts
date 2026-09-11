export const RESEND_ENDPOINT = {
  EMAILS: 'emails',
} as const;

export const RESEND_HEADER = {
  IDEMPOTENCY_KEY: 'Idempotency-Key',
} as const;

export const RESEND_ERROR_NAME = {
  INVALID_FROM_ADDRESS: 'invalid_from_address',
  INVALID_TO_ADDRESS: 'invalid_to_address',
} as const;

export const RESEND_LOG_CONTEXT = 'ResendEmail';
