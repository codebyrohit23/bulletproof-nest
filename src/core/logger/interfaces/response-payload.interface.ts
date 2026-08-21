/**
 * The status code is the whole of what a response contributes to a log line.
 *
 * Response headers are excluded deliberately. They are near-identical on every
 * response this service sends — the Helmet security headers alone are a dozen
 * constant fields — so they cost ingest and storage on every request while
 * answering no question anyone asks. Duration is not here either: `pino-http`
 * measures it and emits it top level as `durationMs`.
 */
export interface ResponsePayload {
  statusCode: number;
}
