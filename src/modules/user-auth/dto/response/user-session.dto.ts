import { DevicePlatform, DeviceType } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { idSchema } from '#/shared/schemas/index.js';

/**
 * No IP address. City and country are enough to recognise a device, and an IP
 * is personal data this list would also show to whoever holds a stolen session.
 */
const userSessionSchema = z.object({
  id: idSchema,

  current: z.boolean().describe('True for the session that made this request.'),

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

const userSessionListSchema = z.object({
  sessions: z.array(userSessionSchema).describe('Most recently active first.'),
});

export class UserSessionListDto extends createZodDto(userSessionListSchema) {}

export type UserSessionList = z.infer<typeof userSessionListSchema>;

const revokedSessionsSchema = z.object({
  revoked: z.number().int().nonnegative().describe('How many other devices were signed out.'),
});

export class RevokedSessionsDto extends createZodDto(revokedSessionsSchema) {}

export type RevokedSessions = z.infer<typeof revokedSessionsSchema>;
