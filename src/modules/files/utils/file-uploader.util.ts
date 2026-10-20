import { FILE_SCOPE } from '../constants/file-scope.constants.js';
import type {
  AdminFileUploader,
  UserFileUploader,
  WorkspaceFileUploader,
} from '../interfaces/index.js';

export function userUploader(userId: string): UserFileUploader {
  return { scope: FILE_SCOPE.USER, userId };
}

export function workspaceUploader(userId: string, workspaceId: string): WorkspaceFileUploader {
  return { scope: FILE_SCOPE.WORKSPACE, userId, workspaceId };
}

export function adminUploader(adminId: string): AdminFileUploader {
  return { scope: FILE_SCOPE.ADMIN, adminId };
}
