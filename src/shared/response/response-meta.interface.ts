/**
 * Metadata about the **response**, not about the data.
 *
 * Identical on success and error responses — a client reads `meta.requestId`
 * the same way regardless of outcome, which is what makes it useful for
 * support and tracing.
 *
 * Pagination deliberately does not live here. Pagination describes the data, so
 * it travels inside `data` next to the items it belongs to. Putting the two in
 * one bag would mean `meta` sometimes means "about the response" and sometimes
 * "about the list", and every consumer would have to know which.
 *
 * `core/exceptions` imports this type so both envelopes cannot drift apart.
 */
export interface ResponseMeta {
  readonly timestamp: string;

  readonly path: string;

  /**
   * Present whenever a request context exists. The value a customer quotes in
   * a support ticket, and the one that ties this response to its log lines.
   */
  readonly requestId?: string;
}
