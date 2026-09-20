import { RATE_LIMIT_SUBJECT, type RateLimitDefinition } from '#/core/rate-limit/index.js';

const MINUTE_MS = 60 * 1000;

const FIVE_MINUTES_MS = 5 * MINUTE_MS;

const ONE_HOUR_MS = 60 * MINUTE_MS;

const perIdentifier = (name: string, limit: number): RateLimitDefinition => ({
  name,
  rule: { limit, windowMs: FIVE_MINUTES_MS },
  by: { bodyField: 'identifier.value' },
});

const perEmail = (
  name: string,
  limit: number,
  windowMs = FIVE_MINUTES_MS,
): RateLimitDefinition => ({
  name,
  rule: { limit, windowMs },
  by: { bodyField: 'email' },
});

const perIp = (name: string, limit: number, windowMs = FIVE_MINUTES_MS): RateLimitDefinition => ({
  name,
  rule: { limit, windowMs },
  by: RATE_LIMIT_SUBJECT.IP,
});

const otpDispatchTotal = (bodyField: string): RateLimitDefinition => ({
  name: 'otp-dispatch-total',
  rule: { limit: 8, windowMs: FIVE_MINUTES_MS },
  by: { bodyField },
});

const OTP_DISPATCH_TOTAL = otpDispatchTotal('identifier.value');

const OTP_DISPATCH_TOTAL_BY_EMAIL = otpDispatchTotal('email');

const OTP_DISPATCH_BY_IP = perIp('otp-dispatch-by-ip', 20);

export const AUTH_RATE_LIMIT = {
  REGISTER: [OTP_DISPATCH_TOTAL, perIp('register-by-ip', 20, ONE_HOUR_MS), OTP_DISPATCH_BY_IP],

  RESEND_VERIFICATION: [OTP_DISPATCH_TOTAL, OTP_DISPATCH_BY_IP],

  REQUEST_LOGIN_OTP: [OTP_DISPATCH_TOTAL, OTP_DISPATCH_BY_IP],

  REQUEST_PASSWORD_RESET: [OTP_DISPATCH_TOTAL_BY_EMAIL, OTP_DISPATCH_BY_IP],

  VERIFY_REGISTRATION: [perIdentifier('verify-registration', 10), perIp('verify-code-by-ip', 30)],

  VERIFY_LOGIN_OTP: [perIdentifier('verify-login-otp', 10), perIp('verify-code-by-ip', 30)],

  VERIFY_RESET_OTP: [perEmail('verify-reset-otp', 10), perIp('verify-code-by-ip', 30)],

  LOGIN: [
    perEmail('login', 10),
    perEmail('login-hourly', 30, ONE_HOUR_MS),
    perIp('login-by-ip', 30),
  ],

  REFRESH: [perIp('refresh-by-ip', 120)],

  RESET_PASSWORD: [perIp('reset-password-by-ip', 10)],

  CHANGE_PASSWORD: [perIp('change-password-by-ip', 20)],
} as const satisfies Record<string, readonly RateLimitDefinition[]>;
