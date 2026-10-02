import { WorkspaceBusinessType, WorkspaceStatus } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { offsetPageSchema } from '#/shared/pagination/index.js';
import { idSchema } from '#/shared/schemas/index.js';

const adminWorkspaceOwnerSchema = z.object({
  userId: idSchema,

  displayName: z.string(),

  email: z.string().nullable().describe('Null for an owner who signed up by phone.'),

  emailVerified: z.boolean(),
});

const adminWorkspaceSummarySchema = z.object({
  id: idSchema,

  name: z.string(),

  slug: z.string(),

  businessType: z.enum(WorkspaceBusinessType),

  status: z.enum(WorkspaceStatus),

  countryCode: z.string(),

  reraNumber: z.string().nullable(),

  owner: adminWorkspaceOwnerSchema,

  reviewedAt: z.iso.datetime().nullable(),

  createdAt: z.iso.datetime(),
});

const adminWorkspaceDetailSchema = adminWorkspaceSummarySchema.extend({
  timezone: z.string(),

  currency: z.string(),

  reviewNote: z.string().nullable(),

  reviewedBy: z
    .object({ adminId: idSchema, displayName: z.string() })
    .nullable()
    .describe('Null while pending, or when the reviewing admin has since been removed.'),

  activeMembers: z.number().int().nonnegative(),

  onboardingCompletedAt: z.iso.datetime().nullable(),

  suspendedAt: z.iso.datetime().nullable(),

  archivedAt: z.iso.datetime().nullable(),

  updatedAt: z.iso.datetime(),
});

export class AdminWorkspaceSummaryDto extends createZodDto(adminWorkspaceSummarySchema) {}

export type AdminWorkspaceSummary = z.infer<typeof adminWorkspaceSummarySchema>;

const adminWorkspacePageSchema = offsetPageSchema(adminWorkspaceSummarySchema);

export class AdminWorkspacePageDto extends createZodDto(adminWorkspacePageSchema) {}

export type AdminWorkspacePage = z.infer<typeof adminWorkspacePageSchema>;

export class AdminWorkspaceDetailDto extends createZodDto(adminWorkspaceDetailSchema) {}

export type AdminWorkspaceDetail = z.infer<typeof adminWorkspaceDetailSchema>;
