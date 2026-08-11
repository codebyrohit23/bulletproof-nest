import { Injectable, type OnModuleInit } from '@nestjs/common';
import { hash, needsRehash, verify } from 'argon2';

import { DUMMY_PASSWORD, PASSWORD_HASH_OPTIONS, PASSWORD_MAX_LENGTH } from '../constants/security.constants.js';

@Injectable()
export class PasswordService implements OnModuleInit {
  private dummyHash = '';

  async onModuleInit(): Promise<void> {
    this.dummyHash = await hash(DUMMY_PASSWORD, PASSWORD_HASH_OPTIONS);
  }

  async hash(password: string): Promise<string> {
    this.assertLength(password);

    return hash(password, PASSWORD_HASH_OPTIONS);
  }

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
