# Workspaces — API contract

The contract `modules/workspaces` implements: workspaces, their members, and
invitations. Written before the code; the schema is in `prisma/schema.prisma`
(`Workspace`, `WorkspaceMember`, `WorkspaceInvitation`) and its model comments
carry the reasons for each table's shape.

Roles and permissions are decided in `docs/adr/ADR-004-rbac-implementation.md`
and specified in `modules/workspace-roles/API.md`. This file names the
permission each route requires, and specifies the two role-bearing rows this
module owns: the role on a member and the role on an invitation.

---

## The model in one paragraph

A user is a global identity with zero or more workspaces. A workspace is the
tenant: every business row carries its id. Membership is one row per
`(workspace, user)` for life — it changes status, it is never deleted.
Ownership is a pointer on the workspace, `owner_user_id`, and the owner's
member row carries `system_role = OWNER`; the transfer updates both in one
transaction, and a partial unique index allows one `OWNER` row per workspace.
Registration does not create a workspace: a user who arrives by invitation
must not be left holding an empty one.

---

## Resolving the current workspace

Tenant routes take the workspace from the `x-workspace-id` header
(`WORKSPACE_ID_HEADER`), never from the token. A claim in the JWT was
rejected: switching would need a new token, two tabs could not hold two
workspaces, and a removed member would keep access until the token expired.

The header is never trusted. `WorkspaceGuard` (`core/tenancy`, registered after
`ApiAuthGuard`) resolves it on every request:

1. header present — else `400 WORKSPACE_REQUIRED`; malformed — `422`
2. a membership `(workspace, user)` exists and is neither `LEFT` nor
   `REMOVED` — else `404 WORKSPACE_NOT_FOUND`: a non-member and a former
   member learn nothing about whether the workspace exists
3. the membership is `ACTIVE` — else `403 MEMBERSHIP_SUSPENDED`
4. the workspace is `ACTIVE` — else `403` with the reason
   (`WORKSPACE_PENDING_APPROVAL`, `WORKSPACE_REJECTED`, `WORKSPACE_SUSPENDED`,
   `WORKSPACE_ARCHIVED`): a member knows the workspace exists and needs to
   know why it stopped working
5. sets `workspaceId` and `memberId` in the request context — from here
   `CacheService.key()`, the logger and dispatched jobs all see the tenant

Two cache entries, because they change apart: the workspace's status, one
key shared by every member, and the membership — `memberId`, `status`,
`systemRole`, `customRoleId` — one key per `(workspace, user)`. Both are
**invalidated explicitly** by every status or role change, so removal locks a
member out on their next request rather than when a TTL expires. The
membership entry carries the role so that `PermissionGuard`, which runs next,
resolves permissions without another read — see `modules/workspace-roles/API.md`.

`core/tenancy` cannot import this module, so it declares a
`WorkspaceAccessResolver` port; this module provides it with `useExisting`
and `AppModule` wires them — the `UserSessionValidator` pattern.

**Required by default.** A user-audience route needs a workspace unless it is
marked `@NoWorkspace()` (or `@Public()`). A forgotten marker fails the first
call with a visible 400; the opposite default would let a tenant route run
with no tenant. Admin routes never read the header — an admin addresses a
workspace by path.

**Then authorized, by default.** Every tenant route carries
`@RequirePermission(key)` or `@AnyMember()`; every admin route
`@RequireAdminPermission(key)` or `@AnyAdmin()`. A route with neither does not
start the process (`RouteAuthorizationAudit`). A caller whose role lacks the
key gets `403 PERMISSION_DENIED`.

---

## Conventions

- Base path `/v1`. Responses use the standard envelope; lists return
  `data: { items, pagination }` with offset pagination.
- Validation failures are `422`. Ids in paths go through `ParseIdPipe`.
- Emails in bodies use `lookupEmailSchema` for invitations (the invitee may
  be an existing user on a since-blocklisted domain) and are stored lowercase.
- Slugs are lowercased by the schema: `^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$`,
  with a reserved list (`admin`, `api`, `app`, `www`, …) in `constants/`.

---

## Routes

Marker legend: **P** `@Public()` · **N** `@NoWorkspace()` · **M**
`@AnyMember()` · **A** `@AnyAdmin()` · a key is `@RequirePermission(key)` on a
tenant route and `@RequireAdminPermission(key)` on an admin one. Every tenant
route needs `x-workspace-id`.

| Method | Path                                    | Marker                        | Purpose                          |
| ------ | --------------------------------------- | ----------------------------- | -------------------------------- |
| POST   | `/workspaces`                           | N                             | Create a workspace               |
| GET    | `/users/me/workspaces`                  | N                             | Switcher: my workspaces          |
| GET    | `/workspace`                            | M                             | Current workspace, full view     |
| PATCH  | `/workspace`                            | `workspace.update`            | Update settings                  |
| POST   | `/workspace/archive`                    | `workspace.archive`           | Archive — owner only             |
| POST   | `/workspace/ownership-transfer`         | `workspace.transferOwnership` | Transfer ownership — owner only  |
| GET    | `/workspace/members`                    | `member.read`                 | List members                     |
| GET    | `/workspace/members/:id`                | `member.read`                 | One member                       |
| PATCH  | `/workspace/members/:id`                | `member.update`               | Job title, suspend / reactivate  |
| PATCH  | `/workspace/members/:id/role`           | `member.changeRole`           | Assign a role                    |
| DELETE | `/workspace/members/:id`                | `member.remove`               | Remove a member                  |
| POST   | `/workspace/leave`                      | M                             | Leave                            |
| POST   | `/workspace/invitations`                | `invitation.create`           | Invite (or resend)               |
| GET    | `/workspace/invitations`                | `invitation.read`             | List invitations                 |
| DELETE | `/workspace/invitations/:id`            | `invitation.revoke`           | Revoke                           |
| GET    | `/users/me/invitations`                 | N                             | Pending invitations for me       |
| GET    | `/workspace-invitations/preview?token=` | P                             | What a link is for, before login |
| POST   | `/workspace-invitations/accept`         | N                             | Accept                           |
| POST   | `/workspace-invitations/:id/decline`    | N                             | Decline                          |
| GET    | `/admin/workspaces`                     | `workspace.read` (admin)      | Platform list                    |
| GET    | `/admin/workspaces/:id`                 | `workspace.read` (admin)      | Platform view                    |
| POST   | `/admin/workspaces/:id/approve`         | `workspace.review` (admin)    | Approve a pending workspace      |
| POST   | `/admin/workspaces/:id/reject`          | `workspace.review` (admin)    | Reject a pending workspace       |
| POST   | `/admin/workspaces/:id/suspend`         | `workspace.suspend` (admin)   | Suspend                          |
| POST   | `/admin/workspaces/:id/reactivate`      | `workspace.suspend` (admin)   | Lift a suspension                |

`/workspace` is singular because the header has already said which one.
"Owner only" is not a guard: the two keys are `ownerOnly` in the catalogue, so
only the `OWNER` system role holds them and no custom role can be granted them.

---

### POST `/workspaces` — create

```jsonc
// request
{
  "name": "Skyline Realty", // 3–150
  "slug": "skyline-realty", // optional; derived from name when absent
  "businessType": "AGENCY", // WorkspaceBusinessType
  "countryCode": "IN",
  "timezone": "Asia/Kolkata", // IANA
  "currency": "INR", // ISO 4217
}
```

One transaction: insert the workspace with `owner_user_id = me`, insert my
membership `ACTIVE` with `system_role = OWNER`. Nothing else: system roles
have no rows, so there is nothing to seed per workspace. The deferred owner
foreign key is checked at commit, so the order inside is free.

- `201` → the same body as `GET /workspace`
- `409 WORKSPACE_SLUG_TAKEN` — an explicit slug in use. A derived slug never
  409s; it gets a short suffix.
- `422 WORKSPACE_LIMIT_REACHED` — the user already owns
  `MAX_OWNED_WORKSPACES` active workspaces (a constant, not config).

### GET `/users/me/workspaces` — switcher

My `ACTIVE` memberships in `ACTIVE` workspaces, ordered by
`last_accessed_at DESC NULLS LAST`. The client opens the first one. Not
paginated: the owned-workspace cap and invitation-only joining keep it small;
revisit if a user ever holds hundreds.

```jsonc
{
  "items": [
    {
      "id": "…",
      "name": "Skyline Realty",
      "slug": "skyline-realty",
      "logo": null, // or { "url", "thumbnailUrl" } — every logo on the page in one query
      "businessType": "AGENCY",
      "isOwner": true,
      "memberId": "…",
      "lastAccessedAt": "…",
    },
  ],
}
```

### GET `/workspace` — current, full view

The one call a client makes after choosing a workspace.

```jsonc
{
  "workspace": {
    "id": "…",
    "name": "…",
    "slug": "…",
    "logo": { "url": "https://cdn…/image.webp", "thumbnailUrl": "https://cdn…/thumbnail.webp" }, // or null
    "businessType": "AGENCY",
    "status": "ACTIVE",
    "countryCode": "IN",
    "timezone": "Asia/Kolkata",
    "currency": "INR",
    "onboardingCompletedAt": null,
    "createdAt": "…",
    "owner": { "userId": "…", "displayName": "…" },
  },
  "membership": {
    "id": "…",
    "status": "ACTIVE",
    "jobTitle": null,
    "joinedAt": "…",
    "isOwner": true,
    "role": { "kind": "system", "key": "OWNER", "name": "Owner" },
  },
  "permissions": ["workspace.update", "member.read", "…"],
  "counts": { "activeMembers": 4, "pendingInvitations": 1 },
  // Billing adds:  "subscription": { "plan": …, "status": …, "trialEndsAt": … },
  //                "limits": { "members": { "used": 4, "max": 10 } }
}
```

`permissions` is the caller's resolved set — the same set the guard checks —
and is what a client decides on: hide what is not in it, refetch on a `403`.
`role` is for display. In the OpenAPI document `permissions` is an enum of the
catalogue's keys, so a generated client gets a union type.

Touches `last_accessed_at`, throttled (at most once per
`MEMBER_ACCESS_TOUCH_INTERVAL`), so the switcher order is cheap to keep.

### PATCH `/workspace` — settings

Built so far: `logoFileId` only — a `WORKSPACE_LOGO` file the caller uploaded
to `/workspace/files` in this workspace. It replaces the logo and releases the
old file. Left out, the logo is unchanged; `null` is a `422`. An update never
removes the logo: that is `DELETE /workspace/logo`, also `workspace.update`.

Planned, on this same route: `name`, `slug`, `businessType`, `countryCode`,
`timezone`, `currency`; `onboardingCompleted: true` stamps
`onboarding_completed_at` once. `409 WORKSPACE_SLUG_TAKEN`.

### POST `/workspace/archive` — owner only

Sets `ARCHIVED` + `archived_at`; invalidates every membership cache entry for
the workspace. Pending invitations are revoked in the same transaction.
Restore and permanent deletion are later work, and deletion will be a batched
job — a single cascading delete across a tenant's leads is not a transaction
to run in a request.

### POST `/workspace/ownership-transfer` — owner only

```jsonc
{ "memberId": "…" }
```

Target must be an `ACTIVE` member other than me. One transaction: the target
becomes `system_role = OWNER` (whatever role they held is dropped), I become
`system_role = ADMIN`, then `owner_user_id` moves — in that order, because the
partial unique index allows one `OWNER` row at a time. After commit, both
membership cache keys are deleted. `422 MEMBER_NOT_ACTIVE`,
`422 ALREADY_OWNER`.

### GET `/workspace/members`

`offsetPaginationQuerySchema({ status, search, sortBy })` —
`status` defaults to `ACTIVE`; `search` matches display name or email;
`sortBy ∈ { joinedAt, displayName }`.

```jsonc
{ "items": [
  { "id": "…", "userId": "…", "displayName": "…", "email": "…",
    "avatarUrl": null, "jobTitle": null, "status": "ACTIVE",
    "isOwner": false,
    "role": { "kind": "custom", "id": "…", "name": "Senior Broker" },
    "joinedAt": "…", "lastAccessedAt": "…" }
], "pagination": { … } }
```

A `role` filter (`systemRole` or `customRoleId`) joins `status`, `search` and
`sortBy` when the role editor needs "who holds this role".

### PATCH `/workspace/members/:id`

```jsonc
{ "jobTitle": "Senior Broker", "status": "SUSPENDED" } // status: ACTIVE | SUSPENDED
```

The owner cannot be suspended, and nobody changes their own status.
Invalidates that member's access cache. `422 CANNOT_MODIFY_OWNER`,
`422 CANNOT_MODIFY_SELF`, `404 MEMBER_NOT_FOUND`. The role is not here: it is
a different permission and a different route.

### PATCH `/workspace/members/:id/role`

```jsonc
{ "role": { "systemRole": "MANAGER" } } // or { "customRoleId": "…" }
```

The owner's role is not changed here (`422 CANNOT_MODIFY_OWNER` — transfer
ownership instead), nobody changes their own (`422 CANNOT_MODIFY_SELF`), and
`OWNER` is never a target (`422 ROLE_NOT_ASSIGNABLE`). The role must be
within the caller's own permissions (`403 ROLE_EXCEEDS_CALLER`), so a Manager
cannot promote anyone to Admin. A custom role id from another workspace is
`404 ROLE_NOT_FOUND`. Invalidates that member's membership cache after
commit; their next request runs with the new role. `200` → the member as in
the list.

### DELETE `/workspace/members/:id` — remove

Status `REMOVED`, `ended_at = now()`, cache invalidated. The row stays: the
member's leads, tasks and timeline still point at it. Reassigning their open
leads is a CRM-phase concern. `422 CANNOT_MODIFY_OWNER`, `422 CANNOT_MODIFY_SELF`
(use leave). `204`.

### POST `/workspace/leave`

Status `LEFT`. `422 OWNER_CANNOT_LEAVE` — transfer first. `204`.

### POST `/workspace/invitations` — invite or resend

```jsonc
{ "email": "priya@example.com", "role": { "systemRole": "AGENT" } }
```

`role` is optional and defaults to `{ "systemRole": "AGENT" }`. It follows
the rules of `PATCH /workspace/members/:id/role`: never `OWNER`, within the
inviter's own permissions, a custom role of this workspace. A resend keeps the
role the invitation already has.

- The address belongs to an `ACTIVE` or `SUSPENDED` member → `409 ALREADY_MEMBER`.
  A `LEFT` or `REMOVED` member may be invited back.
- A `PENDING` invitation for the address exists → **resend**: new token,
  `send_count + 1`, `last_sent_at` and `expires_at` reset. The old link stops
  working. `200`.
- Otherwise a new invitation, `201`. `INVITATION_TTL` is 7 days.

In the same transaction, `EmailService.send` with template
`workspace.invitation` (group `WORKSPACE`), job id
`workspace-invitation-<id>-<sendCount>` — derived, so a retried send
deduplicates while a resend does not — and `expiresAt` = the invitation's,
because the link is a credential. The raw token exists only in the email.

Rate limited per workspace (`INVITATION_DAILY_LIMIT`) and per invitation
(`INVITATION_RESEND_COOLDOWN`). [Billing: pending invitations count against
the seat limit here.]

```jsonc
{
  "id": "…",
  "email": "priya@example.com",
  "status": "PENDING",
  "role": { "kind": "system", "key": "AGENT", "name": "Agent" },
  "invitedBy": { "userId": "…", "displayName": "…" },
  "sendCount": 1,
  "lastSentAt": "…",
  "expiresAt": "…",
  "createdAt": "…",
}
```

### GET `/workspace/invitations`

`offsetPaginationQuerySchema({ status })`, `status` defaulting to `PENDING`.
A `PENDING` row past `expires_at` is reported as `EXPIRED`.

### DELETE `/workspace/invitations/:id` — revoke

`PENDING` → `REVOKED`, `resolved_at`. Anything else → `409 INVITATION_NOT_PENDING`.
`204`.

### GET `/users/me/invitations` — pending for me

Invitations `PENDING`, unexpired, whose email equals one of my **verified**
email identities, in `ACTIVE` workspaces. Each shows the workspace name and
logo and the inviter. This is how a user who registered without clicking the
link still finds their invitation.

### GET `/workspace-invitations/preview?token=` — public

Lets the client render "Priya, you are invited to Skyline Realty" before
login or signup.

```jsonc
{
  "workspace": { "name": "…", "logo": null },
  "invitedBy": { "displayName": "…" },
  "email": "p****@example.com", // masked
  "status": "PENDING",
  "expiresAt": "…",
}
```

An unknown token and an expired one both answer `404 INVITATION_NOT_FOUND` —
the preview does not confirm that a token ever existed. Rate limited by IP.

### POST `/workspace-invitations/accept`

```jsonc
{ "token": "…" }          // from the email link
// or
{ "invitationId": "…" }   // from /users/me/invitations
```

Both forms require that one of my **verified** email identities equals the
invitation's email; `403 INVITATION_EMAIL_MISMATCH` otherwise. There is no
"accept with a different account": an invitation names a person, and a
forwarded link must not admit whoever holds it. The id form needs no token
because the verified identity is the same proof of mailbox ownership.

One transaction:

1. `UPDATE … SET status = 'ACCEPTED' WHERE id = ? AND status = 'PENDING' AND expires_at > now()` —
   zero rows means someone else resolved it: re-read and answer accordingly.
2. membership upsert: none → insert `ACTIVE`; `LEFT` / `REMOVED` → back to
   `ACTIVE`, `ended_at` cleared, `joined_at` reset; `SUSPENDED` →
   `409 MEMBER_SUSPENDED`; `ACTIVE` → nothing to do.
3. the member row takes the invitation's role — on a rejoin as well, so the
   role a former member held is replaced by the one they were invited back
   with.

Idempotent: accepting an invitation I already accepted returns `200` with the
workspace. Workspace not `ACTIVE` → `422 WORKSPACE_NOT_ACTIVE`.

```jsonc
{ "workspace": { "id": "…", "name": "…", "slug": "…" }, "memberId": "…" }
```

### POST `/workspace-invitations/:id/decline`

Same email rule as accept. `PENDING` → `DECLINED`. `204`.

### Admin routes

Under `admin/`, so the admin audience by path. List and view any workspace
(with owner and member count): `ADMIN_PERMISSION.workspace.read`. Approve or
reject a pending one: `workspace.review`. Suspend and reactivate:
`workspace.suspend`, which arrives with those routes. Suspension sets
`SUSPENDED` + `suspended_at` and deletes the workspace's one status cache key,
so its members are locked out on their next request.

---

## Errors

| Code                         | HTTP | When                                                |
| ---------------------------- | ---- | --------------------------------------------------- |
| `WORKSPACE_REQUIRED`         | 400  | Tenant route without `x-workspace-id`               |
| `WORKSPACE_NOT_FOUND`        | 404  | Not a member, a former member, or no such workspace |
| `MEMBERSHIP_SUSPENDED`       | 403  | A member whose membership is `SUSPENDED`            |
| `WORKSPACE_PENDING_APPROVAL` | 403  | A member of a workspace not yet reviewed            |
| `WORKSPACE_REJECTED`         | 403  | A member of a rejected workspace                    |
| `WORKSPACE_SUSPENDED`        | 403  | A member of a suspended workspace                   |
| `WORKSPACE_ARCHIVED`         | 403  | A member of an archived workspace                   |
| `PERMISSION_DENIED`          | 403  | The caller's role lacks the route's key             |
| `ROLE_EXCEEDS_CALLER`        | 403  | Assigning a role with more than the caller holds    |
| `ROLE_NOT_ASSIGNABLE`        | 422  | `OWNER` as a target                                 |
| `ROLE_NOT_FOUND`             | 404  | Custom role id not of this workspace                |
| `WORKSPACE_SLUG_TAKEN`       | 409  | Explicit slug in use                                |
| `WORKSPACE_LIMIT_REACHED`    | 422  | Owned-workspace cap                                 |
| `WORKSPACE_NOT_ACTIVE`       | 422  | Accepting into a suspended or archived workspace    |
| `MEMBER_NOT_FOUND`           | 404  | No such member in this workspace                    |
| `MEMBER_NOT_ACTIVE`          | 422  | Transfer target not active                          |
| `MEMBER_SUSPENDED`           | 409  | Accepting while suspended in that workspace         |
| `ALREADY_MEMBER`             | 409  | Inviting an active or suspended member              |
| `ALREADY_OWNER`              | 422  | Transferring to the current owner                   |
| `OWNER_CANNOT_LEAVE`         | 422  | Owner leaving without transferring                  |
| `CANNOT_MODIFY_OWNER`        | 422  | Suspending or removing the owner                    |
| `CANNOT_MODIFY_SELF`         | 422  | Suspending or removing yourself                     |
| `INVITATION_NOT_FOUND`       | 404  | Unknown, expired, or other workspace's invitation   |
| `INVITATION_NOT_PENDING`     | 409  | Revoking a resolved invitation                      |
| `INVITATION_EMAIL_MISMATCH`  | 403  | Accept/decline without a matching verified email    |

---

## Rules that live outside this module

- **Account deletion.** A user who owns a workspace with other active members
  cannot delete their account — they transfer first. A workspace they own
  alone is archived with the account.
- **Every future tenant table** has `workspace_id NOT NULL`, indexes that lead
  with it, and references members as `(workspace_id, member_id)` →
  `workspace_members (workspace_id, id)`, so the database refuses a row that
  crosses tenants.
- **No soft delete.** Workspaces, members and invitations have no
  `deleted_at`; their status is their lifecycle, and `ARCHIVED` is what a
  deleted workspace looks like until the deletion flow exists.
- **Every tenant row that names a role** does so as
  `(workspace_id, custom_role_id)` → `workspace_roles (workspace_id, id)`, for
  the same reason as member references.

---

## Deliberately not here

| Area                                              | Arrives with                                                    |
| ------------------------------------------------- | --------------------------------------------------------------- |
| The permission catalogue, custom roles, their API | `modules/workspace-roles/API.md`                                |
| Teams / branches and lead visibility scopes       | An attribute on the role, with the CRM modules (ADR-004)        |
| Plans, subscriptions, seat and feature limits     | Billing — own tables, never a column on `workspaces`            |
| Membership audit trail                            | Audit log                                                       |
| Developer ↔ channel-partner collaboration         | A link between two workspaces, never cross-workspace membership |
| Restore and permanent deletion of a workspace     | Workspace deletion flow (batched job)                           |
