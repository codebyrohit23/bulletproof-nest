import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { REVIEW_NOTE } from '../../constants/index.js';

const noteSchema = z.string().trim().max(REVIEW_NOTE.MAX_LENGTH);

const adminApproveWorkspaceSchema = z
  .object({
    note: noteSchema.min(1).optional().describe('Shown to the owner. Optional on approval.'),
  })
  .strict();

const adminRejectWorkspaceSchema = z
  .object({
    note: noteSchema
      .min(
        REVIEW_NOTE.REJECT_MIN_LENGTH,
        `Explain the rejection in at least ${REVIEW_NOTE.REJECT_MIN_LENGTH} characters`,
      )
      .describe('Shown to the owner — the reason, in words they can act on.'),
  })
  .strict();

export class AdminApproveWorkspaceDto extends createZodDto(adminApproveWorkspaceSchema) {}

export type AdminApproveWorkspaceInput = z.infer<typeof adminApproveWorkspaceSchema>;

export class AdminRejectWorkspaceDto extends createZodDto(adminRejectWorkspaceSchema) {}

export type AdminRejectWorkspaceInput = z.infer<typeof adminRejectWorkspaceSchema>;
