import { z } from 'zod';

import { EMAIL_MAX_LENGTH } from '../constants/index.js';
import { isDisposableEmail } from '../utils/index.js';

export const lookupEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(EMAIL_MAX_LENGTH, `Email must be at most ${EMAIL_MAX_LENGTH} characters`)
  .pipe(z.email('Enter a valid email address'));

export const emailSchema = lookupEmailSchema.refine((email) => !isDisposableEmail(email), {
  message: 'Disposable or temporary email addresses are not allowed',
});
