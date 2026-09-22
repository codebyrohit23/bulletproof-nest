import { AsyncLocalStorage } from 'node:async_hooks';

import type { RequestContext } from '../interfaces/index.js';

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();
