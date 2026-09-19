export interface DispatchOptions {
  readonly jobId?: string;

  readonly delayMs?: number;

  readonly attempts?: number;

  readonly priority?: number;

  readonly expiresAt?: Date;
}
