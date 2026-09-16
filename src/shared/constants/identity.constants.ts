import type { PhoneNumberType } from 'libphonenumber-js/max';

export const EMAIL_MAX_LENGTH = 150;

export const PHONE_INPUT_MAX_LENGTH = 32;

export const VERIFIABLE_PHONE_TYPES: ReadonlySet<PhoneNumberType | undefined> = new Set<
  PhoneNumberType | undefined
>(['MOBILE', 'FIXED_LINE_OR_MOBILE']);

export const DISPOSABLE_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  'yopmail.com',
  'mailinator.com',
  '10minutemail.com',
  'tempmail.com',
  'guerrillamail.com',
  'temp-mail.org',
]);
