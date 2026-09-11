import { SetMetadata, type CustomDecorator } from '@nestjs/common';

import { CSRF_SKIP_METADATA } from '../constants/index.js';

export const SkipCsrf = (): CustomDecorator => SetMetadata(CSRF_SKIP_METADATA, true);
