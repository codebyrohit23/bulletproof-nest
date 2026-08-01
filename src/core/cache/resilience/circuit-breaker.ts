import { CACHE_CIRCUIT } from '../constants/cache.constants.js';

/**
 * Stops calling a store that is failing.
 *
 * Without it, every request pays the full command timeout and its retries while
 * Redis is down — twelve seconds each, on an operation whose entire purpose is
 * to be faster than the database. After a few consecutive failures the circuit
 * opens and calls return immediately; one probe is allowed through after the
 * cooldown to find out whether it has recovered.
 *
 * Deliberately not an `@Injectable()`: it is a plain object with no
 * dependencies, so it stays unit-testable without a Nest container.
 */
export class CircuitBreaker {
  private consecutiveFailures = 0;

  private openedAt: number | null = null;

  constructor(
    private readonly failureThreshold: number = CACHE_CIRCUIT.FAILURE_THRESHOLD,

    private readonly openDurationMs: number = CACHE_CIRCUIT.OPEN_DURATION_MS,
  ) {}

  /**
   * Whether calls should be skipped right now.
   *
   * Closes the circuit itself once the cooldown has elapsed, so the next call
   * becomes the probe. That keeps recovery automatic rather than depending on
   * some other component noticing.
   */
  get isOpen(): boolean {
    if (this.openedAt === null) {
      return false;
    }

    if (Date.now() - this.openedAt >= this.openDurationMs) {
      this.reset();

      return false;
    }

    return true;
  }

  recordSuccess(): void {
    this.reset();
  }

  recordFailure(): void {
    this.consecutiveFailures += 1;

    if (this.consecutiveFailures >= this.failureThreshold && this.openedAt === null) {
      this.openedAt = Date.now();
    }
  }

  private reset(): void {
    this.consecutiveFailures = 0;
    this.openedAt = null;
  }
}
