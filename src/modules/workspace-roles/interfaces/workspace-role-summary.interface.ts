/** A role as a client shows it — on a member, in a picker, on the access endpoint. */
export interface WorkspaceRoleSummary {
  readonly id: string;

  /** `admin` · `manager` · `agent` on a default role; null on a custom one. */
  readonly key: string | null;

  readonly name: string;

  readonly isSystem: boolean;
}
