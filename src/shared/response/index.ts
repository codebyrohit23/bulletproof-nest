/**
 * Response contract types shared by both halves of the API envelope.
 *
 * `SuccessResponse` (core/interceptors) and `ErrorResponse` (core/exceptions)
 * both embed `ResponseMeta`. It lives here rather than in either module so
 * neither has to import the other — an exception filter should not depend on
 * the interceptor module, and vice versa.
 *
 * Types only. No behaviour, no DI, no framework imports.
 */

export type { ResponseMeta } from './response-meta.interface.js';
