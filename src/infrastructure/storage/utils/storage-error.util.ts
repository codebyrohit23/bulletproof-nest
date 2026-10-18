/**
 * `HeadObject` reports a missing object as `NotFound`, `GetObject` as
 * `NoSuchKey`, and an S3-compatible store may report either or neither — so
 * the status code decides, with the names as a fallback.
 */
export function isNotFoundError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const { name, $metadata } = error as {
    name?: unknown;
    $metadata?: { httpStatusCode?: unknown };
  };

  return $metadata?.httpStatusCode === 404 || name === 'NotFound' || name === 'NoSuchKey';
}
