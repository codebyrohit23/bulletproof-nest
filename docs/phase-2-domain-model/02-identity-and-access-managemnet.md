# Bounded Contexts

## Purpose

This document defines the business boundaries of LeadFlow AI.

Each bounded context represents an independent business domain responsible for its own data, business rules, services, and events.

The goal is to keep the application modular, maintainable, and loosely coupled.

---

# What is a Bounded Context?

A bounded context is an independent business module that owns its own responsibilities.

Each context should:

- Own its own business logic
- Own its own entities
- Own its own services
- Own its own events
- Expose only what other modules need

Modules should communicate through services or domain events rather than directly accessing each other's internal implementation.

---

# Context Overview

LeadFlow AI is divided into the following bounded contexts.

---

# 1. Identity & Access

## Responsibility

Manage authentication and authorization.

## Owns

- User
- Role
- Permission
- Session
- Refresh Token

## Responsibilities

- Registration
- Login
- Logout
- Password Reset
- Email Verification
- RBAC

## Exposes

- Validate User
- Current User
- Permission Checking

---

# 2. Organization

## Responsibility

Manage organizations and team members.

## Owns

- Organization
- Team
- Invitation

## Responsibilities

- Create Organization
- Invite Members
- Manage Teams
- Organization Settings

## Exposes

- Current Organization
- Organization Members

---

# 3. Lead

## Responsibility

Manage leads throughout their lifecycle.

## Owns

- Lead
- Lead Source
- Lead Assignment

## Responsibilities

- Create Lead
- Update Lead
- Assign Lead
- Archive Lead

## Exposes

- Lead Details
- Assigned Owner

---

# 4. Pipeline

## Responsibility

Manage lead progression.

## Owns

- Pipeline
- Stage

## Responsibilities

- Create Pipeline
- Move Lead
- Stage Management

---

# 5. Activity

## Responsibility

Maintain complete lead history.

## Owns

- Activity
- Timeline
- Note

## Responsibilities

- Record Activities
- Record Notes
- Generate Timeline

---

# 6. Task

## Responsibility

Manage follow-up tasks.

## Owns

- Task

## Responsibilities

- Create Task
- Complete Task
- Assign Task
- Reminder

---

# 7. Forms

## Responsibility

Capture inbound leads.

## Owns

- Website
- Form
- Field
- Submission

## Responsibilities

- Form Builder
- Dynamic Fields
- Public Forms
- Store Submissions

---

# 8. Conversations

## Responsibility

Store customer conversations.

## Owns

- Conversation
- Message

## Responsibilities

- Store Messages
- Conversation History

---

# 9. Integrations

## Responsibility

Connect external services.

## Owns

- Integration
- Channel

## Responsibilities

- Facebook
- WhatsApp
- Webhooks

---

# 10. Notifications

## Responsibility

Notify users.

## Owns

- Notification

## Responsibilities

- Assignment Notifications
- Task Notifications
- Reminder Notifications

---

# 11. Reporting

## Responsibility

Generate business insights.

## Owns

- Dashboard
- Reports

## Responsibilities

- Analytics
- KPIs
- Charts

---

# 12. Subscription

## Responsibility

Manage customer subscriptions.

## Owns

- Subscription
- Plan

## Responsibilities

- Trial
- Billing
- Plan Upgrade

---

# Context Communication

Contexts should never directly manipulate another context's internal data.

Preferred communication:

Identity
│
▼
Organization
│
▼
Lead
│
▼
Activity
│
▼
Notification

Example:

Lead Created

↓

Activity Module records history

↓

Notification Module sends notification

Lead Module should not directly create notifications.

---

# Design Principles

- High Cohesion
- Low Coupling
- Single Responsibility
- Event-Driven Communication
- Independent Business Logic
- Clear Ownership

src/modules

auth/
organization/
lead/
pipeline/
task/
activity/
forms/
notification/
integration/
reporting/
subscription/
