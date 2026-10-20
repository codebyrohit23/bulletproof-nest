import { FilePurpose } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { FILE_NAME_MAX_LENGTH } from '../../constants/index.js';
import { sanitizeFileName } from '../../utils/index.js';

const startUploadSchema = z
  .object({
    purpose: z.enum(FilePurpose).describe('What the file is for. Must belong to this route.'),

    fileName: z
      .string()
      .transform(sanitizeFileName)
      .pipe(z.string().min(1, 'File name is required').max(FILE_NAME_MAX_LENGTH))
      .describe('Shown to people, never used to store the file.'),

    contentType: z
      .string()
      .trim()
      .toLowerCase()
      .min(1)
      .max(255)
      .describe('The file’s MIME type — send it again, unchanged, as `Content-Type` on upload.'),

    sizeBytes: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  })
  .strict();

export class StartUploadDto extends createZodDto(startUploadSchema) {}

export type StartUploadInput = z.infer<typeof startUploadSchema>;
