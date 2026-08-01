# Permissions

Status: Approved ✅

---

# Purpose

Permissions represent every action that can be performed inside LeadFlow AI.

Permissions are global and system-defined.

They are the foundation of the Role-Based Access Control (RBAC) system.

Permissions are assigned to Organization Roles.

Users never receive permissions directly.

---

# Business Rules

- Permissions are global.
- Permissions are created only by the application.
- Permissions are never created by customers.
- Permissions are immutable after release.
- Permissions cannot be edited.
- Permissions cannot be deleted.
- Permissions are assigned only to Organization Roles.
- Users receive permissions through their Organization Role.
- Memberships never receive permissions directly.

---

# Permission Structure

Every permission consists of:

Resource + Action

Example

lead:create

conversation:reply

organization:update

settings:manage

---

# Permission Naming Convention

Resource

- lead
- contact
- conversation
- task
- organization
- settings
- billing

Action

- read
- create
- update
- delete
- assign
- export
- import
- manage

Permission Key

resource:action

Examples

lead:read

lead:create

lead:update

lead:delete

conversation:reply

organization:update

settings:manage

billing:manage

---

# Columns

| Column      | Type         | Required | Description                                    |
| ----------- | ------------ | -------- | ---------------------------------------------- |
| id          | UUID v7      | ✅       | Primary Key                                    |
| resource    | varchar(100) | ✅       | Resource or module name                        |
| action      | varchar(100) | ✅       | Action performed on the resource               |
| key         | varchar(200) | ✅       | Unique permission identifier (resource:action) |
| name        | varchar(150) | ✅       | Human-readable permission name                 |
| description | text         | ❌       | Explains what the permission allows            |
| created_at  | timestamptz  | ✅       | Creation timestamp                             |

---

# Relationships

## Has Many

- Role Permissions

---

# Constraints

- Permission key must be globally unique.
- Resource and action combination must be unique.
- Permission key is immutable.
- Permissions cannot be updated.
- Permissions cannot be deleted.

---

# Unique Constraints

```text
UNIQUE(resource, action)

UNIQUE(key)
```

---

# Indexes

| Index | Columns            | Type    | Reason                        |
| ----- | ------------------ | ------- | ----------------------------- |
| PK    | id                 | Primary | Primary Key                   |
| UK    | key                | Unique  | Fast permission lookup        |
| UK    | (resource, action) | Unique  | Prevent duplicate permissions |
| IDX   | resource           | Index   | Group permissions by resource |

---

# Permission Resolution

```text
User

↓

Organization Membership

↓

Organization Role

↓

Role Permissions

↓

Permission

↓

Allow / Deny
```

---

# Example Permissions

## Organization

- organization.read
- organization.update
- organization.archive

## Lead

- lead.read
- lead.create
- lead.update
- lead.delete
- lead.assign
- lead.export

## Conversation

- conversation.read
- conversation.reply
- conversation.assign

## Task

- task.read
- task.create
- task.update
- task.delete

## Settings

- settings.read
- settings.update

## Billing

- billing.read
- billing.manage

---

# Seeder

Permissions are seeded by the application.

They are never created or modified through the UI.

Every new application feature introducing a protected action must also introduce the required permission through a database migration or seed.

---

# Future Scope

- Permission Categories
- Permission Groups
- Permission Dependencies
- Feature Flags
- API Scope Mapping

---

# Ownership

Access Control

---

# Status

Approved ✅

Frozen ✅
