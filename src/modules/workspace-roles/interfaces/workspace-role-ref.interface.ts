/**
 * One role a member holds, as the resolver needs it. `key` is set on a default
 * role — whose permissions come from the catalogue — and null on a custom
 * role, whose permissions come from its grants, by `id`.
 */
export interface WorkspaceRoleRef {
  readonly id: string;

  readonly key: string | null;
}
