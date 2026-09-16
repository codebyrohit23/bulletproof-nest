import { DISPOSABLE_EMAIL_DOMAINS } from '../constants/index.js';

// The local part is case-sensitive per RFC 5321, but no mainstream provider
// treats it that way, and two rows for `Rohit@` and `rohit@` is the worse
// failure. Gmail dot/plus aliases are deliberately NOT folded: the stored value
// is what the user typed, and aliasing rules are provider-specific.
export const normalizeEmail = (value: string): string => {
  return value.trim().toLowerCase();
};

export const emailDomain = (email: string): string | undefined => {
  return email.split('@')[1];
};

// Matches the domain or any parent domain, so `x@inbox.mailinator.com` is
// caught as well as `x@mailinator.com`. The last label alone (`com`) is never
// tested.
export const isDisposableEmail = (email: string): boolean => {
  const labels = emailDomain(email)?.split('.') ?? [];

  for (let i = 0; i < labels.length - 1; i++) {
    if (DISPOSABLE_EMAIL_DOMAINS.has(labels.slice(i).join('.'))) {
      return true;
    }
  }

  return false;
};
