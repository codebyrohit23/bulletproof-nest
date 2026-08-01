# Identity Resource

## Business Purpose

Identity represents a person who can authenticate and access LeadFlow AI.

An Identity is independent of any specific Organization.

The same Identity may belong to one or more Organizations through Organization Memberships.

---

# Business Value

Provides secure authentication and allows a single person to work across multiple organizations without creating multiple accounts.

---

# Business Owner

Platform

---

# Created By

- User Registration
- Organization Invitation (Future)
- Admin Creation (Future)

---

# Lifecycle

Registered

↓

Email Verified

↓

Active

↓

Suspended

↓

Archived

---

# Business Rules

- Every Identity has a unique email address.
- Email must be verified before accessing protected resources.
- Passwords are never stored in plain text.
- One Identity can belong to multiple Organizations.
- An Identity may have different Roles in different Organizations.
- Removing an Identity from one Organization must not delete the Identity itself.
- An Identity without any Organization can still exist (for example, after accepting an invitation later).

---

# Relationships

iam

├── users
├── sessions
├── memberships
├── roles
├── permissions
├── authentication
└── authorization

---

# Required Information

Personal

- First Name
- Last Name
- Email
- Avatar

Security

- Password Hash
- Email Verified
- Last Login

Audit

- Created At
- Updated At

---

# Search Requirements

Search by

- Email
- Name

---

# Security

- Password must be hashed.
- Email must be unique.
- MFA should be supported in the future.
- Sessions should be revocable.

---

# Future

- Social Login
- Google
- Microsoft
- GitHub
- SSO
- Passkeys
- MFA

---

# APIs

POST /auth/register

POST /auth/login

POST /auth/logout

POST /auth/refresh

GET /me

PATCH /me

---

# Events

UserRegistered

EmailVerified

UserLoggedIn

UserLoggedOut

PasswordChanged

---

# Business Justification

Identity represents the human using the platform.

It is intentionally separated from Organizations so one person can securely work across multiple businesses without duplicate accounts.
