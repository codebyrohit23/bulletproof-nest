# Verification Codes

## Purpose

Stores short-lived, single-use verification codes used to verify ownership of an identity.

Verification codes are independent from user identities because verification often occurs before an identity is created or updated.

This table is responsible only for verification logic.

It does not store passwords, sessions or authentication credentials.

---

# Business Rules

- Every verification code belongs to one user.
- Verification targets an identity value (email or phone).
- Verification codes are single-use.
- Verification codes expire automatically.
- Verification codes are stored only as hashes.
- Raw verification codes are never stored.
- Verification codes cannot be reused.
- Verification stops after reaching the maximum allowed attempts.
- Expired verification codes are invalid.

---

# Verification Types

Current

- EMAIL_VERIFICATION
- PHONE_VERIFICATION

Future

- LOGIN
- TWO_FACTOR_AUTHENTICATION
- EMAIL_CHANGE
- PHONE_CHANGE
- PASSWORDLESS_LOGIN
- DEVICE_VERIFICATION
- ACCOUNT_RECOVERY

---

# Delivery Channels

Current

- EMAIL
- SMS

Future

- WHATSAPP
- AUTHENTICATOR_APP
- VOICE_CALL
- PUSH_NOTIFICATION

---

# Identifier Types

- EMAIL
- PHONE

Future

- USERNAME
- EMPLOYEE_ID

---

# Columns

| Column           | Type                | Required | Description                       |
| ---------------- | ------------------- | -------- | --------------------------------- |
| id               | UUID v7             | ✅       | Primary Key                       |
| identifier_type  | TargetType          | ✅       | EMAIL or PHONE                    |
| identifier_value | varchar(255)        | ✅       | Normalized email or phone         |
| purpose          | VerificationPurpose | ✅       | Purpose of verification           |
| channel          | VerificationChannel | ✅       | EMAIL, SMS                        |
| code_hash        | varchar(255)        | ✅       | Hashed verification code          |
| attempts         | integer             | ✅       | Current verification attempts     |
| max_attempts     | integer             | ✅       | Maximum allowed attempts          |
| expires_at       | timestamptz         | ✅       | Expiration timestamp              |
| verified_at      | timestamptz         | ❌       | Successful verification timestamp |
| created_at       | timestamptz         | ✅       | Creation timestamp                |

---

# Relationships

## Belongs To

- User (Optional)

---

# Constraints

- Verification codes are single-use.
- Only hashed verification codes are stored.
- Expired verification codes are invalid.
- Verification fails after maximum attempts.

---

# Indexes

| Index | Columns                             | Type    | Reason                   |
| ----- | ----------------------------------- | ------- | ------------------------ |
| PK    | id                                  | Primary | Primary key              |
| IDX   | user_id                             | Index   | User lookup              |
| IDX   | (identifier_type, identifier_value) | Index   | Find active verification |
| IDX   | type                                | Index   | Verification flow lookup |
| IDX   | expires_at                          | Index   | Cleanup expired codes    |

---

# Security

- Never store raw verification codes.
- Always hash verification codes before saving.
- Generate cryptographically secure random codes.
- Limit verification attempts.
- Expire codes automatically.
- Invalidate codes immediately after successful verification.

---

# API Usage

Used By

Current

- Register
- Verify Email
- Verify Phone
- Forgot Password

Future

- Login with OTP
- Passwordless Login
- Two-Factor Authentication
- Change Email
- Change Phone
- Invite User
- Device Verification
- Account Recovery

---

# Future Considerations

- Time-based OTP (TOTP)
- Backup Codes
- Hardware Security Keys
- Passkeys
- Passwordless Authentication
- Risk-based Verification
- Adaptive Authentication

---

# Ownership

Identity

---

# Status

Approved ✅

Frozen ✅
