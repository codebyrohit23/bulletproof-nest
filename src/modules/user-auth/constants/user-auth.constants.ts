export const LAST_ACTIVE_THROTTLE_MS = 5 * 60 * 1000;

export const USER_AUTH_LOG_CONTEXT = 'UserAuth';

export const USER_AUTH_API_TAG = {
  name: 'User Authentication',
  description: 'Endpoints for user authentication and management.',
} as const;

export const IDENTIFIER_MAX_LENGTH = 320;

export const PHONE_E164_PATTERN = /^\+[1-9]\d{1,14}$/;

export const PASSWORD_MIN_LENGTH = 8;

export const VERIFICATION_CODE_PATTERN = /^\d{6}$/;

export const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;

export const VERIFICATION_CODE_MAX_ATTEMPTS = 5;

export const PASSWORD_LOWERCASE_PATTERN = /\p{Ll}/u;

export const PASSWORD_UPPERCASE_PATTERN = /\p{Lu}/u;

export const PASSWORD_SPECIAL_PATTERN = /[^\p{L}\p{N}]/u;
