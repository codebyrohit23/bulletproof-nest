# Workspace roles — API contract

The contract `modules/workspace-roles` implements: the permission catalogue a
workspace can grant from, the system roles every workspace has, and the custom
roles a workspace defines. Written before the code. The decision record is
`docs/adr/ADR-004-rbac-implementation.md`; this file is what a client and a
reviewer hold the code to. Member role assignment and the role on an
invitation live in `modules/workspaces/API.md`, because those rows are that
module's.

---

## The model in one paragraph

A permission is a key, `<resource>.<action>`, declared once in code
(`core/permissions/catalogue`) and mirrored into `workspace_permissions` by a
seeder. A system role is an enum value whose permission set is in code; every
workspace has them, none has a row for them. A custom role is a row with
grants, per workspace, starting empty. A member holds exactly one role of
either kind. The caller's resolved permissions, not their role, are what the
API and the client decide on.

---

## System roles

| Role      | Permissions                                                                                 | Notes                                               |
| --------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `OWNER`   | every key in the catalogue, derived                                                         | one per workspace; moves only by ownership transfer |
| `ADMIN`   | every key minus `ownerOnly`, derived                                                        | the previous owner becomes this on transfer         |
| `MANAGER` | `member.read` · `invitation.read` · `invitation.create` · `invitation.revoke` · `role.read` | runs the team day to day; does not shape it         |
| `AGENT`   | `member.read`                                                                               | the default for an invitation that names no role    |

Labels shown to clients: Owner, Admin, Manager, Agent. The sets are
`WORKSPACE_SYSTEM_ROLE_PERMISSIONS` in `constants/`, typed
`satisfies Record<WorkspaceSystemRole, ReadonlySet<WorkspacePermissionKey>>`.
When the CRM resources arrive, `MANAGER` and `AGENT` grow in that one
constant and every workspace has the change at deploy.

---

## The catalogue today

Only what has, or is about to have, a route. CRM resources arrive with their
modules.

| Key                           | Owner-only | Name                      |
| ----------------------------- | ---------- | ------------------------- |
| `workspace.update`            |            | Update workspace settings |
| `workspace.archive`           | yes        | Archive the workspace     |
| `workspace.transferOwnership` | yes        | Transfer ownership        |
| `member.read`                 |            | View members              |
| `member.update`               |            | Update members            |
| `member.changeRole`           |            | Change a member’s role    |
| `member.remove`               |            | Remove members            |
| `invitation.read`             |            | View invitations          |
| `invitation.create`           |            | Invite people             |
| `invitation.revoke`           |            | Revoke invitations        |
| `role.read`                   |            | View roles                |
| `role.manage`                 |            | Manage custom roles       |

There is no `workspace.read`: every active member may read their workspace,
which is what `@AnyMember()` on that route says.

---

## Conventions

- Base path `/v1`, tenant routes (`x-workspace-id`), standard envelope.
- A **role reference** in a request body is exactly one of two fields:

  ```jsonc
  { "systemRole": "MANAGER" }        // WorkspaceSystemRole, never OWNER
  { "customRoleId": "…" }            // a role of this workspace
  ```

- A **role** in a response is discriminated by `kind`:

  ```jsonc
  { "kind": "system", "key": "MANAGER", "name": "Manager" }
  { "kind": "custom", "id": "…", "name": "Senior Broker" }
  ```

- **No escalation.** Creating or editing a custom role, and assigning any role,
  requires the target permission set to be a subset of the caller's. `OWNER`
  is never assignable. One check, `assertWithinCallerGrant`, in the role
  service.
- `MAX_CUSTOM_ROLES` is 20 per workspace, a constant. Beyond that is a sign the
  workspace needs scopes or teams, not more roles.

---

## Routes

| Method | Path                     | Permission     | Purpose                               |
| ------ | ------------------------ | -------------- | ------------------------------------- |
| GET    | `/workspace/permissions` | `@AnyMember()` | The catalogue, for a role editor      |
| GET    | `/workspace/roles`       | `role.read`    | System and custom roles               |
| GET    | `/workspace/roles/:id`   | `role.read`    | One custom role                       |
| POST   | `/workspace/roles`       | `role.manage`  | Create a custom role                  |
| PATCH  | `/workspace/roles/:id`   | `role.manage`  | Rename, describe, replace permissions |
| DELETE | `/workspace/roles/:id`   | `role.manage`  | Delete, reassigning its members       |

### GET `/workspace/permissions`

Any member: a role editor needs the vocabulary, and a member with no
`role.manage` sees the same list read-only to understand their own role. Not
paginated — the catalogue is a few dozen entries.

```jsonc
{
  "items": [
    {
      "key": "member.invite",
      "resource": "member",
      "action": "invite",
      "name": "Invite people",
      "description": "Invite someone by email, or resend an invitation.",
      "ownerOnly": false,
    },
  ],
}
```

Served from the code catalogue, not the table: the table is the mirror.

### GET `/workspace/roles`

System roles first, in enum order, then custom roles by name. Not paginated:
four system roles and at most `MAX_CUSTOM_ROLES`.

```jsonc
{
  "items": [
    {
      "kind": "system",
      "key": "MANAGER",
      "name": "Manager",
      "description": "Runs the team day to day.",
      "permissions": ["member.read", "invitation.read", "…"],
      "memberCount": 3,
      "editable": false,
    },
    {
      "kind": "custom",
      "id": "…",
      "name": "Senior Broker",
      "description": null,
      "permissions": ["member.read", "invitation.create"],
      "memberCount": 2,
      "editable": true,
      "createdAt": "…",
      "updatedAt": "…",
    },
  ],
}
```

`memberCount` counts `ACTIVE` and `SUSPENDED` members. `editable` is `false`
for every system role and `true` for every custom role; it is in the body so
a client never derives it from `kind`.

### GET `/workspace/roles/:id`

A custom role. System roles have no id; the list is their only view.
`404 ROLE_NOT_FOUND` — including for another workspace's role id.

### POST `/workspace/roles`

```jsonc
{
  "name": "Senior Broker", // 2–100, unique per workspace, case-insensitive
  "description": "…", // optional, ≤ 500
  "permissions": ["member.read", "invitation.create"], // catalogue keys; may be empty
}
```

Validation is the catalogue: `permissions` is a Zod enum of the keys, so an
unknown key is a `422` with `validationErrors` before the service runs.

- `422 ROLE_PERMISSION_OWNER_ONLY` — an `ownerOnly` key. Named before the
  escalation check so the message says why, not just that.
- `403 ROLE_EXCEEDS_CALLER` — a key the caller does not hold.
- `409 ROLE_NAME_TAKEN` — collides with a custom role or a system role label.
- `422 ROLE_LIMIT_REACHED`.
- `201` → the role as in the list.

Cloning is a client concern: fetch a role, post its permissions.

### PATCH `/workspace/roles/:id`

Any of `name`, `description`, `permissions`. `permissions` **replaces** the
set — a partial edit of a set has no honest semantics over HTTP. Same errors
as create. Invalidates the role's permission cache after commit, so every
member of the role sees the change on their next request.

### DELETE `/workspace/roles/:id`

```jsonc
{ "reassignTo": { "systemRole": "AGENT" } } // required while anyone holds the role
```

One transaction: every member of the role — any status, since `LEFT` and
`REMOVED` rows still point at it — and every `PENDING` invitation move to
`reassignTo`; then the role is deleted and its grants cascade. After commit,
the role's cache key and every moved member's membership key are deleted.

- `422 ROLE_REASSIGN_REQUIRED` — holders exist and no `reassignTo`.
- `422 ROLE_NOT_ASSIGNABLE` — `reassignTo` is `OWNER` or the role itself.
- `403 ROLE_EXCEEDS_CALLER` — `reassignTo` exceeds the caller.
- `204`.

---

## Resolution

```
WorkspaceGuard   membership snapshot (cached per workspace+user): memberId, status, systemRole, customRoleId
PermissionGuard  WorkspaceGrantService.resolve(workspaceId, userId)
                   systemRole  → WORKSPACE_SYSTEM_ROLE_PERMISSIONS[role]            no read
                   customRole  → cache (workspace, roleId) → workspace_role_permissions → catalogue.narrow()
```

`narrow()` drops any key the running build does not define, so a grant left
by a rolled-back deploy authorizes nothing.

### Invalidation

| Event                                 | Deleted                                                  |
| ------------------------------------- | -------------------------------------------------------- |
| Custom role permissions edited        | the role key                                             |
| Custom role deleted with reassignment | the role key + each moved member's membership key        |
| Member's role changed                 | that member's membership key (`modules/workspaces`)      |
| Ownership transferred                 | both members' membership keys (`modules/workspaces`)     |
| Catalogue changed at deploy           | nothing — system sets are code, custom keys are narrowed |

---

## Seeding

`WorkspacePermissionSeeder`, key `workspace-permissions`, kind `REFERENCE`,
runs before `admins` in `SeedModule`. It upserts every catalogue entry by
`key` — name, description and `ownerOnly` follow the code — and never
deletes: a key present in the table but absent from the catalogue is reported
in `notes` for a human to migrate away. It depends on the repository and
`TransactionService` only, and is provided by `WorkspaceRolesSeedModule`
rather than the runtime module, because the runtime module's cache service
needs Redis and `SeedModule` does not import it.

---

## Errors

| Code                         | HTTP | When                                                         |
| ---------------------------- | ---- | ------------------------------------------------------------ |
| `PERMISSION_DENIED`          | 403  | The caller's role lacks the route's key (`core/permissions`) |
| `ROLE_NOT_FOUND`             | 404  | No such custom role in this workspace                        |
| `ROLE_NAME_TAKEN`            | 409  | Name in use, case-insensitive, including system labels       |
| `ROLE_LIMIT_REACHED`         | 422  | `MAX_CUSTOM_ROLES`                                           |
| `ROLE_PERMISSION_OWNER_ONLY` | 422  | Granting an `ownerOnly` key to a custom role                 |
| `ROLE_EXCEEDS_CALLER`        | 403  | Defining or assigning more than the caller holds             |
| `ROLE_REASSIGN_REQUIRED`     | 422  | Deleting a held role without `reassignTo`                    |
| `ROLE_NOT_ASSIGNABLE`        | 422  | `OWNER`, or the role being deleted, as a target              |

---

## Deliberately not here

| Area                                           | Arrives with                                                  |
| ---------------------------------------------- | ------------------------------------------------------------- |
| Member role assignment, invitation role        | `modules/workspaces` — it owns those rows                     |
| Data visibility scope (own / team / all leads) | An attribute on the role, with the CRM modules                |
| Audit trail of role changes                    | Audit log; an `info` log entry per change until then          |
| Several roles per member                       | ADR-004, Rejected                                             |
| Role templates by business type                | Onboarding, if `INDIVIDUAL_AGENT` and `DEVELOPER` ever differ |
