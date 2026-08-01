# Module Responsibilities

## Purpose

This document defines the responsibilities and ownership of every module in LeadFlow AI.

Each module should have one primary responsibility.

Modules should never perform business logic that belongs to another module.

The goal is high cohesion and low coupling.

---

# Design Principles

- Every module owns its own business logic.
- Every module owns its own data.
- Modules expose services or events.
- Modules should never directly manipulate another module's data.
- Cross-module communication should happen through events whenever possible.

---

# Identity & Access Module

## Owns

- Authentication
- Users
- Roles
- Permissions
- Sessions

## Responsible For

- Register User
- Login
- Logout
- Password Reset
- Email Verification
- Authorization

## Does NOT Own

- Organizations
- Leads
- Tasks

---

# Organization Module

## Owns

- Organization
- Teams
- Invitations

## Responsible For

- Create Organization
- Invite Members
- Team Management
- Organization Settings

## Does NOT Own

- Authentication
- Leads
- Notifications

---

# Lead Module

## Owns

- Lead
- Lead Assignment
- Lead Source

## Responsible For

- Create Lead
- Update Lead
- Assign Lead
- Archive Lead

## Does NOT Own

- Notifications
- Activities
- Reports

---

# Pipeline Module

## Owns

- Pipeline
- Stage

## Responsible For

- Pipeline Management
- Stage Management
- Lead Movement

---

# Activity Module

## Owns

- Activity
- Timeline
- Notes

## Responsible For

- Record Activities
- Generate Timeline
- Maintain History

Activities should never be edited.

---

# Task Module

## Owns

- Tasks

## Responsible For

- Create Task
- Complete Task
- Assign Task
- Due Dates

---

# Forms Module

## Owns

- Website
- Form
- Field
- Submission

## Responsible For

- Form Builder
- Form Validation
- Public Form Submission

The Forms Module should NOT create Leads directly.

Instead, it should publish an event.

---

# Conversation Module

## Owns

- Conversation
- Message

## Responsible For

- Store Conversations
- Store Messages
- Retrieve Conversation History

---

# Notification Module

## Owns

- Notifications

## Responsible For

- In-App Notifications
- Email Notifications (Future)
- Push Notifications (Future)

The Notification Module should never create Leads or Tasks.

---

# Integration Module

## Owns

- Integrations
- Channels
- Webhooks

## Responsible For

- Facebook Integration
- WhatsApp Integration
- Webhook Processing

---

# Reporting Module

## Owns

- Reports
- Dashboard Metrics

## Responsible For

- Business Statistics
- Dashboard Data
- KPIs

---

# Subscription Module

## Owns

- Subscription
- Plans

## Responsible For

- Trial
- Billing
- Upgrades

---

# Communication Rules

✅ Preferred

Module

↓

Event

↓

Another Module reacts

Example

Lead Module

↓

LeadCreated

↓

Activity Module

↓

Notification Module

↓

Reporting Module

---

Avoid

Module

↓

Directly updating another module's database

---

# Ownership Summary

| Module       | Owns                       |
| ------------ | -------------------------- |
| Identity     | Users, Roles               |
| Organization | Organizations, Teams       |
| Lead         | Leads                      |
| Pipeline     | Pipelines, Stages          |
| Activity     | Activities, Notes          |
| Task         | Tasks                      |
| Forms        | Forms, Fields, Submissions |
| Conversation | Conversations, Messages    |
| Notification | Notifications              |
| Integration  | Integrations               |
| Reporting    | Reports                    |
| Subscription | Plans, Billing             |

---

# Key Architecture Decision

Every business capability has one owner.

Other modules may react to events but should never own another module's business logic.
