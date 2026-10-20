import { FilePurpose, FileVisibility } from '@prisma/client';

import type { FilePolicy } from '../interfaces/file-policy.interface.js';

import { FILE_SCOPE } from './file-scope.constants.js';

const MEGABYTE = 1024 * 1024;

const RASTER_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const PUBLIC_IMAGE = {
  visibility: FileVisibility.PUBLIC,
  contentTypes: RASTER_IMAGE_TYPES,
  maxBytes: 5 * MEGABYTE,
} as const;

const AVATAR_IMAGE = {
  maxDimension: 1024,
  thumbnailDimension: 256,
  thumbnailFit: 'cover',
} as const;

export const FILE_PURPOSE_POLICY = {
  [FilePurpose.USER_AVATAR]: { scope: FILE_SCOPE.USER, ...PUBLIC_IMAGE, image: AVATAR_IMAGE },

  [FilePurpose.ADMIN_AVATAR]: { scope: FILE_SCOPE.ADMIN, ...PUBLIC_IMAGE, image: AVATAR_IMAGE },

  [FilePurpose.WORKSPACE_LOGO]: {
    scope: FILE_SCOPE.WORKSPACE,
    ...PUBLIC_IMAGE,
    image: { maxDimension: 1024, thumbnailDimension: 256, thumbnailFit: 'inside' },
  },
} as const satisfies Record<FilePurpose, FilePolicy>;
