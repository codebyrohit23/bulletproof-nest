# Organization Roles

Status: Approved ✅

---

# Purpose

Organization Roles define a collection of permissions that can be assigned to organization members.

Roles are organization-specific.

Each member belongs to exactly one role.

Permissions are inherited through the assigned role.

---

# Business Rules

- Every role belongs to one organization.
- Every member has exactly one role.
- A role can be assigned to many members.
- Organizations automatically receive default roles during onboarding.
- Organizations can create unlimited custom roles.
- Permissions are assigned only through roles.
- Users never receive permissions directly.
- A role cannot be deleted while assigned to members.
- Every organization must always have at least one Owner.
- Owner role always has full access.
- Owner role cannot be deleted.
- Owner role permissions cannot be modified.

---

# Default Roles

Every organization automatically receives:

### Owner

- Full system access.
- Protected role.

### Manager

Operational management.

Typical permissions:

- Manage leads
- Manage conversations
- Manage tasks
- View reports
- Invite members

Cannot:

- Delete organization
- Manage billing
- Delete Owner
- Manage subscriptions

### Member

Daily operational work.

Typical permissions:

- View assigned leads
- Update assigned leads
- Reply to conversations
- Manage own tasks

Cannot:

- Manage members
- Manage roles
- Delete data
- Manage organization settings

---

# Role Types

SYSTEM

Created automatically by LeadFlow AI.

CUSTOM

Created by organization administrators.

---

# Columns

| Column          | Type         | Required | Description                                   |
| --------------- | ------------ | -------- | --------------------------------------------- |
| id              | UUID v7      | ✅       | Primary Key                                   |
| organization_id | UUID v7      | ✅       | Organization                                  |
| name            | varchar(100) | ✅       | Role name                                     |
| description     | text         | ❌       | Role description                              |
| source          | RoleSource   | ✅       | SYSTEM or CUSTOM                              |
| is_protected    | boolean      | ✅       | Can role metadata and permissions be modified |
| created_at      | timestamptz  | ✅       | Creation timestamp                            |
| updated_at      | timestamptz  | ✅       | Last update                                   |
| deleted_at      | timestamptz  | ❌       | Soft delete                                   |

---

# Relationships

## Belongs To

- Organization

## Has Many

- Organization Memberships
- Role Permissions

---

# Constraints

- Role name must be unique within an organization.

```text
UNIQUE (organization_id, name)
```

- Owner role cannot be deleted.
- Roles assigned to members cannot be deleted.

---

# Indexes

| Index | Columns                 | Type    |
| ----- | ----------------------- | ------- |
| PK    | id                      | Primary |
| UK    | (organization_id, name) | Unique  |
| IDX   | organization_id         | Index   |
| IDX   | source                  | Index   |

---

# Ownership

Access Control

---

# Future Scope

- Role Templates
- Industry Role Templates
- Clone Existing Role
- Import / Export Roles

---

# Status

Approved ✅

Frozen ✅
