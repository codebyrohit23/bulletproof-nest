import type { WorkspaceAccessDenial } from '../constants/index.js';

export type WorkspaceAccessResult =
  | { readonly ok: true; readonly memberId: string }
  | { readonly ok: false; readonly reason: WorkspaceAccessDenial };
