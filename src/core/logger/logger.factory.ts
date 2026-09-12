import type { IncomingMessage, ServerResponse } from 'node:http';
import { hostname } from 'node:os';

import { stdTimeFunctions } from 'pino';
import type { LevelWithSilent } from 'pino';
import type { Options } from 'pino-http';

import { type RequestContextService, resolveRequestId } from '#/core/context/index.js';
import { LOG_LEVEL } from '#/shared/constants/index.js';

import {
  LOGGER_CLIENT_ERROR_STATUS,
  LOGGER_SERVER_ERROR_STATUS,
  LOGGER_SILENT_LEVEL,
} from './constants/index.js';
import type { LoggerConfig } from './interfaces/index.js';
import { normalizeRequest, normalizeResponse } from './normalizers/index.js';
import { extractPath, isQuietRoute } from './utils/index.js';

export function createPinoHttpOptions(
  config: LoggerConfig,
  requestContext: RequestContextService,
): Options {
  return {
    level: config.level,

    redact: [...config.redact],

    timestamp: stdTimeFunctions.isoTime,

    formatters: {
      level: (label: string) => ({ level: label }),
    },

    base: {
      service: config.serviceName,
      env: config.environment,
      hostname: hostname(),
    },

    serializers: {
      req: normalizeRequest,
      res: normalizeResponse,
    },

    genReqId: resolveRequestId,

    customAttributeKeys: {
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

function buildCorrelationProps(
  requestContext: RequestContextService,
  request: IncomingMessage,
): object {
  const context = requestContext.get();

  const requestId = context?.requestId ?? resolveRequestId(request);

  return {
    requestId,
    correlationId: context?.correlationId ?? requestId,

    ...(context?.userId !== undefined ? { userId: context.userId } : {}),
    ...(context?.workspaceId !== undefined ? { workspaceId: context.workspaceId } : {}),
  };
}

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

  if (isQuietRoute(request.url)) {
    return LOGGER_SILENT_LEVEL;
  }

  return LOG_LEVEL.INFO;
}

function describeRequest(request: IncomingMessage, statusCode: number): string {
  return `${request.method ?? 'UNKNOWN'} ${extractPath(request.url)} ${statusCode}`;
}

const PRETTY_TRANSPORT = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:HH:MM:ss.l',
    singleLine: true,
    ignore: 'pid,hostname,service,env,req,res,correlationId',
  },
} as const;
