export interface DispatchOptions {
  /**
   * Deduplication key.
   *
   * BullMQ refuses a job whose id already exists, so `welcome:${userId}` makes
   * "send the welcome email" un-double-sendable no matter how many times the
   * calling code runs.
   *
   * Note it only dedupes while the job is still known to Redis — once it
   * completes and is cleaned up, the same id can be added again. It prevents
   * duplicates in flight, not for all time.
   */
  readonly jobId?: string;

  /**
   * Milliseconds to wait before the job becomes available.
   */
  readonly delayMs?: number;

  /**
   * Overrides the queue's default. Raise it for work that is worth retrying
   * hard (an outbound webhook); lower it for work where a retry is pointless.
   */
  readonly attempts?: number;

  /**
   * Higher runs sooner. Use sparingly — a queue where everything is urgent is a
   * queue with no priorities.
   */
  readonly priority?: number;
}
