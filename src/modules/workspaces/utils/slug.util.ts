import { randomInt } from 'node:crypto';

import slugify from '@sindresorhus/slugify';

import { RESERVED_WORKSPACE_SLUGS, WORKSPACE_SLUG } from '../constants/index.js';

const SUFFIX_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** Leaves room for `-xxxx`, so a suffixed slug never exceeds the column. */
const MAX_BASE_LENGTH = WORKSPACE_SLUG.MAX_LENGTH - WORKSPACE_SLUG.SUFFIX_LENGTH - 1;

/** Shape, length and not reserved — the rules an explicit slug is held to. */
export function isUsableWorkspaceSlug(slug: string): boolean {
  return (
    slug.length >= WORKSPACE_SLUG.MIN_LENGTH &&
    slug.length <= WORKSPACE_SLUG.MAX_LENGTH &&
    WORKSPACE_SLUG.PATTERN.test(slug) &&
    !RESERVED_WORKSPACE_SLUGS.has(slug)
  );
}

export function deriveWorkspaceSlugBase(name: string): string {
  const base = slugify(name).slice(0, MAX_BASE_LENGTH).replace(/-+$/, '');

  return base.length > 0 ? base : WORKSPACE_SLUG.FALLBACK;
}

export function workspaceSlugCandidates(name: string): string[] {
  const base = deriveWorkspaceSlugBase(name);

  const suffixed = Array.from(
    { length: WORKSPACE_SLUG.SUFFIXED_CANDIDATES },
    () => `${base}-${randomSuffix()}`,
  );

  return [...new Set(isUsableWorkspaceSlug(base) ? [base, ...suffixed] : suffixed)];
}

function randomSuffix(): string {
  return Array.from(
    { length: WORKSPACE_SLUG.SUFFIX_LENGTH },
    () => SUFFIX_ALPHABET[randomInt(SUFFIX_ALPHABET.length)],
  ).join('');
}
