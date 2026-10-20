import type { FileRejectReason } from '@prisma/client';

export class FileRejectedError extends Error {
  readonly retryable = false;

  constructor(
    readonly reason: FileRejectReason,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);

    this.name = new.target.name;
  }
}
