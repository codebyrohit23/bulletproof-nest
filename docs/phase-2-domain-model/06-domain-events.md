# Domain Events

## Purpose

This document defines the important business events that occur inside LeadFlow AI.

A Domain Event represents something meaningful that has already happened in the business.

Domain Events allow modules to communicate without creating tight dependencies.

This keeps the architecture modular, scalable, and easy to extend.

---

# What is a Domain Event?

A Domain Event is a business fact.

Examples

- Lead Created
- Lead Assigned
- Task Completed
- Organization Created

Events describe something that has already happened.

---

# Design Principles

- Events describe business facts.
- Events are immutable.
- Events are named using past tense.
- Modules publish events.
- Other modules react to events.
- The publishing module should not know who is listening.

---

# Organization Events

## OrganizationCreated

Published When

A new organization is created.

Possible Consumers

- Subscription Module
- Settings Module
- Pipeline Module

Business Value

Automatically prepares a new organization for use.

---

## MemberInvited

Published When

A user invitation is sent.

Possible Consumers

- Notification Module

---

# Identity Events

## UserRegistered

Published When

A new user registers.

Possible Consumers

- Email Module
- Analytics

---

## EmailVerified

Published When

User verifies email.

Possible Consumers

- Organization Module

---

# Lead Events

## LeadCreated

Published When

A new Lead enters the system.

Possible Consumers

- Activity Module
- Notification Module
- Reporting Module
- Automation Module (Future)
- AI Module (Future)

Business Value

Every new Lead automatically becomes visible across the platform.

---

## LeadUpdated

Published When

Lead information changes.

---

## LeadAssigned

Published When

Ownership changes.

Possible Consumers

- Notification Module
- Activity Module

Business Value

Sales agents are immediately informed.

---

## LeadArchived

Published When

Lead is archived.

---

# Pipeline Events

## StageChanged

Published When

Lead moves between stages.

Possible Consumers

- Activity Module
- Reporting Module

Business Value

Track sales progress.

---

# Task Events

## TaskCreated

Published When

A follow-up task is created.

---

## TaskCompleted

Published When

Task is completed.

Possible Consumers

- Activity Module
- Reporting Module

Business Value

Measure team productivity.

---

# Activity Events

## NoteAdded

Published When

User adds a note.

---

# Form Events

## FormSubmitted

Published When

Customer submits a public form.

Possible Consumers

- Lead Module

Business Value

Convert visitors into Leads.

---

# Conversation Events

## ConversationStarted

Published When

First customer interaction begins.

---

## MessageReceived

Published When

Customer sends a message.

Possible Consumers

- Notification Module

---

# Notification Events

## NotificationSent

Published When

System delivers notification.

---

# Subscription Events

## TrialStarted

Published When

New organization starts trial.

---

## SubscriptionUpgraded

Published When

Customer upgrades plan.

---

# Example Event Flow

Website Visitor

↓

Form Submitted

↓

FormSubmitted Event

↓

Lead Module creates Lead

↓

LeadCreated Event

↓

Activity Module records timeline

↓

Notification Module alerts Sales Agent

↓

Reporting Module updates dashboard

↓

Future AI Module scores Lead

---

# Event Naming Convention

Use past tense.

Examples

✅ LeadCreated

✅ LeadAssigned

✅ TaskCompleted

✅ StageChanged

Avoid

❌ CreateLead

❌ AssignLead

❌ UpdateLead

---

# MVP Events

Critical

- OrganizationCreated
- UserRegistered
- EmailVerified
- LeadCreated
- LeadAssigned
- LeadUpdated
- StageChanged
- TaskCreated
- TaskCompleted
- NoteAdded
- FormSubmitted
- MembershipCreated
- MembershipRemoved
- RoleAssigned

## RoleRemoved

# Future Events

- LeadScored
- WorkflowExecuted
- AIReplyGenerated
- CampaignStarted
- EmailOpened
- SMSDelivered

## Core Domains

Identity & Access
Organization
Lead
Pipeline
Activity
Task
Forms
Conversation
Integration
Subscription

## Supporting Domains

Notification
Dashboard

## Future Domains

Contact
Assignment
Timeline
Search
Reporting
Automation
AI
Billing

## Core Domains

Identity & Access
Organization
Lead
Pipeline
Activity
Task
Forms
Conversation
Integration
Subscription

## Supporting Domains

Notification
Dashboard

## Future Domains

Contact
Assignment
Timeline
Search
Reporting
Automation
AI
Billing
