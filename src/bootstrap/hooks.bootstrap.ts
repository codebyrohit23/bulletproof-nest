import { Readable } from 'node:stream';

import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { ACCEPT_CH_HEADER, ACCEPT_CH_VALUE } from '#/core/context/index.js';

const RAW_BODY_PATH_PREFIXES = ['/webhooks/'];

const RAW_BODY_MAX_BYTES = 256 * 1024;

const PAYLOAD_TOO_LARGE_STATUS = 413;

export function configureHooks(app: NestFastifyApplication): void {
  const fastify = app.getHttpAdapter().getInstance();

  fastify.addHook('onRequest', async (_request: FastifyRequest, reply: FastifyReply) => {
    void reply.header(ACCEPT_CH_HEADER, ACCEPT_CH_VALUE);
  });

  fastify.addHook(
    'preParsing',
    async (request: FastifyRequest, _reply: FastifyReply, payload: NodeJS.ReadableStream) =>
      needsRawBody(request.url) ? captureRawBody(request, payload) : payload,
  );
}

function needsRawBody(url: string | undefined): boolean {
  if (url === undefined) {
    return false;
  }

  const path = url.split('?')[0] ?? '';

  return RAW_BODY_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

async function captureRawBody(
  request: FastifyRequest,
  payload: NodeJS.ReadableStream,
): Promise<Readable> {
  const chunks: Buffer[] = [];
  let bytes = 0;

  for await (const chunk of payload) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

    bytes += buffer.length;

    if (bytes > RAW_BODY_MAX_BYTES) {
      throw payloadTooLargeError();
    }

    chunks.push(buffer);
  }

  request.rawBody = Buffer.concat(chunks);

  const replayed = new Readable();

  replayed.push(request.rawBody);
  replayed.push(null);

  return replayed;
}

function payloadTooLargeError(): Error {
  return Object.assign(new Error(`Request body exceeded ${RAW_BODY_MAX_BYTES} bytes.`), {
    statusCode: PAYLOAD_TOO_LARGE_STATUS,
  });
}
