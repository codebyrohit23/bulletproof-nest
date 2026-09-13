import { IdentifierType } from '@prisma/client';

export function normalizeIdentifier(
  identifierType: IdentifierType,
  identifierValue: string,
): string {
  return identifierType === IdentifierType.EMAIL
    ? normalizeEmail(identifierValue)
    : normalizePhone(identifierValue);
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');

  return digits.length === 0 ? '' : `+${digits}`;
}
