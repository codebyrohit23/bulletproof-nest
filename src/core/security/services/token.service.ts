import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { VERIFICATION_CODE_LENGTH } from '#/shared/constants/index.js';

import { TOKEN_BYTE_LENGTH, TOKEN_HASH_ALGORITHM } from '../constants/security.constants.js';
import { timingSafeCompare, randomDigits, randomToken } from '../utils/index.js';

@Injectable()
export class TokenService {
  generate(byteLength: number = TOKEN_BYTE_LENGTH): string {
    return randomToken(byteLength);
  }

  generateVerificationCode(): string {
    return randomDigits(VERIFICATION_CODE_LENGTH);
  }

  hash(token: string): string {
    return createHash(TOKEN_HASH_ALGORITHM).update(token, 'utf8').digest('hex');
  }

  compare(plain: string, storedHash: string): boolean {
    return timingSafeCompare(this.hash(plain), storedHash);
  }
}
