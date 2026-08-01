# Organization Onboarding Workflow

Status: Approved ✅

---

# Purpose

Defines the complete onboarding experience for a new customer after successful registration.

The goal of onboarding is to prepare a usable workspace with the minimum required information while allowing the customer to skip optional steps and start using LeadFlow AI immediately.

---

# Goals

- Create a ready-to-use workspace.
- Collect only information required by the product.
- Reduce onboarding friction.
- Allow optional setup later.
- Generate default business data.

---

# Preconditions

The following must already exist before onboarding starts.

- User
- Verified Identity
- Organization
- Organization Membership
- Owner Role
- Default Roles
- Default Role Permissions
- Active Session

---

# Onboarding Flow

## Step 1 — Welcome

Display

- Welcome message
- Organization created successfully

User Action

- Continue

Database

None

Can Skip

No

---

## Step 2 — Workspace

Display

- Workspace Name

Default Value

"<First Name>'s Workspace"

Validation

- Required
- 3–150 characters
- Unique slug generated automatically

Database

organizations

Updated Fields

- name
- slug (if changed)

Can Skip

No

---

## Step 3 — Business

Display

- Industry

Examples

- Real Estate
- Insurance
- Agency
- Healthcare
- Education
- Retail
- Other

Validation

Required

Database

organizations

Updated Fields

- industry

Can Skip

No

---

## Step 4 — Invite Team

Display

- Email input
- Assigned Role

Actions

- Send Invitation
- Skip

Database

organization_invitations

Can Skip

Yes

---

## Step 5 — Connect Channels

Display

- WhatsApp Business
- Facebook
- Instagram

Actions

- Connect
- Skip

Database

None

Can Skip

Yes

---

## Step 6 — Generate Default Workspace

System Action

Generate default business data.

Create

- Default Roles (already created during organization creation if missing)
- Default Pipelines
- Default Lead Statuses
- Default Lead Sources

Database

Multiple business tables

User Action

None

---

## Step 7 — Complete Onboarding

Database

organizations

Updated Fields

- onboarding_completed_at

Redirect

Dashboard

---

# Onboarding Completion

A workspace is considered onboarded when:

- Organization name exists.
- Industry is selected.
- onboarding_completed_at is not null.

Inviting members and connecting integrations are optional.

---

# Generated Data

During onboarding completion the system prepares the workspace.

Examples

- Default Pipeline
- Default Lead Stages
- Default Lead Sources
- Default Dashboard Widgets (Future)

---

# Failure Recovery

If onboarding is interrupted:

- User logs in normally.
- System checks onboarding_completed_at.
- If null, onboarding resumes from the last incomplete required step.

---

# Business Rules

- Authentication must be completed before onboarding.
- Email must already be verified.
- Organization already exists before onboarding.
- Membership already exists before onboarding.
- Owner role already exists before onboarding.
- Optional steps must never block access to the application.
- Required steps must be completed before accessing the dashboard.

---

# Ownership

Organization

---

# Status

Approved ✅

Frozen ✅

Register
│
▼
Verify Email
│
▼
Workspace Name
│
▼
Industry
│
▼
Create Organization
│
▼
Create Owner Membership
│
▼
Create Default Roles
│
▼
Assign Owner Role
│
▼
Create Session
│
▼
Onboarding (Optional Steps)
│
▼
Dashboard
