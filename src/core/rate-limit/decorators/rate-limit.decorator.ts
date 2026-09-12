import { SetMetadata, type CustomDecorator } from '@nestjs/common';

import { RATE_LIMIT_METADATA, RATE_LIMIT_SKIP_METADATA } from '../constants/index.js';
import type { RateLimitDefinition } from '../interfaces/index.js';

export const RateLimit = (...definitions: readonly RateLimitDefinition[]): CustomDecorator =>
  SetMetadata(RATE_LIMIT_METADATA, definitions);

export const SkipRateLimit = (): CustomDecorator => SetMetadata(RATE_LIMIT_SKIP_METADATA, true);
