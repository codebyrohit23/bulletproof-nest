import { FilePurpose, FileRejectReason, FileStatus } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { idSchema } from '#/shared/schemas/index.js';

const imageSchema = z.object({
  url: z.string(),

  width: z.number().int(),

  height: z.number().int(),
});

export const fileViewSchema = z.object({
  id: idSchema,

  purpose: z.enum(FilePurpose),

  status: z
    .enum(FileStatus)
    .describe('Poll until `READY` or `REJECTED`. `url` is null before `READY`.'),

  rejectReason: z.enum(FileRejectReason).nullable(),

  name: z.string(),

  contentType: z.string().describe('Detected from the content once processed; declared before.'),

  sizeBytes: z.number().int(),

  width: z.number().int().nullable(),

  height: z.number().int().nullable(),

  durationMs: z.number().int().nullable(),

  url: z
    .string()
    .nullable()
    .describe(
      'Permanent for a public file. For a private one, signed and valid until `urlExpiresAt` — ' +
        're-read the resource for a fresh one rather than keeping it.',
    ),

  urlExpiresAt: z.iso.datetime().nullable(),

  thumbnail: imageSchema.nullable(),

  attachedAt: z.iso.datetime().nullable(),

  expiresAt: z.iso
    .datetime()
    .nullable()
    .describe('While unattached: the file is deleted at this time unless something uses it.'),

  createdAt: z.iso.datetime(),
});

export class FileViewDto extends createZodDto(fileViewSchema) {}

export type FileView = z.infer<typeof fileViewSchema>;
