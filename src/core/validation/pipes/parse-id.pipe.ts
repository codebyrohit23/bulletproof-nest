import { Injectable, type ArgumentMetadata, type PipeTransform } from '@nestjs/common';
import { z } from 'zod';

import { idSchema } from '#/shared/schemas/index.js';

const DEFAULT_PARAM_NAME = 'id';

@Injectable()
export class ParseIdPipe implements PipeTransform<unknown, string> {
  transform(value: unknown, metadata: ArgumentMetadata): string {
    const name = metadata.data ?? DEFAULT_PARAM_NAME;

    const parsed = z.object({ [name]: idSchema }).parse({ [name]: value });

    return parsed[name] as string;
  }
}
