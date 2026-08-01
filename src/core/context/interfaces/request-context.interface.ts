/**
 * Everything ambient about the current unit of work.
 *
 * Two groups of fields, populated at different times:
 *
 * - **Transport fields** (`requestId` … `clientId`) are set once by the
 *   middleware, before guards run, and never change.
 * - **Identity fields** (`userId`, `organizationId`, `sessionId`) are unknown
 *   until authentication has run, so they are filled in later by the auth
 *   guard via `RequestContextService.set()`.
 *
 * Nothing here is HTTP-only. A BullMQ processor or a cron task creates the
 * same shape with a generated `requestId` and no `ip`.
 */
export interface RequestContext {
  /** Unique per request. Echoed in every response and every log line. */
  requestId: string;

  /** Survives across service hops. Falls back to `requestId` when absent. */
  correlationId: string;

  locale: string;

  ip?: string;

  userAgent?: string;

  timezone?: string;

  /** Identifies the calling application — web, mobile, a partner integration. */
  clientId?: string;

  /** Set by the auth guard once the caller is known. */
  userId?: string;

  /**
   * The active tenant. Every tenant-scoped query is filtered by this, so it
   * must never be inferred from a request body — only from a verified session.
   */
  organizationId?: string;

  sessionId?: string;
}

/**
 * Fields the auth layer is allowed to add after the context already exists.
 * Transport fields are deliberately excluded — they are immutable once set.
 */
export type RequestIdentityPatch = Pick<RequestContext, 'userId' | 'organizationId' | 'sessionId'>;
