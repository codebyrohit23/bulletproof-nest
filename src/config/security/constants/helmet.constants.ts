import type { FastifyHelmetOptions } from '@fastify/helmet';

export const HELMET_OPTIONS: FastifyHelmetOptions = {
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  originAgentCluster: true,
  referrerPolicy: {
    policy: 'no-referrer',
  },
};
