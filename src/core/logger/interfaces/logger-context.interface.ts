export interface LogContext {
  /**
   * Logical source of the log.
   * Examples:
   * GlobalExceptionFilter
   * AuthService
   * LeadProcessor
   * ChatGateway
   */
  readonly context: string;

  /**
   * Operation inside the context.
   * Examples:
   * createUser
   * process
   * catch
   * handleConnection
   */
  readonly operation?: string;

  readonly requestId?: string;
  readonly correlationId?: string;
  readonly traceId?: string;

  readonly userId?: string;
  readonly organizationId?: string;
  readonly sessionId?: string;

  readonly statusCode?: number;

  /**
   * Transport-specific information.
   */
  readonly metadata?: Readonly<Record<string, unknown>>;
}
