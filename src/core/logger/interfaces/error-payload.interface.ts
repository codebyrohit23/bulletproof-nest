/**
 * A failure, in the shape pino's own error serializer produces.
 *
 * `type` rather than `name` is deliberate: it is what `pino-std-serializers`
 * emits, what `pino-pretty` renders, and what every downstream integration
 * matches on. Manual logs and the automatic `pino-http` ones therefore land in
 * the same shape, and "every failure in this service" stays one query.
 */
export interface ErrorPayload {
  type: string;

  message: string;

  stack?: string;

  code?: string | number;

  cause?: unknown;
}
