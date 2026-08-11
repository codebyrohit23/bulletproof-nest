/**
 * Marks an administrative route.
 *
 * The document split turns on this string, so it must match the path segment
 * admin controllers are mounted under. Getting it wrong does not fail loudly —
 * it silently publishes admin endpoints in the public reference — which is why
 * it lives here rather than being written out at the point of use.
 */
export const ADMIN_PATH_SEGMENT = '/admin/';

/**
 * Where each reference and its raw specification are served.
 *
 * The JSON endpoints matter as much as the rendered pages: pointed at
 * `openapi-typescript` or `orval`, they generate fully typed clients from the
 * same Zod schemas that validate the requests, so a client cannot be written
 * against a shape the server would reject.
 */
export const DOCS_PATH = {
  USER: '/docs',

  USER_SPEC: '/docs/json',

  ADMIN: '/docs/admin',

  ADMIN_SPEC: '/docs/admin/json',
} as const;

/**
 * Named bearer schemes, referenced by `@ApiBearerAuth(...)` on controllers.
 *
 * These match the `aud` claim boundary enforced in `core/jwt`: a token minted
 * for `leadflow:user` is rejected on an admin route, so documenting them as one
 * credential would describe an API that does not exist.
 */
export const SECURITY_SCHEME = {
  USER: 'user-access-token',

  ADMIN: 'admin-access-token',
} as const;

export const DOCUMENTATION_LOG_CONTEXT = 'Documentation';
