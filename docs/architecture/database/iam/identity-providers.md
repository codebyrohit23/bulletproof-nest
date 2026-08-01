# Identity Providers

## Purpose

Stores third-party authentication providers linked to a user account.

This table allows users to authenticate using external identity providers instead of a password.

Currently supported:

- Google

Future:

- Apple
- Microsoft
- Facebook
- GitHub

---

# Business Rules

- Every provider account belongs to one user.
- A user can connect multiple providers.
- A provider account can belong to only one user.
- A user can login using any connected provider.
- Connecting a provider does not require a password.
- Disconnecting the last login method is not allowed.

---

# Columns

| Column            | Type             | Required | Description                     |
| ----------------- | ---------------- | -------- | ------------------------------- |
| id                | UUID v7          | ✅       | Primary Key                     |
| user_id           | UUID v7          | ✅       | Reference to users table        |
| provider          | IdentityProvider | ✅       | GOOGLE, APPLE, MICROSOFT        |
| provider_user_id  | varchar(255)     | ✅       | Unique identifier from provider |
| email             | varchar(255)     | ❌       | Email returned by provider      |
| provider_metadata | jsonb            | ❌       | Provider specific profile data  |
| linked_at         | timestamptz      | ✅       | Account linked timestamp        |
| created_at        | timestamptz      | ✅       | Creation timestamp              |
| updated_at        | timestamptz      | ✅       | Last update timestamp           |

---

# Relationships

## Belongs To

- User

---

# Constraints

- One provider account belongs to only one user.

```text
UNIQUE(provider, provider_user_id)
```

- A user cannot connect the same provider twice.

```text
UNIQUE(user_id, provider)
```

---

# Indexes

| Index | Columns                      | Type    | Reason                              |
| ----- | ---------------------------- | ------- | ----------------------------------- |
| PK    | id                           | Primary | Primary key                         |
| UK    | (provider, provider_user_id) | Unique  | Prevent duplicate provider accounts |
| UK    | (user_id, provider)          | Unique  | One account per provider per user   |
| IDX   | user_id                      | Index   | Fast lookup by user                 |

---

# Security

- Never store OAuth access tokens.
- Never store OAuth refresh tokens.
- Never trust provider email without verification.
- Provider authentication must always be server-side.

---

# API Usage

Used By

- Google Login
- Connect Google Account
- Disconnect Provider
- Login With Provider

---

# Future Considerations

- Apple Sign In
- Microsoft Login
- GitHub Login
- Facebook Login
- Enterprise SSO

---

# Ownership

Identity

---

# Status

Approved ✅

Frozen ✅
