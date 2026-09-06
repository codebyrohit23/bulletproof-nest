import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * A `429` that also says when to come back.
 *
 * The wait belongs in the `Retry-After` header, not in the message. Two reasons:
 *
 * - It is the standard (RFC 9110 §10.2.3), so HTTP clients, SDKs and proxies
 *   already know how to back off on it. A number buried in a sentence is
 *   readable by nobody but a human.
 * - A message is shown to a user, and "try again in 247 seconds" is worse than
 *   "try again later" — it invites watching a clock, and it reads as precision
 *   about a limit the user was never told about.
 *
 * `GlobalExceptionFilter` recognises this type and writes the header. Nothing
 * else about the response changes.
 */
export class TooManyRequestsException extends HttpException {
  constructor(
    message: string,
    readonly retryAfterSeconds: number,
  ) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
