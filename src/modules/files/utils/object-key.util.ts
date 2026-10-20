import { FileVisibility, type FilePurpose } from '@prisma/client';

import { STORAGE_BUCKET, type StorageBucket } from '#/infrastructure/storage/index.js';

import { FILE_PURPOSE_POLICY } from '../constants/file-policy.constants.js';
import { FILE_SCOPE } from '../constants/file-scope.constants.js';
import { INCOMING_KEY_PREFIX } from '../constants/files.constants.js';
import type { FileUploader } from '../interfaces/index.js';

const PURPOSE_FOLDER = {
  USER_AVATAR: 'avatar',
  ADMIN_AVATAR: 'avatar',
  WORKSPACE_LOGO: 'logo',
} as const satisfies Record<FilePurpose, string>;

export function storedObjectKey(
  uploader: FileUploader,
  purpose: FilePurpose,
  fileId: string,
): string {
  const folder = `${ownerPrefix(uploader)}/${PURPOSE_FOLDER[purpose]}/${fileId}`;

  return 'image' in FILE_PURPOSE_POLICY[purpose] ? `${folder}/image.webp` : `${folder}/original`;
}

export function thumbnailObjectKey(storedKey: string): string {
  return `${storedKey.slice(0, storedKey.lastIndexOf('/'))}/thumbnail.webp`;
}

export function incomingObjectKey(fileId: string): string {
  return `${INCOMING_KEY_PREFIX}/${fileId}`;
}

export function uploadObjectKey(file: {
  readonly id: string;
  readonly visibility: FileVisibility;
  readonly objectKey: string;
}): string {
  return file.visibility === FileVisibility.PUBLIC ? incomingObjectKey(file.id) : file.objectKey;
}

export function storedBucket(visibility: FileVisibility): StorageBucket {
  return visibility === FileVisibility.PUBLIC ? STORAGE_BUCKET.PUBLIC : STORAGE_BUCKET.PRIVATE;
}

function ownerPrefix(uploader: FileUploader): string {
  switch (uploader.scope) {
    case FILE_SCOPE.USER:
      return `users/${uploader.userId}`;

    case FILE_SCOPE.WORKSPACE:
      return `ws/${uploader.workspaceId}`;

    case FILE_SCOPE.ADMIN:
      return `admins/${uploader.adminId}`;
  }
}
