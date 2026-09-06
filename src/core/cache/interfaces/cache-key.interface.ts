export interface CacheKeyDescriptor {
  readonly resource: string;

  readonly version: number;

  readonly segments: readonly (string | number)[];
}
