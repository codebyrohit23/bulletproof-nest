# Admin roles — API contract

The contract `modules/admin-roles` implements: the admin permission catalogue a
role editor shows, the roles the platform team defines, and which roles each
admin holds. Written before the code; the model and the reasons for it are in
`CLAUDE.md`, "Permissions".

Assigning roles to an admin, and the super-admin flag, are routes of
`modules/admins` (Phase 5), which call this module to write the assignment.

---

## The model in one paragraph

The same shape as workspace roles, without a tenant and without default roles.
A permission is a key in the admin catalogue, mirrored into
`admin_permissions`. Every admin role is defined by the platform team and
starts empty. An admin holds any number of roles and has their union. A super
admin — `admins.is_super_admin` — holds no role and every permission,
restricted ones included.

---

## What this module owns

| Owns                                                         | Does not own                                             |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| `admin_permissions`, `admin_roles`, `admin_role_permissions` | `admins`, status and `is_super_admin` — `modules/admins` |
| `admin_user_roles` — which roles an admin holds              | the admin subject snapshot                               |
| the `admin-role-grants` and `admin-user-roles` caches        |                                                          |

`admin_user_roles` is here for the reason `workspace_member_roles` is in
`modules/workspace-roles`: deleting a role must clear its holders' cached
roles, and this module cannot import `modules/admins`, which imports it.

---

## The catalogue today

| Key                 | Restricted | Name               |
| ------------------- | ---------- | ------------------ |
| `workspace.read`    |            | View workspaces    |
| `workspace.review`  |            | Review workspaces  |
| `admin.read`        |            | View admins        |
| `admin.create`      | yes        | Create admins      |
| `admin.update`      |            | Update admins      |
| `admin.assignRoles` | yes        | Assign admin roles |
| `role.read`         |            | View admin roles   |
| `role.manage`       | yes        | Manage admin roles |

The restricted keys are the ones that would let a role widen itself — creating
admins, assigning roles, defining them — so only a super admin holds them.
Because `role.manage` is restricted, only a super admin reaches the write
routes below, and the no-escalation check is satisfied by construction; the
service still runs it, for the day `role.manage` stops being restricted.

---

## Rules

- **Restricted keys are never granted to a role.** `422`.
- **No escalation.** Every key a role grants must be one the caller holds.
  `403`.
- **A role beyond the caller is read-only to them** — no rename, edit or
  delete. `403`. Satisfied by construction while `role.manage` is restricted.
- **Names are unique, case-insensitive.** `UNIQUE (lower(name))`. `409`.
- **`MAX_ADMIN_ROLES` is 50**, a constant. `422`.

Errors follow the API's envelope: `error.code` from the status, `message` from
`constants/`.

---

## Routes

Admin routes: base path `/v1`, mounted under `admin/`.

| Method | Path                 | Marker        | Purpose                               |
| ------ | -------------------- | ------------- | ------------------------------------- |
| GET    | `/admin/permissions` | `@AnyAdmin()` | The catalogue, for a role editor      |
| GET    | `/admin/roles`       | `role.read`   | Every admin role                      |
| GET    | `/admin/roles/:id`   | `role.read`   | One role                              |
| POST   | `/admin/roles`       | `role.manage` | Create a role — super admin only      |
| PATCH  | `/admin/roles/:id`   | `role.manage` | Rename, describe, replace permissions |
| DELETE | `/admin/roles/:id`   | `role.manage` | Delete a role and its assignments     |

### GET `/admin/permissions`

The workspace catalogue route's shape, from the admin catalogue.

```jsonc
{
  "items": [
    {
      "key": "workspace.review",
      "resource": "workspace",
      "action": "review",
      "name": "Review workspaces",
      "description": "Approve or reject a workspace awaiting review.",
      "restricted": false,
    },
  ],
}
```

### GET `/admin/roles`

By name. Not paginated: at most `MAX_ADMIN_ROLES`.

```jsonc
{
  "items": [
    {
      "id": "…",
      "name": "Reviewer",
      "description": "Reviews new workspaces.",
      "permissions": ["workspace.read", "workspace.review"],
      "adminCount": 2,
      "createdAt": "…",
      "updatedAt": "…",
    },
  ],
}
```

`adminCount` counts admins who hold the role and are not deleted.

### GET `/admin/roles/:id`

One role, the list's item shape. `404` when absent.

### POST `/admin/roles`

```jsonc
{
  "name": "Reviewer", // 2–100, trimmed
  "description": "Reviews new workspaces.", // optional, ≤ 500
  "permissions": ["workspace.read", "workspace.review"], // catalogue keys, no duplicates; may be empty
}
```

Unknown key → `422` from the schema. Then: restricted key → `422`; key the
caller does not hold → `403`; name in use → `409`; limit → `422`. `201` → the
role.

### PATCH `/admin/roles/:id`

Any of `name`, `description`, `permissions`; at least one; `permissions`
replaces the set. `403` if the role as it stands has a key the caller lacks,
then the create checks. After commit the role's `admin-role-grants` key
is deleted. `200` → the role.

### DELETE `/admin/roles/:id`

No body. `403` if the role has a key the caller lacks. One transaction: the role is removed from every holder — their other
roles stay — then deleted with its grants. After commit, the role's grants key
and each holder's `admin-user-roles` key are deleted. `200`, `data: null` and a
message — the API's convention for a delete.

---

## Caches

| Key                          | Value           | TTL   | Deleted when                                          |
| ---------------------------- | --------------- | ----- | ----------------------------------------------------- |
| `admin-role-grants:<roleId>` | the role's keys | 5 min | its permissions change, it is deleted                 |
| `admin-user-roles:<adminId>` | role ids        | 1 min | the admin's roles change, a role they hold is deleted |

`admin-grant-subject:<adminId>` in `modules/admins` keeps status and
`is_super_admin` only; the role ids move here.

---

## Seeding

`admin-permissions` mirrors the admin catalogue into `admin_permissions`,
reporting — never deleting — keys the catalogue no longer has. `REFERENCE`,
every deploy, in `AdminRolesSeedModule`. No admin role is seeded: the team
defines its own, and the first admin is a super admin.

---

## Deliberately not here

| Area                             | Arrives with                                |
| -------------------------------- | ------------------------------------------- |
| Assigning roles to an admin      | Phase 5, routes in `modules/admins`         |
| Granting or revoking super admin | Phase 5; never the last active super admin  |
| Suspending an admin              | Phase 5, revoking their sessions as it does |
| Audit trail of role changes      | Audit log; an `info` log entry until then   |
