# Refresh Tokens

## Purpose

Stores refresh tokens issued for authenticated user sessions.

Refresh tokens are used to generate new access tokens without requiring the user to log in again.

Refresh tokens always belong to a session.

---

# Business Rules

- Every refresh token belongs to one session.
- Every refresh token belongs to one user.
- Refresh tokens are stored as hashes.
- Raw refresh tokens are never stored.
- Refresh tokens expire.
- Refresh tokens can be revoked.
- Refresh token rotation is supported.
- A revoked refresh token cannot be reused.

---

# Columns

| Column       | Type         | Required | Description                |
| ------------ | ------------ | -------- | -------------------------- |
| id           | UUID v7      | ✅       | Primary Key                |
| session_id   | UUID v7      | ✅       | Reference to user_sessions |
| token_hash   | varchar(255) | ✅       | Hashed refresh token       |
| token_family | UUID v7      | ✅       | Token rotation family      |
| jti          | UUID v7      | ✅       | JWT ID                     |
| expires_at   | timestamptz  | ✅       | Expiration timestamp       |
| revoked_at   | timestamptz  | ❌       | Revocation timestamp       |
| created_at   | timestamptz  | ✅       | Creation timestamp         |

---

# Relationships

## Belongs To

- User Session

---

# Constraints

- One token hash must be unique.
- One JTI must be unique.
- Refresh tokens are immutable.
- Revoked tokens cannot be reused.

---

# Indexes

| Index | Columns      | Type    | Reason                   |
| ----- | ------------ | ------- | ------------------------ |
| PK    | id           | Primary | Primary key              |
| UK    | token_hash   | Unique  | Prevent duplicate tokens |
| UK    | jti          | Unique  | JWT identifier           |
| IDX   | session_id   | Index   | Session lookup           |
| IDX   | token_family | Index   | Token rotation           |
| IDX   | expires_at   | Index   | Cleanup expired tokens   |

---

# Security

- Never store raw refresh tokens.
- Always hash refresh tokens before saving.
- Rotate refresh tokens after every successful refresh.
- Revoke the entire token family if token reuse is detected.

---

# API Usage

Used By

- Login
- Refresh Access Token
- Logout
- Logout All Devices

---

# Future Considerations

- Device Trust
- Session Analytics
- Risk Based Authentication

---

# Ownership

Identity

---

# Status

Approved ✅

Frozen ✅
