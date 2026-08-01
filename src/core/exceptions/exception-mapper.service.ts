import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';

import { EXCEPTION_HANDLERS } from './constants/index.js';
import type { ExceptionDetails, ExceptionHandler } from './interfaces/index.js';

@Injectable()
export class ExceptionMapperService {
  constructor(
    @Inject(EXCEPTION_HANDLERS)
    private readonly handlers: readonly ExceptionHandler[],
  ) {}

  map(exception: unknown): ExceptionDetails {
    const handler = this.findHandler(exception);

    return handler.handle(exception);
  }

  private findHandler(exception: unknown): ExceptionHandler {
    const handler = this.handlers.find((handler) => handler.supports(exception));

    if (handler) {
      return handler;
    }

    throw new InternalServerErrorException('No exception handler registered.');
  }
}
