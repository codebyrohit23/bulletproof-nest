# User Journey

## Purpose

The purpose of this document is to define how users interact with LeadFlow AI from the moment they enter the platform until they complete important business actions.

Instead of focusing on APIs or database design, this document focuses on user actions and how the system should respond. These journeys will later help design the database, backend architecture, APIs, notifications, events, and automation.

---

# Core User Journeys

## 1. Organization Signup

### Goal

Allow a new business to create an account and start using LeadFlow AI.

### User Flow

```
Visitor
    │
    ▼
Open Signup Page
    │
    ▼
Enter Name
    │
    ▼
Enter Email
    │
    ▼
Create Password
    │
    ▼
Click Sign Up
```

### System Flow

```
Validate Request
        │
        ▼
Check Existing Email
        │
        ▼
Create User (Global Identity)
        │
        ▼
Send Verification Email
        │
        ▼
Verify Email
        │
        ▼
Create Organization
        │
        ▼
Create Organization Membership
        │
        ▼
Assign Owner Role
        │
        ▼
Create Subscription
        │
        ▼
    Dashboard
        │
        ▼
Create Default Pipeline
        │
        ▼
Create Default Settings
        │
        ▼
Generate Tokens
        │
        ▼
Open Dashboard
```

### Success

- User successfully enters dashboard.
- Organization is ready.
- Default data is created.

### Failure

- Email already exists.
- Invalid email.
- Weak password.
- Verification expired.

### Future

- Guided onboarding
- AI onboarding assistant

---

# 2. Invite Team Member

### Goal

Allow owners to invite employees into their organization.

### User Flow

```
Owner
   │
   ▼
Open Team
   │
   ▼
Invite User
   │
   ▼
Enter Email
   │
   ▼
Select Role
   │
   ▼
Send Invitation
```

### System Flow

```
Validate Permission
        │
        ▼
Create Invitation
        │
        ▼
Send Email
        │
        ▼
User Accepts
        │
        ▼
Join Organization
```

---

# 3. Website Lead Capture

### Goal

Convert website visitors into leads.

### User Flow

```
Visitor
   │
   ▼
Open Website
   │
   ▼
Fill Form
   │
   ▼
Submit
```

### System Flow

```
Validate Form
        │
        ▼
Verify Turnstile
        │
        ▼
Spam Check
        │
        ▼
Duplicate Check
        │
        ▼
Store Submission
        │
        ▼
Create Lead
        │
        ▼
Assign Lead
        │
        ▼
Create Timeline
        │
        ▼
Notify User
```

---

# 4. Manual Lead Creation

### Goal

Allow sales agents to manually add leads.

### User Flow

```
Sales Agent
      │
      ▼
Click Add Lead
      │
      ▼
Fill Details
      │
      ▼
Save
```

### System Flow

```
Validate
      │
      ▼
Create Lead
      │
      ▼
Assign Owner
      │
      ▼
Create Activity
      │
      ▼
Update Timeline
```

---

# 5. Lead Assignment

### Goal

Assign a lead to a sales agent.

### User Flow

```
Manager
    │
    ▼
Open Lead
    │
    ▼
Assign User
    │
    ▼
Save
```

### System Flow

```
Validate Permission
        │
        ▼
Update Lead Owner
        │
        ▼
Create Activity
        │
        ▼
Create Timeline
        │
        ▼
Notify Agent
```

---

# 6. Lead Follow-up

### Goal

Record every customer interaction.

### User Flow

```
Sales Agent
      │
      ▼
Open Lead
      │
      ▼
Call Customer
      │
      ▼
Add Note
      │
      ▼
Create Follow-up Task
```

### System Flow

```
Save Note
      │
      ▼
Create Activity
      │
      ▼
Update Timeline
      │
      ▼
Create Task
```

---

# 7. Move Pipeline Stage

### Goal

Track lead progress.

### User Flow

```
Lead
 │
 ▼
New
 │
 ▼
Contacted
 │
 ▼
Qualified
 │
 ▼
Site Visit
 │
 ▼
Negotiation
 │
 ▼
Won / Lost
```

### System Flow

```
Validate Stage
        │
        ▼
Update Lead
        │
        ▼
Create Activity
        │
        ▼
Update Timeline
```

---

# 8. Complete Task

### Goal

Track completed follow-ups.

### User Flow

```
Sales Agent
      │
      ▼
Open Task
      │
      ▼
Mark Complete
```

### System Flow

```
Update Task
      │
      ▼
Create Activity
      │
      ▼
Update Timeline
```

---

# 9. Receive WhatsApp Message (Future)

### User Flow

```
Customer
    │
    ▼
Send WhatsApp Message
```

### System Flow

```
Receive Webhook
        │
        ▼
Find Lead
        │
        ▼
Store Message
        │
        ▼
Update Conversation
        │
        ▼
Notify Assigned User
```

---

# Business Events Identified

- User Registered
- Email Verified
- Organization Created
- Team Member Invited
- Lead Created
- Lead Assigned
- Lead Updated
- Stage Changed
- Task Created
- Task Completed
- Note Added
- Activity Created
- Notification Sent
- Form Submitted
- Conversation Started
- Message Received

---

# Key Takeaways

From these journeys we identified:

- Core business workflows
- User actions
- System actions
- Business events
- Future automation opportunities

These journeys will become the foundation for:

- Business Rules
- Domain Model
- Database Design
- API Design
- Backend Architecture
- Event System
- Notification System
