import type { IncomingMessage, ServerResponse } from 'node:http';
import { hostname } from 'node:os';

import { stdTimeFunctions } from 'pino';
import type { LevelWithSilent } from 'pino';
import type { Options } from 'pino-http';

import { type RequestContextService, resolveRequestId } from '#/core/context/index.js';

import type { LoggerConfig } from './interfaces/index.js';
import {
  LOG_LEVEL,
  LOGGER_CLIENT_ERROR_STATUS,
  LOGGER_SERVER_ERROR_STATUS,
  LOGGER_SILENT_LEVEL,
} from './logger.constants.js';
import { normalizeRequest, normalizeResponse } from './normalizers/index.js';
import { extractPath, isQuietRoute } from './utils/index.js';

/**
 * Builds the `pino-http` options.
 *
 * Everything here exists to hold one shape for every line this service emits:
 *
 *   {
 *     "level": "info",
 *     "time": "2026-08-15T17:37:22.070Z",
 *     "service": "leadflow-backend-service",
 *     "env": "development",
 *     "hostname": "…",
 *     "requestId": "01a0067f-…",
 *     "correlationId": "01a0067f-…",
 *     "userId": "…",
 *     "workspaceId": "…",
 *     "req": { "method": "POST", "path": "/api/v1/auth/register", "ip": "…", "userAgent": "…" },
 *     "res": { "statusCode": 201 },
 *     "durationMs": 14,
 *     "msg": "POST /api/v1/auth/register 201"
 *   }
 *
 * The correlation fields sit at the root because they are what a search is
 * keyed on; `req` and `res` nest because they are only read once a line has
 * already been found.
 *
 * `requestContext` is injected rather than imported so this stays a pure
 * function of its arguments — a test constructs one and asserts on the options
 * without a Nest container.
 */
export function createPinoHttpOptions(
  config: LoggerConfig,
  requestContext: RequestContextService,
): Options {
  return {
    level: config.level,

    redact: [...config.redact],

    /**
     * ISO 8601 rather than pino's default epoch milliseconds. Every backend
     * parses it, and a human reading the raw file does not need a converter.
     */
    timestamp: stdTimeFunctions.isoTime,

    formatters: {
      /**
       * `"level": "info"` rather than `"level": 30`. The number is a pino
       * implementation detail that means nothing in a search box, and every
       * consumer would otherwise need a mapping table to undo it.
       */
      level: (label: string) => ({ level: label }),
    },

    /**
     * Replaces pino's default `{ pid, hostname }`. A pid is meaningless in a
     * container that runs one process; the service and environment are what
     * make a shared log index usable, and `hostname` is the instance.
     */
    base: {
      service: config.serviceName,
      env: config.environment,
      hostname: hostname(),
    },

    /**
     * `err` is deliberately absent: pino's own error serializer is already
     * installed by `pino-http`, and it handles cause chains and aggregate
     * errors correctly. Overriding it would mean reimplementing both.
     */
    serializers: {
      req: normalizeRequest,
      res: normalizeResponse,
    },

    /**
     * Idempotent — the Fastify adapter's `genReqId` has already resolved the id
     * and stamped it onto the inbound headers, so this reads that value back
     * rather than minting a second one.
     */
    genReqId: resolveRequestId,

    customAttributeKeys: {
      /** The unit belongs in the name; `responseTime` leaves it to be guessed. */
      responseTime: 'durationMs',
    },

    customProps: (request: IncomingMessage) => buildCorrelationProps(requestContext, request),

    customLogLevel: resolveLogLevel,

    customSuccessMessage: (request: IncomingMessage, response: ServerResponse) =>
      describeRequest(request, response.statusCode),

    customErrorMessage: (request: IncomingMessage, response: ServerResponse) =>
      describeRequest(request, response.statusCode),

    autoLogging: true,

    ...(config.pretty ? { transport: PRETTY_TRANSPORT } : {}),
  };
}

/**
 * The identifiers every line is searched by, lifted out of the ambient request
 * context that `RequestContextMiddleware` established.
 *
 * `ContextModule` is imported before `AppLoggerModule` in `AppModule`, and Nest
 * applies middleware in import order, so the context is always open by the time
 * this runs. The header fallback covers the one case it is not: a request that
 * bypassed the middleware entirely.
 */
function buildCorrelationProps(
  requestContext: RequestContextService,
  request: IncomingMessage,
): object {
  const context = requestContext.get();

  const requestId = context?.requestId ?? resolveRequestId(request);

  /*
   * `correlationId` is emitted even when it equals `requestId`, which it does
   * for any request that originates here. Omitting it as a duplicate would
   * make "every log line for this user action" a query that silently misses
   * the action's first hop.
   */
  return {
    requestId,
    correlationId: context?.correlationId ?? requestId,

    ...(context?.userId !== undefined ? { userId: context.userId } : {}),
    ...(context?.workspaceId !== undefined ? { workspaceId: context.workspaceId } : {}),
    ...(context?.clientId !== undefined ? { clientId: context.clientId } : {}),
  };
}

/**
 * The level is chosen by who is at fault, not by whether an exception was
 * thrown.
 *
 * A 4xx is this service correctly telling a client it got the request wrong —
 * expected traffic, and the single most common reason an `error` level becomes
 * useless to alert on. A 5xx is this service failing, and is the only thing
 * here that should ever page someone.
 */
function resolveLogLevel(
  request: IncomingMessage,
  response: ServerResponse,
  error?: Error,
): LevelWithSilent {
  if (error !== undefined || response.statusCode >= LOGGER_SERVER_ERROR_STATUS) {
    return LOG_LEVEL.ERROR;
  }

  if (response.statusCode >= LOGGER_CLIENT_ERROR_STATUS) {
    return LOG_LEVEL.WARN;
  }

  /*
   * Only successful probes are dropped. A failing liveness check has already
   * been classified above and still reaches the log.
   */
  if (isQuietRoute(request.url)) {
    return LOGGER_SILENT_LEVEL;
  }

  return LOG_LEVEL.INFO;
}

/**
 * Replaces pino-http's `"request completed"`, which is the same eight
 * characters on every line and says nothing. Tailing a log is reading `msg`.
 */
function describeRequest(request: IncomingMessage, statusCode: number): string {
  return `${request.method ?? 'UNKNOWN'} ${extractPath(request.url)} ${statusCode}`;
}

/**
 * Local development only. `service`, `env` and `hostname` are constant on one
 * machine, and `req`/`res` are already spelled out in `msg`, so the terminal
 * shows the message, the ids and the duration.
 *
 * A single `target` is used rather than `targets`: pino rejects a custom level
 * formatter alongside a multi-target transport.
 */
const PRETTY_TRANSPORT = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:HH:MM:ss.l',
    singleLine: true,
    ignore: 'pid,hostname,service,env,req,res,correlationId',
  },
} as const;
