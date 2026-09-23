import { z } from 'zod';

import { VERIFICATION_CODE_LENGTH, VERIFICATION_CODE_PATTERN } from '../constants/index.js';

/**
 * One message for every flow. The screen already says which code it is asking
 * for; per-DTO wording is how a password-reset form came to answer "Login code
 * must be 6 digits".
 */
export const verificationCodeSchema = z
  .string()
  .trim()
  .regex(VERIFICATION_CODE_PATTERN, `Code must be ${VERIFICATION_CODE_LENGTH} digits`);
