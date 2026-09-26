import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { offsetPageSchema } from '#/shared/pagination/index.js';
import { idSchema } from '#/shared/schemas/index.js';

import { ADMIN_SESSION_END_REASON, ADMIN_SESSION_STATUS } from '../../constants/index.js';

const adminSessionSchema = z.object({
  id: idSchema,

  current: z.boolean().describe('True for the session that made this request.'),

  status: z
    .enum(ADMIN_SESSION_STATUS)
    .describe('`ACTIVE` can make requests now. `ENDED` was signed out or expired.'),

  endedAt: z.iso.datetime().nullable().describe('When it ended. Null while active.'),

  endReason: z
    .enum(ADMIN_SESSION_END_REASON)
    .nullable()
    .describe(
      'Why it ended. Null while active. `SECURITY_ALERT` means it was ended because its ' +
        'credentials were used from somewhere they should not have been — worth reviewing.',
    ),

  deviceName: z.string().nullable(),

  browserName: z.string().nullable(),

  browserVersion: z.string().nullable(),

  osName: z.string().nullable(),

  osVersion: z.string().nullable(),

  city: z.string().nullable(),

  region: z.string().nullable(),

  countryCode: z.string().nullable(),

  lastActiveAt: z.iso.datetime().nullable(),

  signedInAt: z.iso.datetime(),
});

export class AdminSessionDto extends createZodDto(adminSessionSchema) {}

export type AdminSession = z.infer<typeof adminSessionSchema>;

const adminSessionPageSchema = offsetPageSchema(adminSessionSchema);

export class AdminSessionPageDto extends createZodDto(adminSessionPageSchema) {}

export type AdminSessionPage = z.infer<typeof adminSessionPageSchema>;

const adminRevokedSessionsSchema = z.object({
  revoked: z.number().int().nonnegative().describe('How many other devices were signed out.'),
});

export class AdminRevokedSessionsDto extends createZodDto(adminRevokedSessionsSchema) {}

export type AdminRevokedSessions = z.infer<typeof adminRevokedSessionsSchema>;
