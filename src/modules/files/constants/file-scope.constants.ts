export const FILE_SCOPE = {
  USER: 'user',
  WORKSPACE: 'workspace',
  ADMIN: 'admin',
} as const;

export type FileScope = (typeof FILE_SCOPE)[keyof typeof FILE_SCOPE];
