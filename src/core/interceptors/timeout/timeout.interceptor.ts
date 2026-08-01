import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

import { AppConfigService } from '@/config/app/index.js'; // value import — required for DI metadata

/**
 * Bounds how long a handler may run.
 *
 * Without this a single slow query holds a connection and a worker until the
 * client gives up, and under load that is how one slow endpoint takes down
 * every endpoint.
 *
 * Note what it does **not** do: the underlying work keeps running. RxJS can
 * abandon the result but cannot cancel a query already in flight — that needs
 * a statement timeout on the database side. This bounds the *client's* wait,
 * which is what turns a hang into a fast, honest failure.
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly appConfigService: AppConfigService) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(this.appConfigService.requestTimeoutMs),
      catchError((error: unknown) =>
        throwError(() =>
          error instanceof TimeoutError
            ? new RequestTimeoutException(`Request exceeded ${this.appConfigService.requestTimeoutMs}ms.`)
            : error,
        ),
      ),
    );
  }
}
