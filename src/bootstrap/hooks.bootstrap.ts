import { Readable } from 'node:stream';

import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';

export function configureHooks(app: NestFastifyApplication): void {
  const fastify = app.getHttpAdapter().getInstance();

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
