# Organization Settings

Status: Draft 🟡

---

## Purpose

Defines organization-specific application configuration.

Organization Settings control how the application behaves for an organization.

This entity is intentionally postponed until features requiring configuration are implemented.

---

## Future Features

- Automation
- Scheduling
- Calendar
- Billing
- Branding
- Localization
- White Label

---

## Proposed Columns

| Column          | Type         | Required | Description            |
| --------------- | ------------ | -------- | ---------------------- |
| organization_id | UUID v7      | ✅       | Organization           |
| timezone        | varchar(100) | ❌       | IANA timezone          |
| currency        | varchar(10)  | ❌       | Default currency       |
| language        | varchar(10)  | ❌       | Default language       |
| date_format     | varchar(30)  | ❌       | Date display format    |
| time_format     | varchar(20)  | ❌       | 12h / 24h              |
| week_starts_on  | WeekDay      | ❌       | Calendar configuration |
| business_hours  | jsonb        | ❌       | Working schedule       |
| created_at      | timestamptz  | ✅       | Creation timestamp     |
| updated_at      | timestamptz  | ✅       | Last update            |

---

## Business Rules

- One Organization has one Settings record.
- Settings configure behavior.
- Settings do not define organization identity.
- Settings are optional until required by a feature.

---

## Ownership

Organization

---

## Status

Draft 🟡

Not implemented.
