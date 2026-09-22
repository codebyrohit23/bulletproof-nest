import { CACHE_ENVELOPE_VERSION, CACHE_TTL_JITTER_RATIO } from '../constants/index.js';
export interface CacheEnvelope<T> {
  readonly v: T;
}

interface StoredEnvelope {
  readonly __cv: unknown;
  readonly v: unknown;
}

export function serialize<T>(value: T): string {
  return JSON.stringify({ __cv: CACHE_ENVELOPE_VERSION, v: value ?? null });
}

export function deserialize<T>(payload: string): CacheEnvelope<T> | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }

  const stored = parsed as StoredEnvelope;

  if (stored.__cv !== CACHE_ENVELOPE_VERSION) {
    return null;
  }

  return { v: (stored.v ?? null) as T };
}

export function applyTtlJitter(ttlSeconds: number): number {
  const jitter = ttlSeconds * CACHE_TTL_JITTER_RATIO * (Math.random() * 2 - 1);

  return Math.max(1, Math.round(ttlSeconds + jitter));
}
