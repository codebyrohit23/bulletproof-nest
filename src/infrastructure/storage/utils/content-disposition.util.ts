/**
 * A `Content-Disposition` value that is safe for any file name.
 *
 * Two parameters, per RFC 6266: `filename` is an ASCII fallback with quotes,
 * backslashes and anything non-printable replaced, so the header cannot be
 * broken out of; `filename*` carries the real name, percent-encoded as UTF-8,
 * for every client that reads it — which is all current browsers.
 */
export function buildContentDisposition(
  disposition: 'inline' | 'attachment',
  fileName?: string,
): string {
  if (fileName === undefined || fileName.length === 0) {
    return disposition;
  }

  const fallback = fileName.replace(/[^\x20-\x7e]|["\\]/g, '_');

  return `${disposition}; filename="${fallback}"; filename*=UTF-8''${encodeRfc5987(fileName)}`;
}

/** `encodeURIComponent` leaves `'()*` alone; RFC 5987 does not allow them. */
function encodeRfc5987(value: string): string {
  return encodeURIComponent(value).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}
