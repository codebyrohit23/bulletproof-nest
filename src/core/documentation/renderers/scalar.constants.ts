/**
 * Where Scalar's browser bundle is loaded from.
 *
 * The upstream default, and a deliberate choice rather than an oversight. The
 * alternative is self-hosting: add `@scalar/api-reference` (11 MB unpacked),
 * serve its standalone build from this origin, and point this constant at it.
 *
 * The case for the CDN here is narrow and specific — documentation is mounted
 * only outside production, so no deployed environment ever fetches this, and
 * the exposure is a developer's browser loading a pinned tool. The case for
 * self-hosting is offline development and removing a third-party origin
 * entirely; if either becomes important, this constant is the only thing that
 * changes.
 */
export const SCALAR_CDN = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference';

/**
 * Content Security Policy for the documentation pages alone.
 *
 * Deliberately more permissive than the application default, and deliberately
 * scoped so that permissiveness cannot escape:
 *
 * - `script-src` allows the CDN above and `'unsafe-inline'`, because the page
 *   carries its configuration in an inline script.
 * - `style-src` allows `'unsafe-inline'` because the reference renders inline
 *   `style` attributes, which no nonce can authorise.
 * - `connect-src 'self'` confines the page's "try it" requests to this origin,
 *   so the reference cannot be induced to send a pasted token elsewhere.
 *
 * Scalar does support CSP nonces, which would remove the need for
 * `'unsafe-inline'` on scripts. That is worth doing the day these pages are
 * served in a deployed environment; for a route that exists only in
 * development, per-request nonce plumbing buys nothing.
 */
export const SCALAR_CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${SCALAR_CDN}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
].join('; ');

/**
 * Scalar ships several themes; `deepSpace` is its dark default and the one that
 * matches the custom palette the Nest integration injects.
 */
export const SCALAR_THEME = 'deepSpace';
