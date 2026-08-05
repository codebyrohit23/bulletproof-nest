/**
 * What a module implements to process one kind of job.
 *
 * Deliberately free of BullMQ types. A handler that takes a plain payload can
 * be unit-tested with an object literal and read by someone who has never
 * touched BullMQ — and if the transport ever changes, the business logic does
 * not.
 */
export interface JobHandler<TPayload> {
  handle(payload: TPayload, meta: JobMeta): Promise<void>;
}

export interface JobMeta {
  readonly jobId: string;

  readonly jobName: string;

  readonly queue: string;

  /**
   * 1-based. Compare against `maxAttempts` to detect the final try — useful for
   * a handler that wants to record a permanent failure itself.
   */
  readonly attempt: number;

  readonly maxAttempts: number;

  readonly dispatchedAt: string;
}
