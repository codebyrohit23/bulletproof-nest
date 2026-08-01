ADR-002 ✅ Accepted
RBAC Design

Decision

Permissions are global.

Roles belong to Organizations.

Users receive permissions through their Organization Membership.

Platform
│
├── Users (Global Identity)
├── Permissions (Global)
│
└── Organizations
│
├── Memberships
│ ├── Status
│ ├── Joined Date
│ └── Active Context
│
├── Roles (Organization Scoped)
│
├── Leads
├── Pipelines
├── Tasks
├── Activities
├── Forms
├── Integrations
└── Subscription
