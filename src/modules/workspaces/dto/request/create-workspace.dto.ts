import { WorkspaceBusinessType } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { countryCodeSchema, currencyCodeSchema, timezoneSchema } from '#/shared/schemas/index.js';

import { RERA_NUMBER, WORKSPACE_NAME, WORKSPACE_SLUG } from '../../constants/index.js';
import { isUsableWorkspaceSlug } from '../../utils/index.js';

const createWorkspaceSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(
        WORKSPACE_NAME.MIN_LENGTH,
        `Name must be at least ${WORKSPACE_NAME.MIN_LENGTH} characters`,
      )
      .max(WORKSPACE_NAME.MAX_LENGTH),

    slug: z
      .string()
      .trim()
      .toLowerCase()
      .refine(isUsableWorkspaceSlug, {
        message:
          `Use ${WORKSPACE_SLUG.MIN_LENGTH}–${WORKSPACE_SLUG.MAX_LENGTH} lowercase letters, ` +
          'digits or hyphens, not starting or ending with a hyphen. Some words are reserved.',
      })
      .optional()
      .describe('The workspace URL. Derived from the name when omitted.'),

    businessType: z.enum(WorkspaceBusinessType),

    countryCode: countryCodeSchema.describe('ISO 3166-1 alpha-2, e.g. `IN`.'),

    timezone: timezoneSchema.describe('IANA zone name, e.g. `Asia/Kolkata`.'),

    currency: currencyCodeSchema.describe('ISO 4217, e.g. `INR`.'),

    reraNumber: z
      .string()
      .trim()
      .toUpperCase()
      .min(RERA_NUMBER.MIN_LENGTH)
      .max(RERA_NUMBER.MAX_LENGTH)
      .regex(RERA_NUMBER.PATTERN, 'Use letters, digits, `/` and `-` only')
      .optional()
      .describe('Real-estate registration number. Optional; helps the review.'),
  })
  .strict();

export class CreateWorkspaceDto extends createZodDto(createWorkspaceSchema) {}

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
