import type { WorkspaceAccessResult } from '../interfaces/index.js';

/**
 * Whether a user may act inside a workspace. A port because the answer lives
 * in `workspace_members`, which `modules/workspaces` owns and `core` may not
 * import.
 */
export abstract class WorkspaceAccessResolver {
  abstract resolve(workspaceId: string, userId: string): Promise<WorkspaceAccessResult>;
}
