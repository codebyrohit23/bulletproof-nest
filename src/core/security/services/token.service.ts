import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { NUMERIC_CODE_LENGTH, TOKEN_BYTE_LENGTH, TOKEN_HASH_ALGORITHM } from '../constants/security.constants.js';
import { timingSafeCompare } from '../utils/constant-time.util.js';
import { randomDigits, randomToken } from '../utils/random.util.js';

/**
 * Opaque secrets — refresh tokens, verification codes, password-reset links,
 * invitations, API keys.
 *
 * "Opaque" means the value carries no information: it is verified by looking it
 * up, not by decoding it. That is what makes it revocable — deleting the row
 * kills the token instantly, where a signed JWT stays valid until it expires.
 *
 * ---------------------------------------------------------------------------
 * THE RULE
 * ---------------------------------------------------------------------------
 * **Store the hash, never the token.** The plaintext is returned once, handed
 * to the user, and never persisted. A database leak then yields nothing usable
 * — the same reason passwords are hashed.
 *
 * This service knows nothing about expiry, attempt limits, or what a code is
 * *for*. Those rules belong to the feature that issues it.
 */
@Injectable()
export class TokenService {
  /**
   * A high-entropy, URL-safe token.
   *
   * At the default 32 bytes this is 256 bits — unguessable, so flows using it
   * need no attempt limiting.
   */
  generate(byteLength: number = TOKEN_BYTE_LENGTH): string {
    return randomToken(byteLength);
  }

  /**
   * A short numeric code for a human to type from an email or SMS.
   *
   * Six digits is only a million combinations, so **every flow using this must
   * enforce an attempt limit** — `VerificationCode.attempts` exists for exactly
   * that. Without one it is brute-forceable in seconds.
   */
  generateNumericCode(length: number = NUMERIC_CODE_LENGTH): string {
    return randomDigits(length);
  }

  /**
   * Hashes a token for storage and for lookup.
   *
   * Deterministic by design: rows are found with `WHERE tokenHash = ?`, which a
   * salted hash could never satisfy. Safe here because the input already has
   * 256 bits of entropy — there is no dictionary to run against it, so the slow
   * salted hashing a password needs would buy nothing.
   */
  hash(token: string): string {
    return createHash(TOKEN_HASH_ALGORITHM).update(token, 'utf8').digest('hex');
  }

  /**
   * Checks a plaintext token against a stored hash, in constant time.
   *
   * Used when the row was fetched by something other than the hash — a
   * verification code found by identifier and purpose, for example. When the
   * lookup is *by* hash, the database has already done the comparison and this
   * is unnecessary.
   */
  compare(plain: string, storedHash: string): boolean {
    return timingSafeCompare(this.hash(plain), storedHash);
  }
}
