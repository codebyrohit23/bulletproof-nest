import { DevicePlatform, DeviceType } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { offsetPageSchema } from '#/shared/pagination/index.js';
import { idSchema } from '#/shared/schemas/index.js';

import { USER_SESSION_END_REASON, USER_SESSION_STATUS } from '../../constants/index.js';

const userSessionSchema = z.object({
  id: idSchema,

  current: z.boolean().describe('True for the session that made this request.'),

  status: z
    .enum(USER_SESSION_STATUS)
    .describe('`ACTIVE` can make requests now. `ENDED` was signed out or expired.'),

  endedAt: z.iso.datetime().nullable().describe('When it ended. Null while active.'),

  endReason: z
    .enum(USER_SESSION_END_REASON)
    .nullable()
    .describe(
      'Why it ended. Null while active. `SECURITY_ALERT` means it was ended because its ' +
        'credentials were used from somewhere they should not have been — worth reviewing.',
    ),

  deviceName: z.string().nullable(),

  deviceType: z.enum(DeviceType).nullable(),

  platform: z.enum(DevicePlatform).nullable(),

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

export class UserSessionDto extends createZodDto(userSessionSchema) {}

export type UserSession = z.infer<typeof userSessionSchema>;

const userSessionPageSchema = offsetPageSchema(userSessionSchema);

export class UserSessionPageDto extends createZodDto(userSessionPageSchema) {}

export type UserSessionPage = z.infer<typeof userSessionPageSchema>;

const userRevokedSessionsSchema = z.object({
  revoked: z.number().int().nonnegative().describe('How many other devices were signed out.'),
});

export class UserRevokedSessionsDto extends createZodDto(userRevokedSessionsSchema) {}

export type UserRevokedSessions = z.infer<typeof userRevokedSessionsSchema>;
