# Workspaces — API contract

The contract `modules/workspaces` implements: workspaces, their members, and
invitations. Written before the code; the schema is in `prisma/schema.prisma`
(`Workspace`, `WorkspaceMember`, `WorkspaceInvitation`) and its model comments
carry the reasons for each table's shape.

Roles and permissions are **not** part of this contract. Where RBAC plugs in,
the text says so; until then every active member may call every workspace
route, and the owner-only routes check `workspaces.owner_user_id`.

---

## The model in one paragraph

A user is a global identity with zero or more workspaces. A workspace is the
tenant: every business row carries its id. Membership is one row per
`(workspace, user)` for life — it changes status, it is never deleted.
Ownership is a pointer on the workspace, not a role, so a workspace has
exactly one owner by construction. Registration does not create a workspace:
a user who arrives by invitation must not be left holding an empty one.

---

## Resolving the current workspace

Tenant routes take the workspace from the `x-workspace-id` header
(`WORKSPACE_ID_HEADER`), never from the token. A claim in the JWT was
rejected: switching would need a new token, two tabs could not hold two
workspaces, and a removed member would keep access until the token expired.

The header is never trusted. `WorkspaceGuard` (`core/tenancy`, registered after
`ApiAuthGuard`) resolves it on every request:

1. header present and a valid id — else `400 WORKSPACE_REQUIRED`
2. membership `(workspace, user)` exists and is `ACTIVE`, and the workspace is
   `ACTIVE` — else `404 WORKSPACE_NOT_FOUND` (a non-member learns nothing about
   whether the workspace exists)
3. sets `workspaceId` and `memberId` in the request context — from here
   `CacheService.tenantKey()`, tenant rate limits, the logger and dispatched
   jobs all see the tenant

The lookup is cached per `(workspace, user)` through `CacheService` with a
short TTL, and **invalidated explicitly** by every membership or workspace
status change, so removal locks a member out immediately rather than after
the TTL.

`core/tenancy` cannot import this module, so it declares a
`WorkspaceAccessResolver` port; this module provides it with `useExisting`
and `AppModule` wires them — the `UserSessionValidator` pattern.

**Required by default.** A user-audience route needs a workspace unless it is
marked `@NoWorkspace()` (or `@Public()`). A forgotten marker fails the first
call with a visible 400; the opposite default would let a tenant route run
with no tenant. Admin routes never read the header — an admin addresses a
workspace by path.

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

Marker legend: **P** `@Public()` · **N** `@NoWorkspace()` · **W** needs
`x-workspace-id` · **O** owner only.

| Method | Path                                    | Marker | Purpose                          |
| ------ | --------------------------------------- | ------ | -------------------------------- |
| POST   | `/workspaces`                           | N      | Create a workspace               |
| GET    | `/users/me/workspaces`                  | N      | Switcher: my workspaces          |
| GET    | `/workspace`                            | W      | Current workspace, full view     |
| PATCH  | `/workspace`                            | W      | Update settings                  |
| POST   | `/workspace/archive`                    | W O    | Archive                          |
| POST   | `/workspace/ownership-transfer`         | W O    | Transfer ownership               |
| GET    | `/workspace/members`                    | W      | List members                     |
| GET    | `/workspace/members/:id`                | W      | One member                       |
| PATCH  | `/workspace/members/:id`                | W      | Job title, suspend / reactivate  |
| DELETE | `/workspace/members/:id`                | W      | Remove a member                  |
| POST   | `/workspace/leave`                      | W      | Leave                            |
| POST   | `/workspace/invitations`                | W      | Invite (or resend)               |
| GET    | `/workspace/invitations`                | W      | List invitations                 |
| DELETE | `/workspace/invitations/:id`            | W      | Revoke                           |
| GET    | `/users/me/invitations`                 | N      | Pending invitations for me       |
| GET    | `/workspace-invitations/preview?token=` | P      | What a link is for, before login |
| POST   | `/workspace-invitations/accept`         | N      | Accept                           |
| POST   | `/workspace-invitations/:id/decline`    | N      | Decline                          |
| GET    | `/admin/workspaces`                     | admin  | Platform list                    |
| GET    | `/admin/workspaces/:id`                 | admin  | Platform view                    |
| POST   | `/admin/workspaces/:id/suspend`         | admin  | Suspend                          |
| POST   | `/admin/workspaces/:id/reactivate`      | admin  | Lift a suspension                |

`/workspace` is singular because the header has already said which one.

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
membership `ACTIVE`, [RBAC: seed the default roles and give me Owner]. The
deferred owner foreign key is checked at commit, so the order inside is free.

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
      "logoUrl": null,
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
    "logoUrl": null,
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
  },
  "counts": { "activeMembers": 4, "pendingInvitations": 1 },
  // RBAC adds:     "roles": […], "permissions": […]
  // Billing adds:  "subscription": { "plan": …, "status": …, "trialEndsAt": … },
  //                "limits": { "members": { "used": 4, "max": 10 } }
}
```

Touches `last_accessed_at`, throttled (at most once per
`MEMBER_ACCESS_TOUCH_INTERVAL`), so the switcher order is cheap to keep.

### PATCH `/workspace` — settings

Any of `name`, `slug`, `logoFileId`, `businessType`, `countryCode`, `timezone`,
`currency`; `onboardingCompleted: true` stamps `onboarding_completed_at` once.
[RBAC: `workspace.settings.update`.] `409 WORKSPACE_SLUG_TAKEN`.

### POST `/workspace/archive` — owner

Sets `ARCHIVED` + `archived_at`; invalidates every membership cache entry for
the workspace. Pending invitations are revoked in the same transaction.
Restore and permanent deletion are later work, and deletion will be a batched
job — a single cascading delete across a tenant's leads is not a transaction
to run in a request.

### POST `/workspace/ownership-transfer` — owner

```jsonc
{ "memberId": "…" }
```

Target must be an `ACTIVE` member other than me. Updates `owner_user_id`;
[RBAC: moves the Owner role]. The previous owner stays a member.
`422 MEMBER_NOT_ACTIVE`, `422 ALREADY_OWNER`.

### GET `/workspace/members`

`offsetPaginationQuerySchema({ status, search, sortBy })` —
`status` defaults to `ACTIVE`; `search` matches display name or email;
`sortBy ∈ { joinedAt, displayName }`.

```jsonc
{ "items": [
  { "id": "…", "userId": "…", "displayName": "…", "email": "…",
    "avatarUrl": null, "jobTitle": null, "status": "ACTIVE",
    "isOwner": false, "joinedAt": "…", "lastAccessedAt": "…" }
], "pagination": { … } }
```

### PATCH `/workspace/members/:id`

```jsonc
{ "jobTitle": "Senior Broker", "status": "SUSPENDED" } // status: ACTIVE | SUSPENDED
```

The owner cannot be suspended, and nobody changes their own status.
Invalidates that member's access cache. `422 CANNOT_MODIFY_OWNER`,
`422 CANNOT_MODIFY_SELF`, `404 MEMBER_NOT_FOUND`.

### DELETE `/workspace/members/:id` — remove

Status `REMOVED`, `ended_at = now()`, cache invalidated. The row stays: the
member's leads, tasks and timeline still point at it. Reassigning their open
leads is a CRM-phase concern. `422 CANNOT_MODIFY_OWNER`, `422 CANNOT_MODIFY_SELF`
(use leave). `204`.

### POST `/workspace/leave`

Status `LEFT`. `422 OWNER_CANNOT_LEAVE` — transfer first. `204`.

### POST `/workspace/invitations` — invite or resend

```jsonc
{ "email": "priya@example.com" }
// RBAC adds: "roleId": "…"
```

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
  "workspace": { "name": "…", "logoUrl": null },
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
3. [RBAC: assign the invitation's role.]

Idempotent: accepting an invitation I already accepted returns `200` with the
workspace. Workspace not `ACTIVE` → `422 WORKSPACE_NOT_ACTIVE`.

```jsonc
{ "workspace": { "id": "…", "name": "…", "slug": "…" }, "memberId": "…" }
```

### POST `/workspace-invitations/:id/decline`

Same email rule as accept. `PENDING` → `DECLINED`. `204`.

### Admin routes

Under `admin/`, so the admin audience by path. List and view any workspace
(with owner and member count); suspend and reactivate. Suspension sets
`SUSPENDED` + `suspended_at` and invalidates every membership cache entry for
the workspace, so its members are locked out on their next request.
[Admin permissions arrive with admin RBAC.]

---

## Errors

| Code                        | HTTP | When                                                        |
| --------------------------- | ---- | ----------------------------------------------------------- |
| `WORKSPACE_REQUIRED`        | 400  | Tenant route without `x-workspace-id`                       |
| `WORKSPACE_NOT_FOUND`       | 404  | Not a member, not active, or no such workspace — one answer |
| `WORKSPACE_SLUG_TAKEN`      | 409  | Explicit slug in use                                        |
| `WORKSPACE_LIMIT_REACHED`   | 422  | Owned-workspace cap                                         |
| `WORKSPACE_NOT_ACTIVE`      | 422  | Accepting into a suspended or archived workspace            |
| `NOT_WORKSPACE_OWNER`       | 403  | Owner-only route                                            |
| `MEMBER_NOT_FOUND`          | 404  | No such member in this workspace                            |
| `MEMBER_NOT_ACTIVE`         | 422  | Transfer target not active                                  |
| `MEMBER_SUSPENDED`          | 409  | Accepting while suspended in that workspace                 |
| `ALREADY_MEMBER`            | 409  | Inviting an active or suspended member                      |
| `ALREADY_OWNER`             | 422  | Transferring to the current owner                           |
| `OWNER_CANNOT_LEAVE`        | 422  | Owner leaving without transferring                          |
| `CANNOT_MODIFY_OWNER`       | 422  | Suspending or removing the owner                            |
| `CANNOT_MODIFY_SELF`        | 422  | Suspending or removing yourself                             |
| `INVITATION_NOT_FOUND`      | 404  | Unknown, expired, or other workspace's invitation           |
| `INVITATION_NOT_PENDING`    | 409  | Revoking a resolved invitation                              |
| `INVITATION_EMAIL_MISMATCH` | 403  | Accept/decline without a matching verified email            |

---

## Rules that live outside this module

- **Account deletion.** A user who owns a workspace with other active members
  cannot delete their account — they transfer first. A workspace they own
  alone is archived with the account.
- **Every future tenant table** has `workspace_id NOT NULL`, indexes that lead
  with it, and references members as `(workspace_id, member_id)` →
  `workspace_members (workspace_id, id)`, so the database refuses a row that
  crosses tenants.
- **Soft delete.** `Workspace` has `deleted_at`; add it to
  `SOFT_DELETABLE_MODELS` when this module lands. Members and invitations have
  no `deleted_at` — their status is their lifecycle.

---

## Deliberately not here

| Area                                                | Arrives with                                                    |
| --------------------------------------------------- | --------------------------------------------------------------- |
| Roles on members and invitations, permission checks | RBAC (`core/permissions`)                                       |
| Teams / branches and lead visibility scopes         | RBAC scope design                                               |
| Plans, subscriptions, seat and feature limits       | Billing — own tables, never a column on `workspaces`            |
| Membership audit trail                              | Audit log                                                       |
| Developer ↔ channel-partner collaboration           | A link between two workspaces, never cross-workspace membership |
| Restore and permanent deletion of a workspace       | Workspace deletion flow (batched job)                           |
