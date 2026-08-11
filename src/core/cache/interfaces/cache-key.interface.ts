/**
 * Describes a key without knowing how it is assembled.
 *
 * Modules supply this; `cache-key.util.ts` turns it into a string. Keeping
 * assembly in one place is what allows the layout — scope position, version
 * placement, separator, future hash tags — to change without touching a single
 * module.
 */
export interface CacheKeyDescriptor {
  /**
   * The entity family: `lead`, `user`, `workspace`.
   */
  readonly resource: string;

  /**
   * Schema version for this resource, owned by the module that owns the
   * resource.
   *
   * Bump it whenever the cached shape changes. Without it, entries written by
   * the previous release deserialize into the new type for the whole TTL —
   * fields silently `undefined`, no error, and it fixes itself before anyone
   * can reproduce it.
   *
   * Per resource, never global: one shared counter would mean changing the
   * `Lead` DTO also evicts users, workspaces and sessions.
   */
  readonly version: number;

  /**
   * Identifier and optional view: `[leadId]`, `[leadId, 'detail']`,
   * `['list', 'page', '2']`.
   */
  readonly segments: readonly (string | number)[];
}
