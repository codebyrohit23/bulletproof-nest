export function summariseRecipients(recipients: readonly string[]): string {
  const [first, ...rest] = recipients;

  if (first === undefined) {
    return 'no recipients';
  }

  return rest.length === 0 ? first : `${first} +${String(rest.length)}`;
}
