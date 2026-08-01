# MVP Scope

## Purpose

This document defines the exact scope of the Minimum Viable Product (MVP).

The objective is to build the smallest production-ready version of LeadFlow AI that delivers real business value and can acquire the first paying customers.

Every feature included in the MVP must directly improve lead conversion.

Features that do not contribute to lead conversion should be postponed.

---

# MVP Goal

Acquire the first 10 paying Real Estate Agencies by solving their lead management and lead conversion problems.

---

# Target Customer

Primary Market

- Real Estate Agencies

Future Markets

- Marketing Agencies
- Insurance
- Solar
- Recruitment
- Coaching
- SaaS

---

# MVP Features

## Authentication

- User Registration
- Login
- Logout
- Email Verification
- Forgot Password
- Reset Password
- JWT Authentication
- Refresh Tokens

---

## Organization

- Create Organization
- Organization Settings
- Invite Members
- Remove Members

---

## Users

- User Management
- User Profile
- User Status

---

## Roles & Permissions

- Owner
- Admin
- Sales Manager
- Sales Agent

Basic RBAC

---

## Lead Management

- Create Lead
- Update Lead
- Delete Lead (Soft Delete)
- View Lead
- Assign Lead
- Search Lead
- Filter Leads

---

## Lead Sources

- Website
- Facebook
- WhatsApp
- Manual Entry

---

## Pipeline

- Default Pipeline
- Pipeline Stages
- Move Lead Between Stages

---

## Lead Timeline

Track every important event.

Examples

- Lead Created
- Lead Assigned
- Note Added
- Stage Changed
- Task Completed

---

## Notes

- Create Note
- Edit Note
- Delete Note

---

## Tasks

- Create Task
- Assign Task
- Complete Task
- Due Date

---

## Forms

- Create Form
- Dynamic Fields
- Public Form
- Form Submission

---

## Notifications

- Lead Assigned
- Task Assigned
- Due Reminder

---

## Dashboard

- Total Leads
- Leads by Stage
- Assigned Leads
- Today's Tasks

---

## Reports

Basic Reports

- Total Leads
- Won Leads
- Lost Leads
- Conversion Rate

---

## Settings

- Organization Settings
- Profile Settings

---

# Features Postponed

These features are intentionally excluded from the MVP.

## AI

- AI Auto Reply
- AI Lead Qualification
- AI Proposal Generator
- AI Call Analysis

---

## Automation

- Workflow Builder
- Campaign Automation
- Email Automation
- SMS Automation

---

## CRM

- Deals
- Quotes
- Invoices
- Products
- Inventory

---

## Enterprise

- White Label
- SSO
- API Marketplace
- Custom Objects
- Multi Business
- Audit Dashboard

---

## Mobile

- Android App
- iOS App

---

# MVP Success Criteria

The MVP is considered successful if:

- Agencies can manage all leads in one place.
- Every lead has an owner.
- Every lead has a timeline.
- Teams can collaborate.
- Website forms generate leads automatically.
- Lead response time decreases.
- Follow-ups are never missed.

---

# Future Roadmap

## Phase 2

- WhatsApp Integration
- Facebook Lead Ads
- Unified Inbox
- Calendar
- Billing

---

## Phase 3

- Workflow Builder
- Marketing Automation
- Mobile App

---

## Phase 4

- AI Assistant
- AI Sales Agent
- AI Analytics
- AI Forecasting

---

# Guiding Principle

Build only what helps customers convert more leads.

Everything else can wait.

# Note

Architecture supports multi-organization users.

The MVP UI may expose only one active organization initially.

Organization switching can be enabled later without database changes.
