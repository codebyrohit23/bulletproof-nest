const CONTENT_TYPE_LABEL: Readonly<Record<string, string>> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
};

/** `JPG, PNG or WebP` — for a message, so it follows the policy rather than repeating it. */
export function describeContentTypes(contentTypes: readonly string[]): string {
  const labels = contentTypes.map((type) => CONTENT_TYPE_LABEL[type] ?? type);

  if (labels.length <= 1) {
    return labels.join('');
  }

  return `${labels.slice(0, -1).join(', ')} or ${labels.at(-1) ?? ''}`;
}

const UNITS = ['bytes', 'KB', 'MB', 'GB'] as const;

export function describeBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(1));

  return `${rounded} ${UNITS[unit]}`;
}
