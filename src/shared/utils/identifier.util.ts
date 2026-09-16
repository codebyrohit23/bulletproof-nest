import { IdentifierType } from '@prisma/client';

import { DISPOSABLE_EMAIL_DOMAINS } from '../constants/index.js';

export const normalizeIdentifier = (
  identifierType: IdentifierType,
  identifierValue: string,
): string => {
  return identifierType === IdentifierType.EMAIL
    ? normalizeEmail(identifierValue)
    : normalizePhone(identifierValue);
};

const normalizeEmail = (value: string): string => {
  return value.trim().toLowerCase();
};

const normalizePhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');

  return digits.length === 0 ? '' : `+${digits}`;
};

export const isDisposableEmail = (email: string): boolean => {
  const domain = email.split('@')[1];

  return !!domain && DISPOSABLE_EMAIL_DOMAINS.has(domain);
};
