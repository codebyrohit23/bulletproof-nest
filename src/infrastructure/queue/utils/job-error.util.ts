/**
 * Whether a failure is worth another attempt.
 *
 * ---------------------------------------------------------------------------
 * WHY A STRUCTURAL CHECK AND NOT `instanceof`
 * ---------------------------------------------------------------------------
 * The errors that answer this question live in `core` — `EmailTransportError`,
 * `UnknownEmailTemplateError`, and whatever the SMS and push layers add later.
 * Importing them here would make `infrastructure/queue` depend on every module
 * that dispatches a job, and the dependency would grow with each one.
 *
 * A property check costs nothing and inverts the direction: a module declares
 * `retryable` on its own error and the runner honours it, without either side
 * naming the other.
 *
 * Absence means retryable. An ordinary `Error` says nothing about whether the
 * next attempt might work, and the queue's existing backoff is the right answer
 * when nobody knows.
 */
export function isNonRetryable(error: unknown): boolean {
  return (
    error instanceof Error &&
    'retryable' in error &&
    (error as { readonly retryable: unknown }).retryable === false
  );
}
