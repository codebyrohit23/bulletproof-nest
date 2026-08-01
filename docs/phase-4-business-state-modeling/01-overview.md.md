# Business State Modeling

## Purpose

This document explains how LeadFlow AI models the lifecycle of its core business resources.

Every important business resource changes over time.

These changes are represented using business states.

Business states define what an entity currently is and what actions are allowed.

They are the foundation for business rules, authorization, workflows, APIs, domain events, and future automation.

---

# What is a Business State?

A business state represents the current condition of a business resource.

Examples

- Identity is waiting for email verification.
- Organization is in trial.
- Membership is invited.
- Lead is qualified.
- Task is completed.

A state answers:

"What is happening in the business right now?"

---

# Why State Modeling?

Without clearly defined states:

- Invalid transitions become possible.
- Business rules become scattered across services.
- APIs become inconsistent.
- Automation becomes difficult.
- Authorization rules become harder to maintain.

---

# State Design Principles

- Every resource has a lifecycle.
- A resource can only be in one state at a time.
- State transitions must follow business rules.
- Invalid transitions must be rejected.
- Every transition should generate a domain event when appropriate.
- State names should reflect business language.

---

# State Transition Rules

Every state transition should answer:

- Who initiated the transition?
- Why did it happen?
- Is it allowed?
- Should it trigger an event?
- Should it create an activity?
- Should users be notified?

---

# Example

Lead

New

↓

Contacted

↓

Qualified

↓

Site Visit

↓

Negotiation

↓

Won

or

Lost

A Lead cannot move directly from "New" to "Won" unless a business rule explicitly allows it.

---

# Benefits

State modeling helps:

- Keep business rules consistent.
- Simplify backend implementation.
- Improve testing.
- Support future automation.
- Support AI workflows.
- Maintain data integrity.

---

# Scope

The following resources will have state models:

- Identity
- Organization
- Membership
- Subscription
- Lead
- Task

Additional resources may be added in future versions.
