import { z } from 'zod';

import { PASSWORD_MAX_LENGTH } from '#/core/security/index.js';

import {
  PASSWORD_LOWERCASE_PATTERN,
  PASSWORD_MIN_LENGTH,
  PASSWORD_SPECIAL_PATTERN,
  PASSWORD_UPPERCASE_PATTERN,
} from '../constants/index.js';

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
  .regex(PASSWORD_LOWERCASE_PATTERN, 'Password must contain at least one lowercase letter')
  .regex(PASSWORD_UPPERCASE_PATTERN, 'Password must contain at least one uppercase letter')
  .regex(PASSWORD_SPECIAL_PATTERN, 'Password must contain at least one special character');

export const passwordCredentialSchema = z
  .string()
  .min(1, 'Password is required')
  .max(PASSWORD_MAX_LENGTH);
