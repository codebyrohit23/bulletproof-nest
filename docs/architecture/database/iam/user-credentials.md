# User Credentials

## Purpose

Stores password-based authentication credentials for a user.

This table is only responsible for password authentication.

A user may not have a credential record if they registered using only an OAuth provider (Google, Apple, Microsoft, etc.).

---

# Business Rules

- Every credential belongs to exactly one user.
- A user can have at most one credential.
- Passwords are never stored in plain text.
- Passwords are always stored as a secure hash.
- Password changes invalidate old refresh tokens.
- Password history is not supported in MVP.
- Users authenticated only through OAuth may not have a credential.

---

# Columns

| Column              | Type         | Required | Description              |
| ------------------- | ------------ | -------- | ------------------------ |
| id                  | UUID v7      | ✅       | Primary Key              |
| user_id             | UUID v7      | ✅       | Reference to users table |
| password_hash       | varchar(255) | ✅       | Secure hashed password   |
| password_changed_at | timestamptz  | ❌       | Last password change     |
| created_at          | timestamptz  | ✅       | Creation timestamp       |
| updated_at          | timestamptz  | ✅       | Last update timestamp    |

---

# Relationships

## Belongs To

- User

---

# Constraints

- One credential per user.

```text
UNIQUE(user_id)
```

---

# Indexes

| Index | Columns | Type    | Reason                  |
| ----- | ------- | ------- | ----------------------- |
| PK    | id      | Primary | Primary key             |
| UK    | user_id | Unique  | One credential per user |

---

# Security

- Passwords must be hashed using Argon2id.
- Never log password hashes.
- Never expose password hashes in API responses.
- Password verification happens in the authentication service.
- Changing the password should revoke all active refresh tokens.

---

# API Usage

Used By

- Register
- Login
- Change Password
- Reset Password

---

# Future Considerations

- Password history
- Password expiration policy
- Enterprise password policy
- Breached password detection

---

# Ownership

Identity

---

# Status

Approved ✅

Frozen ✅
