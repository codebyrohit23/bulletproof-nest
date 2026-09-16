import { IdentifierType } from '@prisma/client';

import { normalizeEmail } from './email.util.js';
import { normalizePhone } from './phone.util.js';

export const normalizeIdentifier = (
  identifierType: IdentifierType,
  identifierValue: string,
): string => {
  return identifierType === IdentifierType.EMAIL
    ? normalizeEmail(identifierValue)
    : normalizePhone(identifierValue);
};
