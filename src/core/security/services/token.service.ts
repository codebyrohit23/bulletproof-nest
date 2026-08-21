import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import {
  NUMERIC_CODE_LENGTH,
  TOKEN_BYTE_LENGTH,
  TOKEN_HASH_ALGORITHM,
} from '../constants/security.constants.js';
import { timingSafeCompare } from '../utils/constant-time.util.js';
import { randomDigits, randomToken } from '../utils/random.util.js';

@Injectable()
export class TokenService {
  generate(byteLength: number = TOKEN_BYTE_LENGTH): string {
    return randomToken(byteLength);
  }

  generateNumericCode(length: number = NUMERIC_CODE_LENGTH): string {
    return randomDigits(length);
  }

  hash(token: string): string {
    return createHash(TOKEN_HASH_ALGORITHM).update(token, 'utf8').digest('hex');
  }

  compare(plain: string, storedHash: string): boolean {
    return timingSafeCompare(this.hash(plain), storedHash);
  }
}
