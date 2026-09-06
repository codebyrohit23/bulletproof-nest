import { Readable } from 'node:stream';

import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { ACCEPT_CH_HEADER, ACCEPT_CH_VALUE } from '#/core/context/index.js';

export function configureHooks(app: NestFastifyApplication): void {
  const fastify = app.getHttpAdapter().getInstance();

  /*
   * Opts this origin in to the two high-entropy Client Hints.
   *
   * On every response rather than only on the authentication routes, because
   * the hint arrives on the request *after* the one that asked for it: setting
   * it on `/auth/login` alone would mean the header is only ever present on a
   * second login, which is the one case where we already know the device.
   *
   * `onRequest` rather than `onSend` so the header survives responses Fastify
   * produces before routing — 404s and payload-too-large among them — which are
   * exactly the incidental calls most likely to precede a login.
   */
  fastify.addHook('onRequest', async (_request: FastifyRequest, reply: FastifyReply) => {
    void reply.header(ACCEPT_CH_HEADER, ACCEPT_CH_VALUE);
  });

  fastify.addHook(
    'preParsing',
    async (request: FastifyRequest, _reply: FastifyReply, payload: NodeJS.ReadableStream) => {
      const chunks: Buffer[] = [];

      for await (const chunk of payload) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      request.rawBody = Buffer.concat(chunks);

      const clone = new Readable();

      clone.push(request.rawBody);
      clone.push(null);

      return clone;
    },
  );
}
