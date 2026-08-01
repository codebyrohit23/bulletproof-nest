# Organization Capability

Status: Approved ✅

---

# Purpose

The Organization capability is the foundation of LeadFlow AI's multi-tenant architecture.

Every customer uses LeadFlow AI through an Organization.

All business data belongs to an Organization.

Users never own business data directly.

Organizations own the data.

---

# Business Goal

Allow businesses to securely manage their own workspace while completely isolating their data from other customers.

The Organization capability is responsible for:

- Workspace management
- Member management
- Roles & Permissions
- Invitations
- Organization lifecycle

---

# Core Principles

- Every Organization is an isolated workspace.
- A user can create multiple organizations.
- A user can belong to multiple organizations.
- Organizations own all business data.
- Permissions are evaluated inside an organization.
- Every organization must always have at least one active owner.

---

# Owns

- Organization
- Organization Membership
- Organization Role
- Organization Invitation

---

# Does NOT Own

- Authentication
- Billing
- Subscription
- Teams
- Leads
- Contacts
- Pipelines
- Conversations
- Settings
- Files

Those capabilities reference Organization but are managed independently.

---

# Business Rules

- One user can create multiple organizations.
- One user can belong to multiple organizations.
- Organizations can have multiple owners.
- Ownership is determined by Membership + Role.
- The last owner cannot leave the organization.
- Organizations are archived before permanent deletion.
- Trial starts after organization creation.
- Organization context is provided per request.

---

# Main Workflows

- Create Organization
- Rename Organization
- Update Organization Profile
- Archive Organization
- Restore Organization
- Invite Member
- Accept Invitation
- Remove Member
- Transfer Ownership

---

# Future Scope

- Organization Templates
- Multi Business Groups
- White Label
- Organization Branding
- Custom Domains
- Enterprise Policies
- Organization Merge
- Organization Export

---

# Status

Approved ✅

Frozen ✅
