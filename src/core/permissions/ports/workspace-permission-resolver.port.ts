import type { WorkspaceGrant, WorkspaceGrantSubject } from '../interfaces/index.js';

export abstract class WorkspacePermissionResolver {
  abstract resolve(subject: WorkspaceGrantSubject): Promise<WorkspaceGrant | null>;
}
