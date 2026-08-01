# Multi-Tenant Strategy

## Purpose

This document defines how tenant isolation is implemented in LeadFlow AI.

LeadFlow AI is a multi-tenant SaaS platform.

Every Organization is a tenant.

The goal is to provide complete data isolation while keeping the architecture simple, scalable, and cost-effective.

---

# Tenant Definition

A tenant represents a customer organization.

Every organization has:

- Users
- Memberships
- Leads
- Pipelines
- Tasks
- Activities
- Forms
- Integrations
- Subscription

Each tenant must remain completely isolated from every other tenant.

---

# Chosen Strategy

Shared Database

Shared Schema

Tenant Isolation using organization_id.

---

# Why This Strategy?

## Business Benefits

- Lower infrastructure cost
- Easier deployment
- Easier backups
- Easier migrations
- Faster development
- Supports thousands of organizations

---

## Technical Benefits

- Single migration pipeline
- Shared indexes
- Simple monitoring
- Easy horizontal scaling
- Easy reporting

---

# Tenant Ownership

Every business record belongs to an Organization.

Examples

Organization

↓

Lead

↓

Task

↓

Activity

↓

Form

↓

Submission

---

# Global Resources

The following resources are shared by every organization.

- Users (Global Identity)
- Permissions
- Plans
- Countries

These tables do NOT contain organization_id.

---

# Organization Resources

These tables always contain organization_id.

- Memberships
- Leads
- Pipelines
- Stages
- Tasks
- Activities
- Notes
- Forms
- Websites
- Notifications
- Integrations

---

# Tenant Resolution

Every authenticated request must resolve:

Current User

↓

Current Organization

↓

Membership

↓

Roles

↓

Permissions

No business operation should execute until the active organization is resolved.

---

# Authorization Flow

Request

↓

JWT Validation

↓

Resolve User

↓

Resolve Active Organization

↓

Resolve Membership

↓

Load Roles

↓

Load Permissions

↓

Authorize Request

↓

Execute Business Logic

---

# Data Isolation Rules

Organizations must never access another organization's data.

Every query involving tenant-owned resources must include organization_id.

Example

SELECT \*

FROM leads

WHERE organization_id = currentOrganizationId

---

# Background Jobs

Every queued job must include:

- organization_id
- user_id (if applicable)

Workers must resolve the tenant before executing business logic.

---

# Cache Strategy

Every cache key should include the tenant.

Example

organization:{organizationId}:lead:{leadId}

organization:{organizationId}:dashboard

---

# Event Strategy

Every domain event should include:

- organization_id
- event_id
- timestamp

This allows consumers to remain tenant-aware.

---

# Future Scalability

The chosen strategy should support:

- Millions of Leads
- Thousands of Organizations
- Multiple Regions
- Read Replicas
- Sharding (Future)

without changing the business model.

---

# Architecture Decision

LeadFlow AI uses a shared database and shared schema with tenant isolation based on organization_id.

This strategy provides the best balance between scalability, operational simplicity, and development speed for the MVP and long-term product vision.
