import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const adminPasswordResetTokenSchema = z.object({
  resetToken: z.string().min(1),

  expiresIn: z.number().int().positive(),
});

export class AdminPasswordResetTokenDto extends createZodDto(adminPasswordResetTokenSchema) {}

export type AdminPasswordResetToken = z.infer<typeof adminPasswordResetTokenSchema>;
