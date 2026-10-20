import type { FILE_SCOPE } from '../constants/file-scope.constants.js';

export type FileUploader = UserFileUploader | WorkspaceFileUploader | AdminFileUploader;

export interface UserFileUploader {
  readonly scope: typeof FILE_SCOPE.USER;

  readonly userId: string;
}

export interface WorkspaceFileUploader {
  readonly scope: typeof FILE_SCOPE.WORKSPACE;

  readonly userId: string;

  readonly workspaceId: string;
}

export interface AdminFileUploader {
  readonly scope: typeof FILE_SCOPE.ADMIN;

  readonly adminId: string;
}
