import { WorkspaceBusinessType, WorkspaceStatus } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { attachedImageSchema } from '#/modules/files/index.js';
import { idSchema } from '#/shared/schemas/index.js';

export const workspaceSchema = z.object({
  id: idSchema,

  name: z.string(),

  slug: z.string(),

  businessType: z.enum(WorkspaceBusinessType),

  status: z
    .enum(WorkspaceStatus)
    .describe(
      '`PENDING_APPROVAL` until a LeadFlow admin reviews it; it cannot be used before then.',
    ),

  countryCode: z.string(),

  timezone: z.string(),

  currency: z.string(),

  reraNumber: z.string().nullable(),

  reviewNote: z
    .string()
    .nullable()
    .describe('Left by the reviewing admin — chiefly the reason for a rejection.'),

  logo: attachedImageSchema
    .nullable()
    .describe('Null when there is no logo, and while a new one is still being processed.'),

  isOwner: z.boolean(),

  onboardingCompletedAt: z.iso.datetime().nullable(),

  createdAt: z.iso.datetime(),
});

export class WorkspaceDto extends createZodDto(workspaceSchema) {}

export type Workspace = z.infer<typeof workspaceSchema>;
