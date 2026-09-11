export interface LogContext {
  readonly context: string;

  readonly operation?: string;

  readonly requestId?: string;
  readonly correlationId?: string;
  readonly traceId?: string;

  readonly userId?: string;
  readonly workspaceId?: string;
  readonly sessionId?: string;

  readonly statusCode?: number;

  readonly metadata?: Readonly<Record<string, unknown>>;
}
