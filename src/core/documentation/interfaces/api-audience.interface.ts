import type { ApiAudienceKey } from '#/shared/constants/index.js';
import type { ApiTag } from '#/shared/interfaces/index.js';

export interface ApiAudience {
  readonly key: ApiAudienceKey;

  readonly title: string;

  readonly description: string;

  readonly version: string;

  readonly securityScheme: string;

  readonly docsPath: string;

  readonly specPath: string;

  readonly tags: readonly ApiTag[];

  readonly includesPath: (path: string) => boolean;
}
