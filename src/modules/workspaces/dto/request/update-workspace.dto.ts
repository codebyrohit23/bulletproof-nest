import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { idSchema } from '#/shared/schemas/index.js';

const updateWorkspaceSchema = z
  .object({
    logoFileId: idSchema.optional(),
  })
  .strict()
  .check((ctx) => {
    if (Object.values(ctx.value).every((value) => value === undefined)) {
      ctx.issues.push({
        code: 'custom',
        message: 'Provide at least one field to update',
        input: ctx.value,
      });
    }
  });

export class UpdateWorkspaceDto extends createZodDto(updateWorkspaceSchema) {}

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
