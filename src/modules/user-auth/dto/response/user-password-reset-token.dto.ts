import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const userPasswordResetTokenSchema = z.object({
  resetToken: z.string().min(1),

  expiresIn: z.number().int().positive(),
});

export class UserPasswordResetTokenDto extends createZodDto(userPasswordResetTokenSchema) {}

export type UserPasswordResetToken = z.infer<typeof userPasswordResetTokenSchema>;
