# Core Entities

## Purpose

This document identifies the core business entities of LeadFlow AI.

Entities represent the most important business objects that have their own identity and lifecycle.

These entities will later become database tables, backend models, repositories, services, and APIs.

This document focuses only on the business meaning of each entity.

---

# What is an Entity?

An Entity is a business object that:

- Has a unique identity.
- Exists over time.
- Can change while keeping the same identity.
- Represents an important part of the business.

Example:

A Lead changes its phone number, owner, and pipeline stage.

It is still the same Lead.

---

# Core Business Entity

## Lead

### Business Purpose

A Lead represents a potential customer.

The entire platform exists to help organizations convert Leads into paying Customers.

### Why It Exists

Without Leads, LeadFlow AI has no business value.

Everything else supports the Lead lifecycle.

### Owned By

Organization

### Related To

- User
- Pipeline
- Task
- Activity
- Conversation
- Form Submission

---

# Organization

### Business Purpose

Represents a customer company using LeadFlow AI.

Every piece of business data belongs to an Organization.

### Why It Exists

LeadFlow AI is a multi-tenant SaaS.

Organization is the tenant boundary.

### Owns

- Users
- Leads
- Pipelines
- Forms
- Reports
- Settings

---

# User

### Business Purpose

Represents a person working inside an Organization.

Users perform business actions.

Users never own business data.

Organizations own business data.

### Examples

- Owner
- Admin
- Sales Manager
- Sales Agent

---

# Role

### Business Purpose

Defines what a User is allowed to do.

---

# Permission

### Business Purpose

Represents a single business action.

Examples

- Create Lead
- Delete Lead
- Invite User
- View Reports

---

# Pipeline

### Business Purpose

Represents the sales process used by an Organization.

A Lead always moves through a Pipeline.

---

# Stage

### Business Purpose

Represents one step inside a Pipeline.

Example

- New
- Contacted
- Qualified
- Site Visit
- Negotiation
- Won
- Lost

---

# Task

### Business Purpose

Represents a follow-up action assigned to a User.

Tasks help ensure that no Lead is forgotten.

---

# Activity

### Business Purpose

Represents an important business event.

Examples

- Lead Created
- Lead Assigned
- Stage Changed
- Task Completed

Activities create the Lead Timeline.

---

# Note

### Business Purpose

Stores additional information about a Lead.

Notes improve collaboration between team members.

---

# Form

### Business Purpose

Collect lead information from customers.

Forms are fully configurable.

---

# Field

### Business Purpose

Represents one input inside a Form.

Examples

- Name
- Email
- Phone
- Budget

---

# Submission

### Business Purpose

Stores information submitted through a Form.

A Submission usually creates or updates a Lead.

---

# Conversation

### Business Purpose

Represents communication between the business and a customer.

---

# Message

### Business Purpose

Represents one communication inside a Conversation.

---

# Notification

### Business Purpose

Notifies Users about important business events.

Examples

- Lead Assigned
- Task Assigned
- Reminder

---

# Integration

### Business Purpose

Represents a connection to an external platform.

Examples

- Facebook Lead Ads
- WhatsApp Business
- Google Calendar

---

# Website

### Business Purpose

Represents a website connected to LeadFlow AI.

A Website can contain multiple Forms.

---

# Subscription

### Business Purpose

Represents an Organization's active pricing plan.

---

# Entity Ownership Summary

| Entity                  | Owned By     |
| ----------------------- | ------------ |
| Organization            | System       |
| Organization Membership | Organization |
| User                    | Organization |
| Role                    | Organization |
| Permission              | System       |
| Lead                    | Organization |
| Pipeline                | Organization |
| Stage                   | Pipeline     |
| Activity                | Lead         |
| Task                    | Lead         |
| Note                    | Lead         |
| Form                    | Website      |
| Field                   | Form         |
| Submission              | Form         |
| Conversation            | Lead         |
| Message                 | Conversation |
| Notification            | User         |
| Website                 | Organization |
| Integration             | Organization |
| Subscription            | Organization |

---

# MVP Entity Priority

## Critical

- Organization
- User
- Lead
- Pipeline
- Stage
- Task
- Activity

## Important

- Form
- Submission
- Notification
- Website

## Later

- Conversation
- Message
- Integration
- Subscription
