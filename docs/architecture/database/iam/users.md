# Users

## Purpose

The `users` table represents the global identity of a person in LeadFlow AI.

A user is not tied to any organization.

A user can belong to one or more organizations through memberships.

The `users` table only stores public/basic profile information that is frequently required throughout the application.

Authentication data (email, phone, password, providers, sessions, etc.) is intentionally stored in separate tables.

---

# Business Responsibility

A User is responsible for:

- Identity
- Public Profile
- Platform Lifecycle

A User is NOT responsible for:

- Authentication
- Authorization
- Organization Membership
- Roles
- Permissions

---

# Business Rules

- Every user is globally unique.
- A user may belong to multiple organizations.
- A user may have multiple authentication methods.
- A user may have multiple active sessions.
- A user may have multiple OAuth providers.
- A user cannot directly own roles or permissions.
- Display name is automatically generated during registration.
- Display name can be changed later from profile settings.
- Avatar is stored through the Files module.
- Users are soft deleted.

---

# State Machine

PENDING

↓

ACTIVE

↓

SUSPENDED

↓

DELETED

---

# Columns

| Column         | Type         | Required | Description                  |
| -------------- | ------------ | -------- | ---------------------------- |
| id             | UUID v7      | ✅       | Primary Key                  |
| first_name     | varchar(100) | ✅       | Legal first name             |
| last_name      | varchar(100) | ✅       | Legal last name              |
| display_name   | varchar(150) | ✅       | Public display name          |
| avatar_file_id | UUID         | ❌       | Reference to uploaded avatar |
| state          | UserState    | ✅       | Current identity state       |
| created_at     | timestamptz  | ✅       | Creation timestamp           |
| updated_at     | timestamptz  | ✅       | Last update timestamp        |
| deleted_at     | timestamptz  | ❌       | Soft delete timestamp        |

---

# Relationships

User

├── Identity Methods

├── Credentials

├── Identity Providers

├── Sessions

├── Refresh Tokens

├── OTP Codes

├── Verification Tokens

├── Memberships

└── Audit Logs (Future)

---

# Constraints

- UUID v7 primary key.
- Display name cannot be empty.
- Soft delete only.
- Avatar is optional.
- State is required.

---

# Indexes

Primary Key

- id

Secondary

- state
- created_at
- deleted_at

---

# Security

The Users table must never store:

- Email
- Phone Number
- Password Hash
- OAuth Tokens
- Refresh Tokens
- OTP Codes

These belong to dedicated authentication tables.

---

# Future Compatibility

Supports:

- Multiple Emails
- Multiple Phones
- Multiple Login Providers
- MFA
- Passkeys
- SSO
- Magic Links

without changing this table.

---

# Ownership

Platform

---

# Aggregate

Identity

---

# Status

Approved ✅
Frozen ✅
