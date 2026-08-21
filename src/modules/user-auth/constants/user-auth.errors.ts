export const USER_AUTH_ERROR_MESSAGE = {
  EMAIL_ALREADY_REGISTERED: 'An account already exists for that email address.',

  PHONE_ALREADY_REGISTERED: 'An account already exists for that phone number.',

  INVALID_OR_EXPIRED_CODE: 'That verification code is invalid or has expired. Request a new one.',

  TOO_MANY_CODE_ATTEMPTS: 'Too many incorrect attempts for this code. Request a new one.',

  INVALID_CREDENTIALS: 'The email or password you entered is incorrect. Please try again.',
} as const;
