export const JWT_ALGORITHM = 'EdDSA';

export const JWT_CLOCK_TOLERANCE_SECONDS = 5;

export const JWT_AUDIENCE = 'leadflow:api';

export const JWT_TOKEN_TYPE = {
  ACCESS: 'access',
} as const;

export const TOKEN_TTL_SECONDS = {
  ACCESS: 15 * 60,
} as const;

export const JWT_LOG_CONTEXT = 'Jwt';
