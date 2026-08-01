# Entity Relationships

## Purpose

This document defines how the core business entities of LeadFlow AI relate to one another.

These relationships represent business ownership and responsibilities, not database implementation.

The goal is to understand the business model before designing tables and foreign keys.

---

# Relationship Principles

- Every relationship should exist because of a business requirement.
- Relationships should reflect ownership.
- Organization is the tenant boundary.
- Users perform actions.
- Leads represent business opportunities.
- Activities record history.
- Tasks ensure follow-ups.

---

# Organization

Organization
│
├── Users
├── Teams
├── Pipelines
├── Forms
├── Websites
├── Leads
├── Reports
├── Settings
├── Integrations
└── Subscription

Business Meaning

An Organization owns all business data.

Nothing exists outside an Organization.

---

# User

User
│
├── belongs to Organization
├── has Role
├── assigned Leads
├── assigned Tasks
├── receives Notifications
└── creates Activities

Business Meaning

Users perform business actions.

Users never own company data.

---

# Lead

Lead
│
├── belongs to Organization
├── assigned to User
├── belongs to Pipeline
├── current Stage
├── has Activities
├── has Notes
├── has Tasks
├── has Conversations
├── originated from Submission
└── has Lead Source

Business Meaning

Lead is the central business object of the MVP.

Everything exists to move a Lead toward becoming a customer.

---

# Pipeline

Pipeline
│
├── belongs to Organization
└── contains Stages

Business Meaning

Pipelines define the organization's sales process.

---

# Stage

Stage
│
└── contains Leads

Business Meaning

Stages represent the current progress of a Lead.

---

# Task

Task
│
├── belongs to Lead
├── assigned to User
└── created by User

Business Meaning

Tasks ensure that no Lead is forgotten.

---

# Activity

Activity
│
├── belongs to Lead
├── created by User
└── appears in Timeline

Business Meaning

Every important action should generate an Activity.

Activities provide a complete audit trail of a Lead.

---

# Note

Note
│
├── belongs to Lead
└── created by User

Business Meaning

Notes help teams collaborate without losing context.

---

# Website

Website
│
└── contains Forms

Business Meaning

Organizations may connect multiple websites.

---

# Form

Form
│
├── belongs to Website
├── contains Fields
└── receives Submissions

Business Meaning

Forms collect Lead information.

---

# Field

Field
│
└── belongs to Form

Business Meaning

Fields make Forms fully configurable.

---

# Submission

Submission
│
├── belongs to Form
└── creates or updates Lead

Business Meaning

A Submission represents customer-provided information.

---

# Conversation

Conversation
│
├── belongs to Lead
└── contains Messages

Business Meaning

A Conversation stores all customer communication.

---

# Message

Message
│
└── belongs to Conversation

Business Meaning

A Message is one interaction between the customer and the business.

---

# Notification

Notification
│
└── belongs to User

Business Meaning

Notifications keep users informed about important events.

---

# Integration

Integration
│
└── belongs to Organization

Business Meaning

Integrations connect LeadFlow AI with external services.

---

# Subscription

Subscription
│
└── belongs to Organization

Business Meaning

Subscriptions determine available features and billing.

---

# Relationship Summary

Organization
│
├── Memberships
│
├── Users
│
├── Leads
│ ├── Activities
│ ├── Notes
│ ├── Tasks
│ ├── Conversations
│ └── Pipeline Stage
│
├── Pipelines
│ └── Stages
│
├── Websites
│ └── Forms
│ ├── Fields
│ └── Submissions
│
├── Integrations
│
├── Reports
│
└── Subscription

---

# Design Decisions

- Organizations own business data.
- Users perform actions but do not own business data.
- Leads are the central entity in the MVP.
- Activities provide complete history.
- Tasks ensure follow-up discipline.
- Forms generate Leads.
- Conversations centralize communication.
- Integrations should remain provider-independent.
