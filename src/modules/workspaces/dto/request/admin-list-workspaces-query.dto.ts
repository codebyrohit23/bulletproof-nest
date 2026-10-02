import { WorkspaceStatus } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  offsetPaginationQuerySchema,
  SORT_ORDER,
  sortOrderSchema,
} from '#/shared/pagination/index.js';

import { ADMIN_WORKSPACE_SEARCH_MAX_LENGTH } from '../../constants/index.js';

const adminListWorkspacesQuerySchema = offsetPaginationQuerySchema({
  status: z
    .enum(WorkspaceStatus)
    .optional()
    .describe('Only workspaces in this status. `PENDING_APPROVAL` is the review queue.'),

  search: z
    .string()
    .trim()
    .min(1)
    .max(ADMIN_WORKSPACE_SEARCH_MAX_LENGTH)
    .optional()
    .describe('Matches part of the name or slug, ignoring case.'),

  order: sortOrderSchema.describe(
    `By creation time. \`${SORT_ORDER.ASC}\` serves the review queue oldest first.`,
  ),
});

export class AdminListWorkspacesQueryDto extends createZodDto(adminListWorkspacesQuerySchema) {}

export type AdminListWorkspacesQuery = z.infer<typeof adminListWorkspacesQuerySchema>;
