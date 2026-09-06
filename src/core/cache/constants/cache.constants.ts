import { REDIS_DOMAIN } from '#/infrastructure/redis/index.js';

export const CACHE_TTL = {
  TEN_SECONDS: 10,
  THIRTY_SECONDS: 30,
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  ONE_HOUR: 3_600,
  ONE_DAY: 86_400,
} as const;

export const CACHE_NEGATIVE_TTL_SECONDS = CACHE_TTL.TEN_SECONDS;

export const CACHE_TTL_JITTER_RATIO = 0.1;

export const CACHE_ENVELOPE_VERSION = 1;

export const CACHE_DOMAIN = REDIS_DOMAIN.CACHE;

export const CACHE_SCOPE = {
  TENANT: 'ws',
  GLOBAL: 'global',
} as const;

export const CACHE_VERSION_PREFIX = 'v';

export const CACHE_CIRCUIT = {
  FAILURE_THRESHOLD: 5,

  OPEN_DURATION_MS: 10_000,

  PROBE_TIMEOUT_MS: 5_000,
} as const;

export const CIRCUIT_STATE = {
  CLOSED: 'CLOSED',

  OPEN: 'OPEN',

  HALF_OPEN: 'HALF_OPEN',
} as const;

export type CircuitState = (typeof CIRCUIT_STATE)[keyof typeof CIRCUIT_STATE];

export const CACHE_LOG_CONTEXT = 'CacheService';

export const CACHE_LOCK = {
  TTL_SECONDS: 30,
  WAIT_MS: 50,
  MAX_WAITS: 20,
} as const;
