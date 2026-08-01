# Business Rules

## Purpose

This document defines the core business rules of LeadFlow AI.

Business rules represent how the platform should behave regardless of technology or implementation.

These rules will guide backend development, API design, database modeling, authorization, and future automation.

---

# Organization Rules

## Rule ORG-001

Every account belongs to exactly one Organization.

---

## Rule ORG-002

Every Organization must have one Owner.

---

## Rule ORG-003

Only the Owner can transfer ownership.

---

## Rule ORG-004

Organization data must always remain isolated from other organizations.

Users from one organization can never access another organization's data.

---

## Rule ORG-005

Deleting an Organization should never immediately delete data.

The organization should first be marked as inactive.

---

# User Rules

## Rule USER-001

Every User is a global identity.

## A User may belong to multiple Organizations through Organization Memberships.

## Rule USER-002

A User can only access data inside their own Organization.

---

## Rule USER-003

A Membership may have one or more Roles.

A User's permissions are evaluated within the context of the active Organization.

A Membership may have one or more Roles.

A User's permissions are evaluated within the context of the active Organization.

## Rule USER-004

Inactive Users cannot log in.

---

## Rule USER-005

Users cannot delete themselves if they are the Organization Owner.

---

# Authentication Rules

## Rule AUTH-001

Email addresses must be unique.

---

## Rule AUTH-002

Email verification is required before accessing the application.

---

## Rule AUTH-003

Passwords must always be stored as hashes.

---

## Rule AUTH-004

Refresh Tokens must be rotatable.

---

## Rule AUTH-005

Expired tokens cannot be reused.

---

# Lead Rules

## Rule LEAD-001

Every Lead belongs to one Organization.

---

## Rule LEAD-002

Every Lead must have one Lead Source.

Examples:

- Website
- Facebook
- WhatsApp
- Manual
- Import

---

## Rule LEAD-003

Every Lead has one current Pipeline Stage.

---

## Rule LEAD-004

Every Lead must have an Owner.

No Lead should remain unassigned.

---

## Rule LEAD-005

Phone number duplicates should be detected.

Organization decides whether duplicates are allowed.

---

## Rule LEAD-006

Archived Leads cannot receive new activities.

---

## Rule LEAD-007

Won Leads cannot move backwards unless explicitly reopened.

---

# Pipeline Rules

## Rule PIPE-001

Each Organization has its own Pipeline.

---

## Rule PIPE-002

Every Pipeline must contain at least one Stage.

---

## Rule PIPE-003

Deleting a Stage with active Leads is not allowed.

---

# Task Rules

## Rule TASK-001

Every Task belongs to one Lead.

---

## Rule TASK-002

Completed Tasks cannot be edited.

(MVP Decision)

---

## Rule TASK-003

Tasks can be assigned only to users inside the same Organization.

---

# Activity Rules

## Rule ACT-001

Every important action should generate an Activity.

Examples:

- Lead Created
- Lead Assigned
- Stage Changed
- Note Added
- Task Completed

---

## Rule ACT-002

Activities are immutable.

They should never be edited.

---

# Notification Rules

## Rule NOTI-001

Users receive notifications only for events they are authorized to view.

---

## Rule NOTI-002

Notifications should never expose another organization's data.

---

# Form Rules

## Rule FORM-001

Organizations can create unlimited Forms.

---

## Rule FORM-002

Every Form belongs to one Website.

(MVP)

---

## Rule FORM-003

Every Submission creates either:

- New Lead

or

- Updates an existing Lead

depending on duplicate detection settings.

---

# Security Rules

## Rule SEC-001

All authenticated APIs require JWT authentication.

---

## Rule SEC-002

All public endpoints require rate limiting.

---

## Rule SEC-003

Sensitive credentials must never be exposed to the frontend.

---

## Rule SEC-004

Every public form must use Cloudflare Turnstile.

---

# Audit Rules

## Rule AUDIT-001

Every important business action should be recorded.

---

## Rule AUDIT-002

Audit records cannot be modified.

---

# Future Rules

These rules are intentionally postponed.

- Multi Organization Users
- White Label
- AI Auto Assignment
- AI Lead Qualification
- Workflow Builder
- Custom Objects

They are not part of the MVP.
