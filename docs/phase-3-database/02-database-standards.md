# Database Standards

## Purpose

This document defines the database standards used throughout LeadFlow AI.

Every table, column, index, constraint, relationship, and migration should follow these standards.

Consistency is more important than personal preference.

---

# Database Engine

PostgreSQL

Reason

- Mature
- Reliable
- Excellent indexing
- JSON support
- Full-text search
- Extensions
- Enterprise ready

---

# ORM

Prisma

Reason

- Type Safety
- Excellent Developer Experience
- Migrations
- Strong TypeScript Support

---

# ID Strategy

Primary Keys

UUID v7 (preferred)

Fallback

UUID v4

Reason

- Globally unique
- API safe
- Future distributed systems
- Better than auto increment IDs

---

# Table Naming

Use

Plural

Examples

users

organizations

leads

tasks

activities

forms

fields

submissions

Avoid

User

LeadTable

tbl_users

---

# Column Naming

Use

snake_case

Examples

created_at

updated_at

organization_id

assigned_user_id

phone_number

Avoid

createdAt

CreatedAt

phoneNumber

---

# Primary Key

Always

id

UUID

Example

id UUID PRIMARY KEY

---

# Foreign Keys

Always

entity_id

Examples

organization_id

lead_id

user_id

task_id

---

# Timestamp Columns

Every business table must contain

created_at

updated_at

Future

deleted_at

---

# Audit Columns

Business tables should include

created_by

updated_by

Future

deleted_by

---

# Soft Delete

Use

deleted_at

Never permanently delete business data unless legally required.

---

# Boolean Naming

Use

is\_

Examples

is_active

is_verified

is_deleted

Avoid

active

verified

---

# Enum Strategy

Use PostgreSQL enums only when values are stable.

Examples

subscription_status

Future values that change frequently should use lookup tables instead.

---

# JSON Usage

Use JSON only when relational modeling is not practical.

Examples

Webhook payload

Provider metadata

Avoid storing business relationships in JSON.

---

# Relationships

Prefer Foreign Keys.

Avoid storing IDs inside JSON arrays.

---

# Index Naming

Format

idx*<table>*<column>

Examples

idx_leads_phone_number

idx_tasks_due_date

---

# Foreign Key Naming

Format

fk*<table>*<referenced_table>

Example

fk_leads_organizations

---

# Unique Constraint Naming

Format

uq*<table>*<column>

Example

uq_users_email

---

# Check Constraint Naming

Format

chk*<table>*<rule>

Example

chk_users_email

---

# Migration Rules

One business change

↓

One migration

Migration names should explain business intent.

Example

create_leads_table

add_pipeline_to_leads

---

# Seed Rules

Never mix seed data with migrations.

Use dedicated seed scripts.

---

# Security Standards

Never store

Passwords

Tokens

Secrets

in plain text.

Always hash or encrypt sensitive values.

---

# Multi-Tenant Rule

Every business table should contain

organization_id

unless it represents global system data.

---

# Global Tables

Examples

countries

permissions

plans

These do not require organization_id.

---

# Documentation Rule

Every new table must have

- Business Purpose
- Owner
- Relationships
- Constraints
- Indexes
