# User Sessions

## Purpose

Represents an authenticated login session of a user.

A session tracks where, when and how a user is logged into LeadFlow AI.

JWT access tokens and refresh tokens belong to a session but do not define the session itself.

---

# Business Rules

- Every session belongs to one user.
- A user can have multiple active sessions.
- Each device creates a separate session.
- A session can be revoked without affecting other sessions.
- A revoked session cannot be reused.
- Refresh tokens always belong to a session.

---

# State Machine

ACTIVE

↓

REVOKED

↓

EXPIRED

---

# Columns

| Column           | Type          | Required | Description                     |
| ---------------- | ------------- | -------- | ------------------------------- |
| id               | UUID v7       | ✅       | Primary Key                     |
| user_id          | UUID v7       | ✅       | Reference to users table        |
| status           | SessionStatus | ✅       | Current session state           |
| device_id        | varchar(255)  | ❌       | Unique client device identifier |
| device_name      | varchar(150)  | ❌       | User-friendly device name       |
| device_type      | DeviceType    | ❌       | Desktop, Mobile, Tablet         |
| platform         | varchar(100)  | ❌       | Windows, macOS, Android, iOS    |
| browser          | varchar(100)  | ❌       | Chrome, Firefox, Safari         |
| ip_address       | inet          | ❌       | Last known IP address           |
| user_agent       | text          | ❌       | Browser user agent              |
| last_activity_at | timestamptz   | ❌       | Last request time               |
| expires_at       | timestamptz   | ✅       | Session expiry                  |
| revoked_at       | timestamptz   | ❌       | Revocation timestamp            |
| created_at       | timestamptz   | ✅       | Creation timestamp              |
| updated_at       | timestamptz   | ✅       | Last update timestamp           |

---

# Relationships

## Belongs To

- User

## Has Many

- Refresh Tokens

---

# Constraints

- Every session belongs to one user.
- Revoked sessions cannot be reactivated.

---

# Indexes

| Index | Columns    | Type    | Reason                   |
| ----- | ---------- | ------- | ------------------------ |
| PK    | id         | Primary | Primary key              |
| IDX   | user_id    | Index   | User sessions            |
| IDX   | status     | Index   | Active sessions          |
| IDX   | expires_at | Index   | Cleanup expired sessions |

---

# Security

- Never expose IP address publicly.
- User Agent is stored for audit purposes.
- Session revocation invalidates future refresh token usage.
- Access tokens are never stored in the database.

---

# API Usage

Used By

- Login
- Logout
- Logout All Devices
- Refresh Token
- Active Devices

---

# Future Considerations

- Trusted Devices
- Device Fingerprinting
- Risk-based Authentication
- Session Location History

---

# Ownership

Identity

---

# Status

Approved ✅

Frozen ✅
