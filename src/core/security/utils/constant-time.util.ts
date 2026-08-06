import { createHash, timingSafeEqual } from 'node:crypto';

import { TOKEN_HASH_ALGORITHM } from '../constants/security.constants.js';

export function timingSafeCompare(left: string, right: string): boolean {
  const leftDigest = createHash(TOKEN_HASH_ALGORITHM).update(left, 'utf8').digest();
  const rightDigest = createHash(TOKEN_HASH_ALGORITHM).update(right, 'utf8').digest();

  return timingSafeEqual(leftDigest, rightDigest);
}
