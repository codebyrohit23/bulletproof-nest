import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { fileViewSchema } from './file-view.dto.js';

const startedUploadSchema = z.object({
  file: fileViewSchema,

  upload: z
    .object({
      method: z.literal('PUT'),

      url: z.string().describe('A credential until `expiresAt`. Do not log or share it.'),

      headers: z
        .record(z.string(), z.string())
        .describe('Send exactly these with the upload. A different `Content-Type` is refused.'),

      expiresAt: z.iso.datetime(),
    })
    .describe('Send the file as the body of this request, then call `complete`.'),
});

export class StartedUploadDto extends createZodDto(startedUploadSchema) {}

export type StartedUpload = z.infer<typeof startedUploadSchema>;
