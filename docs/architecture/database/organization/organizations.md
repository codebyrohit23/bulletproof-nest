# Organizations

Status: Approved ✅

---

# Purpose

Represents a customer's workspace in LeadFlow AI.

Every business operates inside an Organization.

Organizations are the root tenant of the platform.

All business data belongs to an Organization.

Users never own business data directly.

---

# Business Rules

- Every organization is an isolated workspace.
- A user can create multiple organizations.
- A user can belong to multiple organizations.
- Every organization must always have at least one active owner.
- Organizations are archived before permanent deletion.
- Organization name can be changed anytime.
- Slug is globally unique.
- Trial begins after organization creation.
- Industry is selected during onboarding.
- Organization owns all business data.

---

# Lifecycle

PENDING

↓

ACTIVE

↓

SUSPENDED

↓

ARCHIVED

↓

DELETED

---

# Columns

| Column       | Type                 | Required | Description                |
| ------------ | -------------------- | -------- | -------------------------- |
| id           | UUID v7              | ✅       | Primary Key                |
| name         | varchar(150)         | ✅       | Workspace name             |
| slug         | varchar(150)         | ✅       | Public unique identifier   |
| logo_file_id | UUID v7              | ❌       | Organization logo          |
| industry     | OrganizationIndustry | ❌       | Selected during onboarding |
| state        | OrganizationState    | ✅       | Current organization state |
| created_at   | timestamptz          | ✅       | Creation timestamp         |
| updated_at   | timestamptz          | ✅       | Last update timestamp      |
| deleted_at   | timestamptz          | ❌       | Soft delete timestamp      |

---

# Relationships

## Has Many

- Organization Memberships
- Organization Roles
- Organization Invitations
- Teams
- Leads
- Contacts
- Conversations
- Pipelines
- Forms
- Websites

---

# Does Not Own

- Authentication
- Billing
- Subscriptions
- Files

---

# Constraints

- Slug must be globally unique.
- Organization name is required.
- Every organization must always have at least one active owner.

---

# Indexes

| Index | Columns  | Type    |
| ----- | -------- | ------- |
| PK    | id       | Primary |
| UK    | slug     | Unique  |
| IDX   | state    | Index   |
| IDX   | industry | Index   |

---

# Ownership

Organization

---

# Status

Approved ✅

Frozen ✅
