export const ADMIN_AUTH_ERROR_MESSAGE = {
  INVALID_CREDENTIALS: 'Sign-in failed. Check the email and password and try again.',

  SIGN_IN_CONFLICT: 'Sign-in could not be completed. Please try again.',

  INVALID_OR_EXPIRED_CODE: 'That verification code is invalid or has expired.',

  TOO_MANY_CODE_ATTEMPTS: 'Too many incorrect attempts for this code.',

  INVALID_OR_EXPIRED_RESET_TOKEN: 'The password reset token is invalid or has expired.',
} as const;
