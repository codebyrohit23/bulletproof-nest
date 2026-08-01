# Verification Tokens

## Purpose

Stores one-time verification tokens used for identity verification and account recovery.

This table supports multiple verification flows using a single implementation.

Currently Supported

- Email Verification
- Password Reset

Future

- Change Email
- Change Phone
- Magic Link Login
- Account Recovery

---

# Business Rules

- Every token belongs to one user.
- Tokens are single-use.
- Tokens expire.
- Tokens are stored as hashes.
- Raw tokens are never stored.
- Expired tokens cannot be used.
- Used tokens cannot be reused.
- Verification tokens are automatically deleted after expiration.

---

# Token Types

EMAIL_VERIFICATION

PASSWORD_RESET

Future

EMAIL_CHANGE

PHONE_CHANGE

MAGIC_LINK

---

# Columns

| Column     | Type                  | Required | Description               |
| ---------- | --------------------- | -------- | ------------------------- |
| id         | UUID v7               | ✅       | Primary Key               |
| user_id    | UUID v7               | ✅       | Reference to users table  |
| type       | VerificationTokenType | ✅       | Token purpose             |
| token_hash | varchar(255)          | ✅       | Hashed verification token |
| expires_at | timestamptz           | ✅       | Expiration timestamp      |
| used_at    | timestamptz           | ❌       | Token usage timestamp     |
| created_at | timestamptz           | ✅       | Creation timestamp        |

---

# Relationships

## Belongs To

- User

---

# Constraints

- Tokens are single-use.
- Tokens cannot be reused.
- Only hashed tokens are stored.

---

# Indexes

| Index | Columns    | Type    | Reason                 |
| ----- | ---------- | ------- | ---------------------- |
| PK    | id         | Primary | Primary key            |
| UK    | token_hash | Unique  | Fast token lookup      |
| IDX   | user_id    | Index   | User lookup            |
| IDX   | type       | Index   | Filter by token type   |
| IDX   | expires_at | Index   | Cleanup expired tokens |

---

# Security

- Never store raw tokens.
- Tokens should be cryptographically random.
- Always compare hashes.
- Expired tokens are invalid.
- Used tokens are invalid.

---

# API Usage

Used By

- Verify Email
- Forgot Password
- Reset Password

---

# Future Considerations

- Email Change
- Phone Change
- Magic Link Login
- Account Recovery

---

# Ownership

Identity

---

# Status

Approved ✅

Frozen ✅
