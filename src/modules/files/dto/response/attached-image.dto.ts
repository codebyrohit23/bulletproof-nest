import { z } from 'zod';

export const attachedImageSchema = z.object({
  url: z.string().describe('The stored image, up to 1024 px. For large or high-density displays.'),

  thumbnailUrl: z
    .string()
    .nullable()
    .describe('256 px. For lists and anything drawn up to about 64 px.'),
});

export type AttachedImage = z.infer<typeof attachedImageSchema>;
