import { Injectable } from '@nestjs/common';

import type { CacheStats } from '../interfaces/index.js';
@Injectable()
export class CacheMetricsService {
  private hits = 0;

  private misses = 0;

  private errors = 0;

  private skipped = 0;

  recordHit(): void {
    this.hits += 1;
  }

  recordMiss(): void {
    this.misses += 1;
  }

  recordError(): void {
    this.errors += 1;
  }

  recordSkip(): void {
    this.skipped += 1;
  }

  get stats(): CacheStats {
    const lookups = this.hits + this.misses;

    return {
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      skipped: this.skipped,
      hitRate: lookups === 0 ? 0 : Number((this.hits / lookups).toFixed(4)),
    };
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
    this.skipped = 0;
  }
}
