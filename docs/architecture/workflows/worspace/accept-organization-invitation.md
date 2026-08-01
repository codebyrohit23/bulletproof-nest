# Accept Organization Invitation

Status: Approved ✅

---

## Purpose

Defines the complete workflow for accepting an organization invitation.

The workflow supports both:

- Existing users
- New users

After successful validation, the user becomes a member of the organization.

---

## Supported Authentication

The invited person may continue using:

- Email & Password
- Google
- Apple
- Future Providers

Authentication method does not affect the invitation flow.

---

## Preconditions

The invitation must:

- Exist
- Not be expired
- Not be revoked
- Not be accepted
- Be associated with an active organization

---

## Workflow

### Step 1

User opens invitation link.

Example

https://app.leadflow.ai/invitations/{token}

---

### Step 2

Validate invitation token.

Checks

- Token exists
- Token hash matches
- Invitation active
- Invitation not expired

If invalid

Show

- Invitation expired
- Invitation revoked
- Invitation already accepted

---

### Step 3

Authenticate User.

If user is not authenticated

Show

- Login
- Register
- Continue with Google
- Continue with Apple

---

### Step 4

Validate Identifier

The authenticated user's verified identifier must match the invitation.

Example

Invitation

Must match.

---

### Step 5

Check Membership

Verify the user is not already a member of the organization.

If membership already exists

Redirect to organization.

No duplicate membership is created.

---

### Step 6

Create Membership

Create

- Organization Membership

Assign

- Organization Role

Status

ACTIVE

joined_at

Current UTC timestamp.

---

### Step 7

Complete Invitation

Update

Organization Invitation

Status

ACCEPTED

accepted_at

Current UTC timestamp.

---

### Step 8

Redirect

Switch current organization.

Redirect user to dashboard.

---

## Database Operations

Read

organization_invitations

Read

user_identities

Read

organization_memberships

Create

organization_memberships

Update

organization_invitations

---

## Security

- Invitation tokens are hashed.
- Tokens are single-use.
- Expired invitations are rejected.
- Revoked invitations are rejected.
- Identifier must match.
- Membership duplicates are prevented.

---

## Failure Cases

- Invalid token
- Expired token
- Revoked invitation
- Identifier mismatch
- Organization suspended
- Membership already exists

---

## Business Rules

- Invitations never create memberships directly.
- Membership is created only after successful authentication.
- Users may register before accepting.
- Existing users may log in before accepting.
- Authentication provider does not affect membership creation.
- Invitation acceptance is idempotent.

---

## Ownership

Organization

---

## Status

Approved ✅

Frozen ✅
