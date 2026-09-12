/**
 * The logging vocabulary, shared because two layers must agree on it.
 *
 * `config/app` validates `LOG_LEVEL` and `LOG_FORMAT` from the environment;
 * `core/logger` acts on the values that survive. Neither can own the list — if
 * the schema accepted a level the logger did not understand, or the reverse,
 * the disagreement would surface as a boot failure or a silently ignored
 * setting.
 *
 * It lives here rather than in `core/logger` because `config/` may import from
 * `shared/` and nothing else: it is evaluated during bootstrap, and every reach
 * into `core/` is a chance to close a startup cycle. See the note in
 * `headers.constants.ts`.
 *
 * These are pino's levels. Adding one means pino understands it.
 */
export const LOG_LEVEL = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
} as const;

export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

/**
 * `json` is one object per line for a log aggregator. `pretty` is colourised
 * output for a human terminal and costs real throughput, so it is opt-in.
 *
 * Deliberately not derived from `NODE_ENV`: tailing a staging or production pod
 * during an incident is exactly when readable output is worth most.
 */
export const LOG_FORMAT = {
  JSON: 'json',
  PRETTY: 'pretty',
} as const;

export type LogFormat = (typeof LOG_FORMAT)[keyof typeof LOG_FORMAT];
