# Organization Memberships

Status: Approved ✅

---

# Purpose

Represents the relationship between a User and an Organization.

A membership determines:

- Which organization the user belongs to.
- Which role the user has.
- Whether the user can access the organization.
- When the user joined.
- Who invited the user.

A user may belong to multiple organizations.

An organization may contain multiple members.

---

# Business Rules

- Every membership belongs to exactly one Organization.
- Every membership belongs to exactly one User.
- Every membership has exactly one Role.
- A user can belong to multiple organizations.
- An organization can contain multiple members.
- A user cannot have duplicate memberships within the same organization.
- Invitations create memberships only after acceptance.
- Membership removal never deletes the user account.
- Every organization must always have at least one active Owner.
- Membership controls organization access.

---

# Membership Lifecycle

Invitation Accepted

↓

ACTIVE

↓

SUSPENDED

↓

ACTIVE

↓

LEFT

or

↓

REMOVED

---

# Membership Status

ACTIVE

Member can access the organization.

---

SUSPENDED

Membership temporarily disabled.

User cannot access the organization.

---

LEFT

Member voluntarily left the organization.

---

REMOVED

Membership removed by an administrator.

---

# Columns

| Column          | Type             | Required | Description                            |
| --------------- | ---------------- | -------- | -------------------------------------- |
| id              | UUID v7          | ✅       | Primary Key                            |
| organization_id | UUID v7          | ✅       | Reference to Organization              |
| user_id         | UUID v7          | ✅       | Reference to User                      |
| role_id         | UUID v7          | ✅       | Assigned Organization Role             |
| status          | MembershipStatus | ✅       | Current membership status              |
| invited_by      | UUID v7          | ❌       | User who invited this member           |
| joined_at       | timestamptz      | ❌       | When invitation was accepted           |
| last_active_at  | timestamptz      | ❌       | Last activity inside this organization |
| created_at      | timestamptz      | ✅       | Creation timestamp                     |
| updated_at      | timestamptz      | ✅       | Last update timestamp                  |
| deleted_at      | timestamptz      | ❌       | Soft delete timestamp                  |

---

# Relationships

## Belongs To

- Organization
- User
- Organization Role

## Referenced By

- Organization Invitations (after acceptance)
- Audit Logs (Future)
- Activity Logs (Future)

---

# Constraints

A user can only be a member of an organization once.

```text
UNIQUE (organization_id, user_id)
```

The assigned role must belong to the same organization.

The last active Owner cannot leave or be removed until another active Owner exists.

---

# Indexes

| Index | Columns                    | Type    | Reason                        |
| ----- | -------------------------- | ------- | ----------------------------- |
| PK    | id                         | Primary | Primary Key                   |
| UK    | (organization_id, user_id) | Unique  | Prevent duplicate memberships |
| IDX   | organization_id            | Index   | Organization members          |
| IDX   | user_id                    | Index   | User organizations            |
| IDX   | role_id                    | Index   | Members by role               |
| IDX   | status                     | Index   | Membership filtering          |

---

# Access Resolution

```text
Request
    │
    ▼
Authenticate User
    │
    ▼
Read Organization ID
(Header)
    │
    ▼
Find Membership
    │
    ▼
Membership Active?
    │
    ▼
Load Role
    │
    ▼
Load Permissions
    │
    ▼
Authorize Request
```

---

# Ownership

Organization

---

# Future Scope

- Membership Notes
- Department Assignment
- Team Assignment
- Job Title
- Member Preferences
- Temporary Role Assignment
- Membership Audit History

---

# Status

Approved ✅

Frozen ✅
