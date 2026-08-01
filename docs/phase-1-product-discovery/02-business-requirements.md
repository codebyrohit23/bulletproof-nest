## Purpose

This document defines the functional and non-functional requirements for the LeadFlow AI MVP.

Its purpose is to ensure that product, design, frontend, and backend teams have a shared understanding of what will be built before development begins.

## Business Goal

The primary goal of the MVP is to help businesses convert more leads by organizing lead management into a single platform.

The system should reduce lead response time, improve follow-up consistency, and provide visibility into the sales pipeline.

## Business Goal

The primary goal of the MVP is to help businesses convert more leads by organizing lead management into a single platform.

The system should reduce lead response time, improve follow-up consistency, and provide visibility into the sales pipeline.

## Functional Requirements

### Authentication

- User can sign up.
- User can log in.
- User can reset password.
- User can verify email.

### Organization

- Create organization.
- Invite team members.
- Manage organization settings.

### Leads

- Create lead.
- Edit lead.
- Assign lead.
- Move lead through pipeline.
- Add notes.
- View activity timeline.

### Pipeline

- Create stages.
- Move leads between stages.

### Tasks

- Create follow-up tasks.
- Assign tasks.
- Mark tasks complete.

### Forms

- Create forms.
- Configure dynamic fields.
- Receive submissions.

### Notifications

- Notify users when leads are assigned.

## Non Functional Requirements

- Response time should be under 300ms for common requests.
- APIs should follow REST standards.
- Every API must be versioned.
- System must support multi-tenancy.
- Passwords must be securely hashed.
- JWT authentication will be used.
- Refresh token rotation should be supported.
- Every business action should be logged.
- APIs should support horizontal scaling.

## Assumptions

- Every customer is an Organization.
- Every organization has at least one Owner.
- Every lead belongs to one organization.
- Every user belongs to one organization.
- Every lead has one current stage.

## Success Criteria

- Agencies can manage all leads in one system.
- Team members can collaborate.
- Managers can track pipeline progress.
- No lead is left unassigned.
- Website forms create leads successfully.

## Out of Scope

- AI chatbot
- Email marketing
- SMS campaigns
- White labeling
- Custom CRM objects
- Public API marketplace
- Advanced workflow builder

## Risks

- Facebook API changes.
- WhatsApp Business approval delays.
- Customers expecting CRM features.
- Scope creep during MVP development.
