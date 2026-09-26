import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const updateAdminProfileSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required').max(100).optional(),

    lastName: z.string().trim().min(1, 'Last name is required').max(100).optional(),

    displayName: z.string().trim().min(1, 'Display name is required').max(150).optional(),
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

export class UpdateAdminProfileDto extends createZodDto(updateAdminProfileSchema) {}

export type UpdateAdminProfileInput = z.infer<typeof updateAdminProfileSchema>;
