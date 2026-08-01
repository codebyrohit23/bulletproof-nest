export interface SuccessResponseBuilderOptions<T> {
  readonly data: T;

  readonly statusCode: number;

  readonly path: string;

  /** Falls back to a status-derived default when omitted. */
  readonly message?: string;

  readonly requestId?: string;
}
