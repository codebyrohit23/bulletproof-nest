import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Authentication's view of a user — the minimum a client needs to render a
 * signed-in shell.
 *
 * **This is a leak barrier, not only documentation.** With the serializer
 * active, anything not named here is stripped on the way out. Hand a Prisma
 * `User` straight to a response and every column added later ships with it,
 * silently, and no reviewer has a reason to notice.
 *
 * Deliberately smaller than the user profile. `state`, `lastActiveAt`,
 * `createdAt` and `deletedAt` are internal; a client that needs a fuller
 * picture asks the users module for it. When that module exists it will have
 * its own richer shape, and the two should be free to diverge — a response DTO
 * describes what *one endpoint* returns, and sharing them across modules is how
 * one endpoint's change breaks another's contract.
 */
export const authUserSchema = z.object({
  id: z.uuid(),

  displayName: z.string(),

  /**
   * Null when unset, rather than absent. A client rendering an avatar needs one
   * shape to handle, not two — `undefined` and `null` reaching the same
   * template is how a placeholder image ends up as a broken one.
   */
  avatarFileId: z.uuid().nullable(),
});

export class AuthUserDto extends createZodDto(authUserSchema) {}

export type AuthUser = z.infer<typeof authUserSchema>;
