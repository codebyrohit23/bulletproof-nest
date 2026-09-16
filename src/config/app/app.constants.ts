export const ENVIRONMENTS = {
  LOCAL: 'local',
  DEVELOPMENT: 'development',
  TEST: 'test',
  PRODUCTION: 'production',
} as const;

export type Environment = (typeof ENVIRONMENTS)[keyof typeof ENVIRONMENTS];

export const BODY_LIMIT_BYTES = 1_048_576;
