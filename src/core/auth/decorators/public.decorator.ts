import { SetMetadata, type CustomDecorator } from '@nestjs/common';

import { AUTH_PUBLIC_METADATA } from '../constants/auth.constants.js';

export const Public = (): CustomDecorator => SetMetadata(AUTH_PUBLIC_METADATA, true);
