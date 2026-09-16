import { z } from 'zod';

import { EMAIL_MAX_LENGTH } from '../constants/index.js';
import { isDisposableEmail } from '../utils/index.js';

export const emailSchema = z
  .email()
  .max(EMAIL_MAX_LENGTH)
  .transform((email) => email.trim().toLowerCase())
  .refine((email) => !isDisposableEmail(email), {
    message: 'Disposable or temporary email addresses are not allowed',
  });
