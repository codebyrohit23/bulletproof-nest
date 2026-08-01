# Role Permissions

Status: Approved ✅

---

# Purpose

Maps Permissions to Organization Roles.

This table defines which actions a role is allowed to perform within an organization.

Permissions are inherited by members through their assigned role.

---

# Business Rules

- Every record belongs to one Organization Role.
- Every record references one Permission.
- A permission can belong to many roles.
- A role can have many permissions.
- Permissions are never assigned directly to users.
- Removing a permission immediately affects all members assigned to that role.
- Default system roles receive predefined permission sets during organization creation.
- Custom roles inherit no permissions by default.

---

# Columns

| Column        | Type        | Required | Description                    |
| ------------- | ----------- | -------- | ------------------------------ |
| id            | UUID v7     | ✅       | Primary Key                    |
| role_id       | UUID v7     | ✅       | Reference to organization role |
| permission_id | UUID v7     | ✅       | Reference to global permission |
| created_at    | timestamptz | ✅       | Creation timestamp             |

---

# Relationships

## Belongs To

- Organization Role
- Permission

---

# Constraints

A permission can only be assigned once to a role.

```text
UNIQUE(role_id, permission_id)
```

---

# Indexes

| Index | Columns                  | Type    | Reason                        |
| ----- | ------------------------ | ------- | ----------------------------- |
| PK    | id                       | Primary | Primary Key                   |
| UK    | (role_id, permission_id) | Unique  | Prevent duplicate assignments |
| IDX   | role_id                  | Index   | Load role permissions         |
| IDX   | permission_id            | Index   | Find roles using a permission |

---

# Permission Resolution

```text
User
    │
    ▼
Organization Membership
    │
    ▼
Organization Role
    │
    ▼
Role Permissions
    │
    ▼
Permissions
    │
    ▼
Access Granted / Denied
```

---

# Default Permission Sets

## Owner

Receives every permission automatically.

---

## Manager

Receives operational permissions only.

Examples

- Lead Management
- Contact Management
- Conversation Management
- Task Management
- Team Management

Cannot

- Delete Organization
- Manage Billing
- Delete Owner
- Manage Owner Role

---

## Member

Receives only day-to-day operational permissions.

Examples

- View Assigned Leads
- Update Assigned Leads
- Reply to Conversations
- Create Notes
- Manage Own Tasks

Cannot

- Manage Members
- Manage Roles
- Manage Organization
- Delete Business Data

---

# Seeder Strategy

During organization creation:

1. Create default roles.
2. Assign predefined permission sets.
3. Store assignments in this table.

Custom roles start with no permissions unless copied from an existing role.

---

# Ownership

Access Control

---

# Future Scope

- Copy Role Permissions
- Permission Templates
- Industry Permission Templates
- Permission Audit Logs

---

# Status

Approved ✅

Frozen ✅
