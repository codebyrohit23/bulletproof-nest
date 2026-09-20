export const USER_AUTH_ERROR_MESSAGE = {
  EMAIL_ALREADY_REGISTERED: 'An account already exists for that email address.',

  PHONE_ALREADY_REGISTERED: 'An account already exists for that phone number.',

  INVALID_CREDENTIALS: 'The email or password you entered is incorrect. Please try again.',

  INVALID_CURRENT_PASSWORD: 'The current password you entered is incorrect. Please try again.',

  INVALID_REFRESH_TOKEN: 'Your session has expired. Please sign in again.',

  SIGN_IN_CONFLICT: 'Sign-in could not be completed. Please try again.',

  ACCOUNT_SUSPENDED: 'Your account has been suspended. Please contact support.',

  ACCOUNT_DEACTIVATED:
    'Your account has been deactivated. Please contact support to restore access.',

  INVALID_OR_EXPIRED_RESET_TOKEN: 'The password reset token is invalid or has expired.',

  SESSION_NOT_FOUND: 'That session was not found.',
} as const;
