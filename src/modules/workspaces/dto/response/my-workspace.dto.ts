import { WorkspaceBusinessType, WorkspaceStatus } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { offsetPageSchema } from '#/shared/pagination/index.js';
import { idSchema } from '#/shared/schemas/index.js';

const myWorkspaceSchema = z.object({
  id: idSchema.describe('The workspace id — what `x-workspace-id` takes.'),

  name: z.string(),

  slug: z.string(),

  businessType: z.enum(WorkspaceBusinessType),

  status: z
    .enum(WorkspaceStatus)
    .describe(
      'Only `ACTIVE` can be opened. `PENDING_APPROVAL` is awaiting review; `REJECTED` ' +
        'carries the reason in `reviewNote`; `SUSPENDED` was stopped by LeadFlow.',
    ),

  reviewNote: z.string().nullable(),

  isOwner: z.boolean(),

  memberId: idSchema.describe('The caller’s membership in this workspace.'),

  joinedAt: z.iso.datetime(),

  lastAccessedAt: z.iso.datetime().nullable(),
});

export class MyWorkspaceDto extends createZodDto(myWorkspaceSchema) {}

export type MyWorkspace = z.infer<typeof myWorkspaceSchema>;

const myWorkspacePageSchema = offsetPageSchema(myWorkspaceSchema);

export class MyWorkspacePageDto extends createZodDto(myWorkspacePageSchema) {}

export type MyWorkspacePage = z.infer<typeof myWorkspacePageSchema>;
