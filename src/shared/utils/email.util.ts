import { DISPOSABLE_EMAIL_DOMAINS } from '../constants/index.js';

export const normalizeEmail = (value: string): string => {
  return value.trim().toLowerCase();
};

export const emailDomain = (email: string): string | undefined => {
  return email.split('@')[1];
};

export const isDisposableEmail = (email: string): boolean => {
  const labels = emailDomain(email)?.split('.') ?? [];

  for (let i = 0; i < labels.length - 1; i++) {
    if (DISPOSABLE_EMAIL_DOMAINS.has(labels.slice(i).join('.'))) {
      return true;
    }
  }

  return false;
};
