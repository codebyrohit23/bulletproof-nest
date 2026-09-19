import type { PipeTransform, Type } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';

export const ZodValidationPipe: Type<PipeTransform> = createZodValidationPipe({
  createValidationException: (error: unknown): Error =>
    error instanceof Error ? error : new Error('Request validation failed.'),

  strictSchemaDeclaration: false,
});
