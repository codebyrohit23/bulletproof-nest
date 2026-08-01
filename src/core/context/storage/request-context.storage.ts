import { AsyncLocalStorage } from 'node:async_hooks';

import type { RequestContext } from '../interfaces/index.js';

/**
 * The single AsyncLocalStorage instance for request identity.
 *
 * Module-level rather than a field on the service because parameter decorators
 * (`@CurrentUser()`, `@CurrentOrganization()`) run outside dependency
 * injection and cannot resolve a provider. Both the service and the decorators
 * read this same instance, so there is exactly one store.
 *
 * Deliberately separate from the transaction store in the Prisma module:
 * transaction scope, request scope and job scope have different lifetimes, and
 * a background job has a transaction with no request at all.
 */
export const requestContextStorage = new AsyncLocalStorage<RequestContext>();
