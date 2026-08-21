import type { SecuritySchemeObject } from '../documentation.types.js';

/**
 * The bearer scheme, shared by every audience.
 *
 * The *shape* of the credential is identical everywhere — an `Authorization:
 * Bearer <jwt>` header — so it is described once. What differs per audience is
 * the scheme's *name*, which is what makes the admin reference ask for an admin
 * token rather than reusing whatever the public reference was given.
 *
 * `bearerFormat: 'JWT'` is documentation, not enforcement: it tells a reader
 * what to expect and has no effect on verification, which happens in
 * `core/jwt` against a pinned algorithm and audience.
 */
export const BEARER_SECURITY_SCHEME: SecuritySchemeObject = {
  type: 'http',

  scheme: 'bearer',

  bearerFormat: 'JWT',

  description:
    'Access token issued by the authentication endpoints. Expires 15 minutes after it is issued.',
};
