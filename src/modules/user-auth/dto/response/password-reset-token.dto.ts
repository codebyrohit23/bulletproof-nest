import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const passwordResetTokenSchema = z.object({
  resetToken: z.string().min(1),

  expiresIn: z.number().int().positive(),
});

export class PasswordResetTokenDto extends createZodDto(passwordResetTokenSchema) {}

export type PasswordResetToken = z.infer<typeof passwordResetTokenSchema>;
