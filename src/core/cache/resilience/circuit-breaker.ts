import { CACHE_CIRCUIT, CIRCUIT_STATE, type CircuitState } from '../constants/cache.constants.js';

export class CircuitBreaker {
  private current: CircuitState = CIRCUIT_STATE.CLOSED;

  private consecutiveFailures = 0;

  private openedAt = 0;

  private probeStartedAt = 0;

  constructor(
    private readonly failureThreshold: number = CACHE_CIRCUIT.FAILURE_THRESHOLD,

    private readonly openDurationMs: number = CACHE_CIRCUIT.OPEN_DURATION_MS,

    private readonly probeTimeoutMs: number = CACHE_CIRCUIT.PROBE_TIMEOUT_MS,
  ) {}

  shouldAllow(): boolean {
    if (this.current === CIRCUIT_STATE.CLOSED) {
      return true;
    }

    const now = Date.now();

    if (this.current === CIRCUIT_STATE.OPEN) {
      if (now - this.openedAt < this.openDurationMs) {
        return false;
      }

      this.current = CIRCUIT_STATE.HALF_OPEN;
      this.probeStartedAt = now;

      return true;
    }

    if (now - this.probeStartedAt >= this.probeTimeoutMs) {
      this.probeStartedAt = now;

      return true;
    }

    return false;
  }

  recordSuccess(): void {
    this.current = CIRCUIT_STATE.CLOSED;
    this.consecutiveFailures = 0;
  }

  recordFailure(): void {
    if (this.current === CIRCUIT_STATE.HALF_OPEN) {
      this.open();

      return;
    }

    this.consecutiveFailures += 1;

    if (this.consecutiveFailures >= this.failureThreshold) {
      this.open();
    }
  }

  get state(): CircuitState {
    return this.current;
  }

  private open(): void {
    this.current = CIRCUIT_STATE.OPEN;
    this.openedAt = Date.now();
    this.consecutiveFailures = 0;
  }
}
