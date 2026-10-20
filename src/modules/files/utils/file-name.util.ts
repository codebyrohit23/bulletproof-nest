const UNSAFE_CHARACTERS = /[\p{Cc}\u200E\u200F\u202A-\u202E\u2066-\u2069]/gu;

export function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).at(-1) ?? '';

  return base.replace(UNSAFE_CHARACTERS, '').replace(/\s+/g, ' ').trim();
}
