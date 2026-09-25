import { RATE_LIMIT_SUBJECT, type RateLimitDefinition } from '#/core/rate-limit/index.js';

const MINUTE_MS = 60 * 1000;

const FIVE_MINUTES_MS = 5 * MINUTE_MS;

const ONE_HOUR_MS = 60 * MINUTE_MS;

export const ADMIN_AUTH_RATE_LIMIT = {
  LOGIN: [
    {
      name: 'admin-login',
      rule: { limit: 5, windowMs: FIVE_MINUTES_MS },
      by: { bodyField: 'email' },
    },
    {
      name: 'admin-login-hourly',
      rule: { limit: 15, windowMs: ONE_HOUR_MS },
      by: { bodyField: 'email' },
    },
    {
      name: 'admin-login-by-ip',
      rule: { limit: 20, windowMs: FIVE_MINUTES_MS },
      by: RATE_LIMIT_SUBJECT.IP,
    },
  ],

  /*
   * Every accepted request can send an email, so the budget is per address as
   * well as per IP: a rotating-IP script aimed at one admin still stops. Named
   * apart from the user's `code-dispatch-*` buckets so a flood on the user reset
   * cannot lock an admin out of theirs, or the reverse.
   */
  REQUEST_PASSWORD_RESET: [
    {
      name: 'admin-password-reset-request',
      rule: { limit: 3, windowMs: FIVE_MINUTES_MS },
      by: { bodyField: 'email' },
    },
    {
      name: 'admin-password-reset-request-hourly',
      rule: { limit: 10, windowMs: ONE_HOUR_MS },
      by: { bodyField: 'email' },
    },
    {
      name: 'admin-password-reset-request-by-ip',
      rule: { limit: 10, windowMs: FIVE_MINUTES_MS },
      by: RATE_LIMIT_SUBJECT.IP,
    },
  ],

  /*
   * A code already dies after five wrong answers; this bounds how fast a
   * guesser can burn through fresh ones, and caps an IP spraying many admins.
   */
  VERIFY_PASSWORD_RESET_CODE: [
    {
      name: 'admin-verify-password-reset-code',
      rule: { limit: 10, windowMs: FIVE_MINUTES_MS },
      by: { bodyField: 'email' },
    },
    {
      name: 'admin-verify-password-reset-code-by-ip',
      rule: { limit: 20, windowMs: FIVE_MINUTES_MS },
      by: RATE_LIMIT_SUBJECT.IP,
    },
  ],

  /*
   * Per IP only: the body carries a token, not an address, and a 256-bit
   * token is not guessable — this caps the password-hashing cost a client can
   * make the server pay.
   */
  RESET_PASSWORD: [
    {
      name: 'admin-reset-password-by-ip',
      rule: { limit: 10, windowMs: FIVE_MINUTES_MS },
      by: RATE_LIMIT_SUBJECT.IP,
    },
  ],
} as const satisfies Record<string, readonly RateLimitDefinition[]>;
