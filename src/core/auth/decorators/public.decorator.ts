import { SetMetadata, type CustomDecorator } from '@nestjs/common';

import { AUTH_PUBLIC_METADATA } from '../constants/auth.constants.js';

/**
 * Opts a route out of `UserAuthGuard`, which is global — every route requires a
 * signed-in user unless it carries this. Applied to a class it covers every
 * route in it.
 */
export const Public = (): CustomDecorator => SetMetadata(AUTH_PUBLIC_METADATA, true);
