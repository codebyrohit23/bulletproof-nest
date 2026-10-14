# Workspace roles — API contract

The contract `modules/workspace-roles` implements: the permission catalogue a
role editor shows, the default roles every workspace has, the custom roles a
workspace defines, and which roles each member holds. Written before the code;
the model and the reasons for it are in `CLAUDE.md`, "Permissions".

Assigning roles to a member and the role on an invitation are routes of
`modules/workspaces` (Phase 5), because they start from a member or an
invitation; they call this module to write the assignment.

---

## The model in one paragraph

A permission is a key, `<resource>.<action>`, declared once in code and
mirrored into `workspace_permissions` by a seeder. A **default role** — Admin,
Manager, Agent — is one row shared by every workspace (`workspace_id` null,
`key` set); its permissions are the catalogue keys whose `defaultFor` names it,
and no workspace can edit it. A **custom role** belongs to one workspace,
starts empty, and is the customer's. A member holds any number of roles and has
their union. The owner holds no role and every permission.

---

## What this module owns

| Owns                                                                     | Does not own                                                     |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `workspace_permissions`, `workspace_roles`, `workspace_role_permissions` | `workspace_members` and membership status — `modules/workspaces` |
| `workspace_member_roles` — which roles a member holds                    | who the owner is — `modules/workspaces`                          |
| the `workspace-role-grants` and `workspace-member-roles` caches          | the workspace and membership snapshots                           |

`workspace_member_roles` is here, not in `modules/workspaces`, because deleting
a role must remove it from its holders and drop their cached roles, and this
module cannot import `modules/workspaces` — that module imports this one. The
permission resolver in `modules/workspaces` asks this module for a member's
roles and what they grant.

---

## The catalogue today

| Key                           | Restricted | Name                      | Default for           |
| ----------------------------- | ---------- | ------------------------- | --------------------- |
| `workspace.update`            |            | Update workspace settings | admin                 |
| `workspace.archive`           | yes        | Archive the workspace     | — owner only          |
| `workspace.transferOwnership` | yes        | Transfer ownership        | — owner only          |
| `member.read`                 |            | View members              | admin, manager, agent |
| `member.update`               |            | Update members            | admin                 |
| `member.changeRole`           |            | Change a member’s roles   | admin                 |
| `member.remove`               |            | Remove members            | admin                 |
| `invitation.read`             |            | View invitations          | admin, manager        |
| `invitation.create`           |            | Invite people             | admin, manager        |
| `invitation.revoke`           |            | Revoke invitations        | admin, manager        |
| `role.read`                   |            | View roles                | admin, manager        |
| `role.manage`                 |            | Manage custom roles       | admin                 |

The source is `core/permissions/catalogue/workspace-permissions.catalogue.ts`;
this table is a reading of it. There is no `workspace.read`: every active
member may read their workspace (`@AnyMember()`).

---

## Rules

- **Restricted keys belong to the owner.** A role — default or custom — never
  holds one. Granting one is `422`.
- **No escalation.** Creating or editing a role requires every key it grants
  to be one the caller holds. The caller's set comes from the same resolver
  the guard uses, so the owner may grant anything not restricted. `403`.
- **A role beyond the caller is read-only to them.** If a role already holds a
  key the caller lacks, they cannot rename, edit or delete it — otherwise they
  could strip a permission they never had from a role the owner built. `403`.
  The role's `editable` says so in advance.
- **Default roles are read-only.** `PATCH` and `DELETE` on one are `422`. A
  workspace that wants a variation creates a custom role with the same
  permissions — the client copies them; there is no clone route.
- **Names are unique per workspace, case-insensitive, and may not take a
  default role's name.** `409`. Enforced by the service for the default names
  and by `UNIQUE (workspace_id, lower(name))` for the rest.
- **`MAX_CUSTOM_ROLES` is 20 per workspace**, a constant. Beyond that the
  workspace wants teams or scopes, not more roles. `422`.
- **Another workspace's role is not found.** Every read and write is scoped by
  the workspace in `x-workspace-id`. `404`.

Errors follow the API's envelope: `error.code` is derived from the status
(`FORBIDDEN`, `CONFLICT`, `UNPROCESSABLE_ENTITY`, `NOT_FOUND`) and `message`
says which rule applied. Messages live in `constants/`.

---

## Routes

Tenant routes: base path `/v1`, header `x-workspace-id`.

| Method | Path                     | Marker         | Purpose                                  |
| ------ | ------------------------ | -------------- | ---------------------------------------- |
| GET    | `/workspace/permissions` | `@AnyMember()` | The catalogue, for a role editor         |
| GET    | `/workspace/roles`       | `role.read`    | Default and custom roles                 |
| GET    | `/workspace/roles/:id`   | `role.read`    | One role                                 |
| POST   | `/workspace/roles`       | `role.manage`  | Create a custom role                     |
| PATCH  | `/workspace/roles/:id`   | `role.manage`  | Rename, describe, replace permissions    |
| DELETE | `/workspace/roles/:id`   | `role.manage`  | Delete a custom role and its assignments |

### GET `/workspace/permissions`

Any member: the editor needs the vocabulary, and a member without
`role.manage` sees the same list to understand their own roles. Served from
the code catalogue, not the table. Not paginated — a few dozen entries.

```jsonc
{
  "items": [
    {
      "key": "member.read",
      "resource": "member",
      "action": "read",
      "name": "View members",
      "description": "See who belongs to the workspace, with their roles and status.",
      "restricted": false,
    },
  ],
}
```

A client groups by `resource` and disables what is `restricted` or absent from
the caller's `GET /workspace/access`.

### GET `/workspace/roles`

Default roles first in catalogue order, then custom roles by name. Not
paginated: three defaults and at most `MAX_CUSTOM_ROLES`.

```jsonc
{
  "items": [
    {
      "id": "…",
      "key": "manager",
      "name": "Manager",
      "description": "Runs the team day to day: invites people and sees the roles.",
      "isSystem": true,
      "editable": false,
      "permissions": ["invitation.create", "invitation.read", "…"],
      "memberCount": 4,
      "createdAt": "…",
      "updatedAt": "…",
    },
    {
      "id": "…",
      "key": null,
      "name": "Senior Broker",
      "description": null,
      "isSystem": false,
      "editable": true,
      "permissions": ["invitation.create", "member.read"],
      "memberCount": 1,
      "createdAt": "…",
      "updatedAt": "…",
    },
  ],
}
```

- `permissions` of a default role come from the catalogue — the same source
  the resolver uses — and of a custom role from its grants. Sorted.
- `memberCount` counts members of **this** workspace who hold the role and are
  `ACTIVE` or `SUSPENDED`.
- `editable` is the write rules answered for the caller: `false` for a default
  role, for a caller without `role.manage`, and for a role holding a key the
  caller lacks. A client shows edit and delete controls from it alone.

### GET `/workspace/roles/:id`

One role, the list's item shape. A default role is found by its id like any
other. `404` for an id that is neither a default role nor this workspace's.

### POST `/workspace/roles`

```jsonc
{
  "name": "Senior Broker", // 2–100, trimmed
  "description": "Handles invitations.", // optional, ≤ 500
  "permissions": ["member.read", "invitation.create"], // catalogue keys, no duplicates; may be empty
}
```

`permissions` is validated against the catalogue by the schema, so an unknown
key is a `422` with `validationErrors` before the service runs. Then, in this
order, so the message names the first rule broken:

1. a restricted key → `422`
2. a key the caller does not hold → `403`
3. a name in use, or a default role's name → `409`
4. `MAX_CUSTOM_ROLES` reached → `422`

`201` → the role, as in the list.

### PATCH `/workspace/roles/:id`

Any of `name`, `description`, `permissions`; at least one. `permissions`
**replaces** the set — a partial edit of a set has no honest meaning over HTTP.
`422` on a default role; then `403` if the role as it stands has a key the
caller lacks — even for a rename; then the same checks as create. `200` → the
role.

After commit, the role's `workspace-role-grants` key is deleted, so every
holder has the new set on their next request.

### DELETE `/workspace/roles/:id`

No body. One transaction: the role's assignments are removed from every holder
— their other roles stay — then the role, and its grants by cascade. After
commit, the role's grants key and each holder's member-roles key are deleted.
A member left with no role reaches only `@AnyMember()` routes.

- `422` on a default role.
- `403` if the role has a key the caller lacks.
- `409` while a **pending** invitation names the role — revoke it or change
  its role first. Phase 5 makes `workspace_invitations.role_id` nullable for
  resolved invitations, which today would block the delete through the
  foreign key; none exist yet.
- `200`, `data: null` and a message — the API's convention for a delete.

---

## Caches

| Key                                               | Value              | TTL   | Deleted when                                           |
| ------------------------------------------------- | ------------------ | ----- | ------------------------------------------------------ |
| `workspace-role-grants:<roleId>`                  | custom role's keys | 5 min | its permissions change, it is deleted                  |
| `workspace-member-roles:<workspaceId>:<memberId>` | `{ id, key }[]`    | 1 min | the member's roles change, a role they hold is deleted |

Default roles are never cached: the catalogue is their source. Deletes run
after commit.

---

## Seeding

`workspace-permissions` mirrors the catalogue into `workspace_permissions` and
reports — never deletes — keys the catalogue no longer has.
`workspace-default-roles` upserts Admin, Manager and Agent by `key` and syncs
their grants exactly to `defaultFor`. Both are `REFERENCE`, run on every
deploy, and live in `WorkspaceRolesSeedModule`, which needs no Redis.

---

## Deliberately not here

| Area                                           | Arrives with                                         |
| ---------------------------------------------- | ---------------------------------------------------- |
| Assigning roles to a member, invitation role   | Phase 5, routes in `modules/workspaces`              |
| Data visibility scope (own / team / all leads) | An attribute on the role, with the CRM modules       |
| Audit trail of role changes                    | Audit log; an `info` log entry per change until then |
| A clone route                                  | Only if a client needs more than copying the list    |
