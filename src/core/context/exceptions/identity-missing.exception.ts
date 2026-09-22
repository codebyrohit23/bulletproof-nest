import { HttpException, HttpStatus } from '@nestjs/common';

import { AUTH_ERROR_MESSAGE } from '#/core/auth/constants/auth.constants.js';

export class IdentityMissingException extends HttpException {
  constructor(readonly field: string) {
    super(AUTH_ERROR_MESSAGE.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }
}
