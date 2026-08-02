# Tenant Management Module Implementation Specification

## Context

You are implementing the **Tenant Management** module for **FinCRM**, a production-grade multi-tenant SaaS CRM.

Completed modules:

* Authentication (Supabase Auth)
* Authorization (RBAC)

Every authenticated request already contains:

* req.user
* req.role
* req.permissions
* req.tenant

Do not modify Authentication or Authorization unless integration requires it.

---

# Objective

Implement complete tenant (organization) management.

A tenant represents one company using FinCRM.

Every resource in the CRM belongs to exactly one tenant.

The tenant module becomes the root of the application's business hierarchy.

---

# Responsibilities

The Tenant module is responsible for:

* Tenant information
* Tenant settings
* Tenant activation
* Tenant suspension
* Tenant limits
* Tenant branding
* Tenant metadata

It is NOT responsible for:

* Authentication
* User login
* Roles
* Employees
* Clients
* Tasks

---

# Existing Database

Current entities

* tenants
* users
* roles
* permissions
* role_permissions

Extend the tenant model where appropriate.

---

# Tenant Model

Support the following information.

Identity

* id
* name
* slug

Status

* Active
* Suspended
* Archived

Branding

* Logo URL
* Primary Color
* Timezone
* Currency
* Locale

Subscription

* Plan
* User Limit
* Storage Limit

Audit

* Created At
* Updated At

---

# Slug

Every tenant must have a unique slug.

Examples

acme

zoho

finflow

The slug should be immutable after creation unless explicitly updated.

---

# Settings

Each tenant should support configurable settings.

Examples

* Default currency
* Date format
* Time format
* Timezone
* Week starts on
* Fiscal year start
* Invoice numbering prefix
* Employee ID prefix

Design the model so additional settings can be added later.

---

# Tenant Lifecycle

Supported states

Active

Normal operation.

Suspended

Users cannot access the CRM.

Archived

Historical data only.

Deleted tenants are not supported.

Use soft lifecycle management.

---

# Authorization

Only users with

tenant.manage

may:

* Update tenant
* Suspend tenant
* Reactivate tenant
* Update settings
* Update branding

Normal employees must never modify tenant information.

---

# API Endpoints

Implement

GET /tenant

Returns current tenant.

PUT /tenant

Update tenant information.

PATCH /tenant/settings

Update settings.

PATCH /tenant/status

Suspend or reactivate tenant.

PATCH /tenant/branding

Update logo, colors, etc.

GET /tenant/limits

Returns subscription limits.

---

# Validation

Validate

* Slug uniqueness
* Required fields
* Valid timezone
* Supported currency
* Supported locale

Reject invalid updates.

---

# Multi-Tenant Rules

Every request must automatically operate only on

req.tenant.id

Never allow a tenant to access another tenant.

Never accept tenant_id from request body when updating current tenant.

Always derive tenant from authentication context.

---

# Subscription Limits

Prepare architecture for future billing.

Support limits such as

Maximum users

Maximum clients

Maximum tasks

Maximum storage

The module should expose these limits even if billing is not yet implemented.

---

# Branding

Support

* Logo
* Company name
* Theme color
* Timezone
* Currency
* Locale

Do not implement file uploads.

Only support metadata.

---

# Services

Create a dedicated service layer.

Responsibilities include

* Fetch tenant
* Update tenant
* Update settings
* Validate limits
* Suspend tenant
* Activate tenant

Business logic must not live inside controllers.

---

# Repository Layer

All database access should be isolated inside repositories.

Controllers must never directly query Prisma.

---

# Error Handling

400

Invalid input

401

Unauthenticated

403

Permission denied

404

Tenant not found

409

Slug already exists

---

# Future Compatibility

Design for future support of

* Billing
* Stripe integration
* Feature flags
* White labeling
* Multiple offices
* Multiple business units
* Regional settings
* Custom domains

No redesign should be required later.

---

# Code Quality

Follow

* SOLID
* Repository Pattern
* Service Layer
* Strong typing
* Validation
* Clean architecture

Avoid duplicated logic.

---

# Deliverables

Implement

* Tenant service
* Tenant repository
* Validation
* API routes
* Controllers
* Update flows
* Permission integration
* Documentation

---

# Acceptance Criteria

✓ Tenant data can be retrieved.

✓ Tenant settings can be updated.

✓ Branding can be updated.

✓ Tenant lifecycle supports active and suspended states.

✓ Only authorized users may modify tenant settings.

✓ Cross-tenant access is impossible.

✓ Controllers remain thin.

✓ Business logic exists only in services.

✓ Repository layer handles all database access.

The implementation must integrate cleanly with the existing Authentication and Authorization modules without introducing breaking changes.
