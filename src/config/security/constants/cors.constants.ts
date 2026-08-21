import type { FastifyCorsOptions } from '@fastify/cors';

export const DEFAULT_CORS_OPTIONS: Pick<
  FastifyCorsOptions,
  'methods' | 'allowedHeaders' | 'exposedHeaders'
> = {
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

  allowedHeaders: ['Content-Type', 'Authorization'],

  exposedHeaders: ['Content-Disposition'],
};
