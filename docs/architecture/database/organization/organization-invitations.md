# Organization Invitations

Status: Approved ✅

---

# Purpose

Represents an invitation sent to a user to join an Organization.

An invitation grants access to an organization after it is accepted.

Invitations are independent of authentication.

The invited user may:

- Login
- Register
- Continue with Google
- Continue with Apple

After successful authentication and invitation validation, the membership is created.

---

# Business Rules

- Every invitation belongs to one Organization.
- Every invitation assigns one Organization Role.
- Invitations are sent to an email address.
- The invited email determines who can accept the invitation.
- Invitations are single-use.
- Invitations expire automatically.
- Invitations cannot be reused after acceptance.
- Membership is created only after the invitation is accepted.
- A user cannot accept an invitation for an organization they already belong to.
- Only authorized members can send invitations.

---

# Invitation Lifecycle

CREATED

↓

SENT

↓

ACCEPTED

or

↓

EXPIRED

or

↓

REVOKED

---

# Invitation Flow

Owner / Manager

↓

Invite Member

↓

Create Invitation

↓

Send Email

↓

User Clicks Link

↓

Authenticate
(Login / Register / Google / Apple)

↓

Validate Invitation

↓

Create Membership

↓

Delete / Archive Invitation

↓

Dashboard

---

# Columns

| Column          | Type             | Required | Description                          |
| --------------- | ---------------- | -------- | ------------------------------------ |
| id              | UUID v7          | ✅       | Primary Key                          |
| organization_id | UUID v7          | ✅       | Organization                         |
| role_id         | UUID v7          | ✅       | Assigned role after acceptance       |
| email           | varchar(320)     | ✅       | Invited email (normalized lowercase) |
| token_hash      | varchar(255)     | ✅       | Hashed invitation token              |
| status          | InvitationStatus | ✅       | Current invitation status            |
| invited_by      | UUID v7          | ✅       | User who sent the invitation         |
| expires_at      | timestamptz      | ✅       | Invitation expiration                |
| accepted_at     | timestamptz      | ❌       | Acceptance timestamp                 |
| created_at      | timestamptz      | ✅       | Creation timestamp                   |
| updated_at      | timestamptz      | ✅       | Last update                          |
| deleted_at      | timestamptz      | ❌       | Soft delete                          |

---

# Relationships

## Belongs To

- Organization
- Organization Role
- User (Invited By)

---

# Constraints

An email can have only one active invitation for the same organization.

```text
UNIQUE (organization_id, email)
```

Only invitations with status:

- CREATED
- SENT

are considered active.

Accepted, expired or revoked invitations no longer block a new invitation.

---

# Indexes

| Index | Columns                  | Type    | Reason                               |
| ----- | ------------------------ | ------- | ------------------------------------ |
| PK    | id                       | Primary | Primary Key                          |
| UK    | (organization_id, email) | Unique  | Prevent duplicate active invitations |
| UK    | token_hash               | Unique  | Secure invitation lookup             |
| IDX   | organization_id          | Index   | Organization invitations             |
| IDX   | role_id                  | Index   | Invitation role lookup               |
| IDX   | status                   | Index   | Invitation filtering                 |
| IDX   | expires_at               | Index   | Cleanup expired invitations          |

---

# Security

- Store only hashed invitation tokens.
- Never store raw invitation tokens.
- Tokens must be cryptographically secure.
- Invitations expire automatically.
- Invitations are single-use.
- Invitations become invalid immediately after acceptance.

---

# Authentication Independence

Invitation acceptance is independent from authentication.

Supported flows:

Existing User

Login

↓

Accept Invitation

↓

Membership Created

---

New User

Register

↓

Verify Email

↓

Accept Invitation

↓

Membership Created

---

Social Login

Google

↓

Accept Invitation

↓

Membership Created

---

# Ownership

Organization

---

# Future Scope

- Bulk Invitations
- CSV Import
- Resend Invitation
- Invitation Message
- Invitation Audit Log
- Domain Restricted Invitations
- Auto Join by Company Domain
- SCIM Provisioning
- External Collaborators

---

# Status

Approved ✅

Frozen ✅
