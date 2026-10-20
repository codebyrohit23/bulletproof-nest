import type { FileVisibility } from '@prisma/client';

import type { FileScope } from '../constants/file-scope.constants.js';

export interface FilePolicy {
  readonly scope: FileScope;

  readonly visibility: FileVisibility;

  readonly contentTypes: readonly string[];

  readonly maxBytes: number;

  readonly image?: FileImagePolicy;
}

export interface FileImagePolicy {
  readonly maxDimension: number;

  readonly thumbnailDimension: number;

  readonly thumbnailFit: 'cover' | 'inside';
}
