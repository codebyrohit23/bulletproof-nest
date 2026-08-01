# Identity Methods

## Purpose

Stores the authentication identity of a user.

Each user can have:

- One Email (Required)
- One Phone Number (Optional)

This table is responsible only for storing identity values used for authentication.

Passwords, OAuth providers, sessions, OTPs and verification tokens are stored in their own dedicated tables.

---

# Business Rules

- Every identity method belongs to exactly one user.
- A user can have only one email.
- A user can have only one phone number.
- Email is required.
- Phone is optional.
- Email must be globally unique.
- Phone number must be globally unique.
- Email is always stored in lowercase.
- Phone is always stored in normalized E.164 format without the `+` sign.
- Identity values are normalized before storing.
- Email and phone are verified independently.
- Authentication starts using an identity method.
- Identity methods are soft deleted.

---

# State Machine

PENDING

↓

VERIFIED

↓

DISABLED

↓

DELETED

---

# Columns

| Column      | Type               | Required | Description               |
| ----------- | ------------------ | -------- | ------------------------- |
| id          | UUID v7            | ✅       | Primary Key               |
| user_id     | UUID v7            | ✅       | Reference to users table  |
| type        | IdentityMethodType | ✅       | EMAIL or PHONE            |
| value       | varchar(255)       | ✅       | Normalized email or phone |
| verified_at | timestamptz        | ❌       | Verification timestamp    |
| created_at  | timestamptz        | ✅       | Creation timestamp        |
| updated_at  | timestamptz        | ✅       | Last update timestamp     |
| deleted_at  | timestamptz        | ❌       | Soft delete timestamp     |

---

# Relationships

## Belongs To

- User

## Has Many

- OTP Codes
- Verification Tokens

---

# Constraints

- One email per user.

```text
UNIQUE(user_id, type)
```

- Identity value must be globally unique.

```text
UNIQUE(type, value)
```

- Soft delete only.

---

# Indexes

| Index | Columns         | Type    | Reason                                              |
| ----- | --------------- | ------- | --------------------------------------------------- |
| PK    | id              | Primary | Primary key                                         |
| UK    | (user_id, type) | Unique  | Prevent multiple emails or phones for the same user |
| UK    | (type, value)   | Unique  | Prevent duplicate email or phone across users       |
| IDX   | user_id         | Index   | Fast lookup by user                                 |
| IDX   | verified_at     | Index   | Verification queries                                |
| IDX   | deleted_at      | Index   | Soft delete filtering                               |

---

# Security

- Email is always stored in lowercase.
- Phone is always stored in normalized format.
- Authentication always uses the stored value.
- Never expose verification details publicly.
- Verification is handled using OTPs or verification tokens.

---

# API Usage

Used By

- Register
- Login
- Verify Email
- Verify Phone
- Change Email
- Change Phone
- Forgot Password

---

# Future Considerations

- Username login
- Employee ID login
- Passkeys
- SSO

---

# Ownership

Identity

---

# Status

Approved ✅

Frozen ✅
