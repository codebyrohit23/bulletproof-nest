import type { Prisma } from '@prisma/client';

import { FILE_SCOPE } from '../constants/file-scope.constants.js';
import type { FileUploader } from '../interfaces/index.js';

export function uploaderWhere(uploader: FileUploader): Prisma.StoredFileWhereInput {
  switch (uploader.scope) {
    case FILE_SCOPE.USER:
      return { uploadedByUserId: uploader.userId, uploadedByAdminId: null, workspaceId: null };

    case FILE_SCOPE.WORKSPACE:
      return {
        uploadedByUserId: uploader.userId,
        uploadedByAdminId: null,
        workspaceId: uploader.workspaceId,
      };

    case FILE_SCOPE.ADMIN:
      return { uploadedByAdminId: uploader.adminId, uploadedByUserId: null, workspaceId: null };
  }
}

export function uploaderColumns(uploader: FileUploader): {
  readonly workspaceId: string | null;
  readonly uploadedByUserId: string | null;
  readonly uploadedByAdminId: string | null;
} {
  switch (uploader.scope) {
    case FILE_SCOPE.USER:
      return { workspaceId: null, uploadedByUserId: uploader.userId, uploadedByAdminId: null };

    case FILE_SCOPE.WORKSPACE:
      return {
        workspaceId: uploader.workspaceId,
        uploadedByUserId: uploader.userId,
        uploadedByAdminId: null,
      };

    case FILE_SCOPE.ADMIN:
      return { workspaceId: null, uploadedByUserId: null, uploadedByAdminId: uploader.adminId };
  }
}
