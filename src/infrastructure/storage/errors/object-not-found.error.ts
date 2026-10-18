import type { StorageBucket } from '../constants/index.js';

/**
 * The object is not in storage. Distinct from a storage failure: the caller
 * usually answers it with a 4xx (the client never uploaded) rather than a 5xx.
 */
export class ObjectNotFoundError extends Error {
  constructor(
    readonly bucket: StorageBucket,
    readonly key: string,
    options?: ErrorOptions,
  ) {
    super(`No object at ${key} in the ${bucket} bucket.`, options);

    this.name = new.target.name;
  }
}
