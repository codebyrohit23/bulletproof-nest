import { STATUS_CODES } from 'node:http';

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

const UNINFORMATIVE: ReadonlySet<string> = new Set([
  '',
  'Error',
  'AggregateError',
  'Unknown',
  'UnknownError',
]);

export function describeStorageError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Storage request failed';
  }

  const { code, $metadata } = error as {
    code?: unknown;
    $metadata?: { httpStatusCode?: unknown };
  };

  const status = typeof $metadata?.httpStatusCode === 'number' ? $metadata.httpStatusCode : null;

  const parts = [...new Set([typeof code === 'string' ? code : error.name, error.message])].filter(
    (part) => !UNINFORMATIVE.has(part),
  );

  if (parts.length === 0 && status !== null) {
    parts.push(STATUS_CODES[status]?.replaceAll(' ', '') ?? 'HttpError');
  }

  const description = parts.join(': ') || 'Storage request failed';

  return status === null ? description : `${description} (${status})`;
}
