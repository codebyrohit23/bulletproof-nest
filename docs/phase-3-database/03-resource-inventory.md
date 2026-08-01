# Resource Inventory

## Purpose

This document identifies every major business resource managed by LeadFlow AI.

A resource represents a business object that the platform stores, manages, or exposes through APIs.

The goal is to identify what the system owns before designing database tables.

---

# What is a Resource?

A resource is something that has:

- Business value
- Identity
- Lifecycle
- Ownership

Resources eventually become database tables and REST API resources.

---

# Resource Categories

## Tenant Resources

Owned by an Organization.

## System Resources

Owned by the platform.

Shared across every Organization.

---

# Tenant Resources

## Organization

Purpose

Represents a customer company.

Business Value

Tenant boundary.

Priority

Critical

---

## User

Purpose

Represents an employee of an organization.

Priority

Critical

---

## Lead

Purpose

Represents a potential customer.

Business Value

The most important resource in the MVP.

Priority

Critical

---

## Pipeline

Purpose

Defines the organization's sales workflow.

Priority

Critical

---

## Stage

Purpose

Represents a pipeline step.

Priority

Critical

---

## Task

Purpose

Represents a follow-up activity.

Priority

Critical

---

## Activity

Purpose

Records business history.

Priority

Critical

---

## Note

Purpose

Stores additional information.

Priority

Important

---

## Website

Purpose

Represents an organization's website.

Priority

Important

---

## Form

Purpose

Collect Lead information.

Priority

Important

---

## Field

Purpose

Defines configurable inputs.

Priority

Important

---

## Submission

Purpose

Stores customer submitted data.

Priority

Important

---

## Conversation

Purpose

Stores customer communication.

Priority

Future MVP+

---

## Message

Purpose

Stores individual communications.

Priority

Future MVP+

---

## Notification

Purpose

Notifies users about business events.

Priority

Important

---

## Integration

Purpose

Represents an external provider.

Priority

Future MVP+

---

## Subscription

Purpose

Represents an organization's active plan.

Priority

Important

---

# System Resources

## Permission

Purpose

Global permission definitions.

---

## Plan

Purpose

Subscription plans.

---

## Country

Purpose

Reference data.

---

## Future Resources

Not included in MVP.

- Customer
- Deal
- Campaign
- Workflow
- Automation
- AI Agent
- AI Conversation
- Knowledge Base
- API Key
- Webhook
- Custom Objects

---

# Resource Ownership

| Resource     | Owner        |
| ------------ | ------------ |
| Organization | Platform     |
| User         | Organization |
| Lead         | Organization |
| Pipeline     | Organization |
| Stage        | Pipeline     |
| Activity     | Lead         |
| Task         | Lead         |
| Form         | Website      |
| Field        | Form         |
| Submission   | Form         |
| Conversation | Organization |
| Message      | Conversation |
| Notification | User         |
| Subscription | Organization |

---

# MVP Resource Checklist

Critical

- Organization
- User
- Lead
- Pipeline
- Stage
- Task
- Activity

Important

- Website
- Form
- Submission
- Notification
- Subscription

Future

- Conversation
- Integration
- Customer
- Workflow
- AI
