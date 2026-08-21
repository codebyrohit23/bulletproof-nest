/**
 * The only parts of an inbound request that belong in a log line.
 *
 * Deliberately absent: headers, cookies, query string, body, and the remote
 * port. None of them has ever been the answer to a production question, and
 * between them they were roughly three quarters of every line this service
 * wrote.
 *
 * The request id is absent too — it is emitted once at the top level of the
 * line instead of nested here, so that one search term matches the access log,
 * the application logs, and the error log alike.
 */
export interface RequestPayload {
  method: string;

  /**
   * The URL with its query string removed.
   *
   * Query values routinely carry invite tokens, password-reset tokens and
   * e-mail addresses, and no redact path can cover them because they are
   * positional rather than named.
   */
  path: string;

  ip?: string;

  userAgent?: string;
}
