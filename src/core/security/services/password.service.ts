import { Injectable, type OnModuleInit } from '@nestjs/common';
import { hash, needsRehash, verify } from 'argon2';

import { DUMMY_PASSWORD, PASSWORD_HASH_OPTIONS, PASSWORD_MAX_LENGTH } from '../constants/security.constants.js';

/**
 * Password hashing — one-way, deliberately slow, salted per password.
 *
 * Never used for tokens. A token is looked up *by* its hash, which requires a
 * deterministic result; argon2 salts every call, so the same token would hash
 * differently every time and could never be found. See `TokenService`.
 */
@Injectable()
export class PasswordService implements OnModuleInit {
  /**
   * A real hash produced with the current parameters, used to burn the same
   * amount of time when there is no password to check against.
   *
   * Generated at boot rather than hardcoded so it always matches
   * `PASSWORD_HASH_OPTIONS` — a stale constant from older parameters would
   * verify at a different speed and reintroduce the timing difference it exists
   * to remove.
   */
  private dummyHash = '';

  async onModuleInit(): Promise<void> {
    this.dummyHash = await hash(DUMMY_PASSWORD, PASSWORD_HASH_OPTIONS);
  }

  /**
   * Hashes a password for storage.
   *
   * The salt is generated per call and embedded in the returned string, so two
   * users with the same password get different hashes and one cracked password
   * reveals nothing about the others.
   */
  async hash(password: string): Promise<string> {
    this.assertLength(password);

    return hash(password, PASSWORD_HASH_OPTIONS);
  }

  /**
   * Checks a password against a stored hash.
   *
   * **Pass `null` when the identifier has no credential** — an unknown email, a
   * user who signed up through OAuth, a deleted account. The method then
   * verifies against a dummy hash and returns `false`, so the response takes
   * the same ~100 ms either way.
   *
   * Skipping the hash in that case is the classic user-enumeration leak: an
   * attacker submits a login for an address and learns from a 5 ms response
   * that it is not registered, versus 100 ms for one that is. Making the null
   * case an explicit parameter puts that defence in the type signature rather
   * than relying on every call site to remember it.
   *
   * Returns `false` rather than throwing on a malformed stored hash — a
   * corrupted row is a failed login, not a 500.
   */
  async verify(storedHash: string | null, password: string): Promise<boolean> {
    if (password.length > PASSWORD_MAX_LENGTH) {
      return false;
    }

    if (storedHash === null) {
      await this.burnTime(password);

      return false;
    }

    try {
      return await verify(storedHash, password);
    } catch {
      return false;
    }
  }

  /**
   * Whether a stored hash was produced with weaker parameters than the current
   * ones.
   *
   * Call it after a **successful** login — that is the only moment the plaintext
   * is available to rehash with. This is what lets you raise the cost over time
   * and have every active user migrate silently.
   */
  needsRehash(storedHash: string): boolean {
    return needsRehash(storedHash, PASSWORD_HASH_OPTIONS);
  }

  private async burnTime(password: string): Promise<void> {
    try {
      await verify(this.dummyHash, password);
    } catch {
      /* The result is irrelevant; only the elapsed time matters. */
    }
  }

  /**
   * Argon2 has no input limit and its cost scales with input size, so an
   * unbounded password is a cheap way to tie up a worker.
   *
   * A backstop, not the primary guard — request validation should reject this
   * long before it reaches the service.
   */
  private assertLength(password: string): void {
    if (password.length > PASSWORD_MAX_LENGTH) {
      throw new Error(`Password exceeds the maximum length of ${PASSWORD_MAX_LENGTH} characters.`);
    }
  }
}
