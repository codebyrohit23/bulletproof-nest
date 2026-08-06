import { argon2id } from 'argon2';

export const PASSWORD_HASH_OPTIONS = {
  type: argon2id,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 1,
} as const;

export const PASSWORD_MAX_LENGTH = 128;

export const TOKEN_BYTE_LENGTH = 32;

export const NUMERIC_CODE_LENGTH = 6;

export const TOKEN_HASH_ALGORITHM = 'sha256';

export const DUMMY_PASSWORD = 'leadflow-enumeration-resistance-placeholder';

export const SECURITY_LOG_CONTEXT = 'Security';
