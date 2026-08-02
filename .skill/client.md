# Client Management Module Implementation Specification

## Context

You are implementing the **Client Management** module for **FinCRM**, a production-grade multi-tenant SaaS CRM.

Completed modules:

* Authentication (Supabase Auth)
* Authorization (RBAC)
* Tenant Management
* Employee Management

Every authenticated request already contains:

* req.user
* req.role
* req.permissions
* req.tenant

Authentication and RBAC middleware already exist.

Do not modify previous modules unless integration requires it.

---

# Objective

Implement a complete Client Management system.

A client represents a company or individual that receives services from a tenant.

Every client belongs to exactly one tenant.

Clients are the central business entity for:

* Tasks
* Engagements
* Documents
* Communications
* Compliance
* Billing
* Audit History

Design the architecture for long-term scalability.

---

# Responsibilities

The Client module is responsible for:

* Client profile
* Client onboarding
* Client lifecycle
* Client ownership
* Client search
* Client filtering
* Client archival

The module is NOT responsible for:

* Billing
* Documents
* Tasks
* GST filings
* Audit engagements
* Notes

These will be separate modules.

---

# Database

Design the client model for enterprise scalability.

Suggested fields

Identity

* id
* tenant_id
* client_code

Business

* legal_name
* trade_name
* client_type

Registration

* pan
* gstin
* cin

Contact

* primary_email
* primary_phone
* website

Address

* address_line_1
* address_line_2
* city
* state
* country
* postal_code

Ownership

* account_manager_id

Status

* Active
* Inactive
* Archived

Metadata

* onboarding_date
* tags
* remarks

Audit

* created_by
* created_at
* updated_at

---

# Client Types

Support

Company

Individual

Partnership

LLP

Trust

NGO

Government

Design so additional types can be added later.

---

# Client Code

Generate a unique client code within a tenant.

Examples

CLI-000001

CLI-000002

CLI-000003

Codes must never collide within the same tenant.

---

# Account Manager

Each client may be assigned to one employee.

Rules

* Employee must belong to the same tenant.
* Account manager is optional.
* Reassignment should be supported.

---

# Status

Supported values

Active

Inactive

Archived

Clients should never be hard deleted.

Use soft lifecycle management.

---

# Authorization

Permissions

client.read

client.create

client.update

client.delete

Only authorized users may manage clients.

---

# API Endpoints

Implement

GET /clients

Paginated client list.

GET /clients/:id

Client details.

POST /clients

Create client.

PUT /clients/:id

Update client.

PATCH /clients/:id/status

Update client status.

PATCH /clients/:id/account-manager

Assign or change account manager.

DELETE /clients/:id

Soft archive client.

---

# Searching

Support search by

* Client Code
* Legal Name
* Trade Name
* PAN
* GSTIN
* Email
* Phone

Searching must always remain tenant scoped.

---

# Filtering

Support filters

Status

Client Type

Account Manager

State

Country

Created Date

Onboarding Date

---

# Pagination

Support

page

limit

sort

order

Response format

* items
* total
* page
* limit
* totalPages

---

# Validation

Validate

Required fields

Unique client code

PAN format

GSTIN format

Email format

Phone format

Website format

Account manager existence

Tenant ownership

Reject invalid requests.

---

# Business Rules

A client belongs to exactly one tenant.

PAN should be unique within a tenant.

GSTIN should be unique within a tenant.

Archived clients cannot receive new work unless restored.

Account manager must belong to the same tenant.

Never allow cross-tenant ownership.

---

# Multi-Tenant Rules

Every client query must automatically filter using

req.tenant.id

Never expose clients from another tenant.

Never trust tenant_id from request payloads.

---

# Repository Layer

All database access must exist inside repositories.

Controllers must never query Prisma directly.

---

# Service Layer

Business logic belongs inside services.

Responsibilities include

* Client creation
* Client updates
* Code generation
* Validation
* Search
* Filtering
* Account manager assignment
* Status updates

---

# Error Handling

400

Validation failed.

401

Unauthenticated.

403

Permission denied.

404

Client not found.

409

Duplicate PAN, GSTIN or client code.

---

# Performance

Support

Pagination

Indexed searching

Filtering

Avoid N+1 queries.

Design for organizations managing tens of thousands of clients.

---

# Audit

Track

Created By

Updated By

Created At

Updated At

Prepare for future Audit Log integration.

---

# Future Compatibility

Design for future support of

* Multiple client contacts
* Client documents
* Engagement management
* GST returns
* Income tax filings
* ROC compliance
* Billing & invoicing
* Activity timeline
* Client portal
* Digital signatures
* Compliance reminders

The architecture should support these without requiring schema redesign.

---

# Deliverables

Implement

* Client schema
* Repository layer
* Service layer
* Controllers
* Routes
* Validation
* Search
* Filtering
* Pagination
* Account manager assignment
* Authorization integration
* Documentation

---

# Acceptance Criteria

✓ Clients can be created.

✓ Clients can be updated.

✓ Clients can be archived.

✓ Clients can be assigned to an account manager.

✓ Search is supported.

✓ Filtering is supported.

✓ Pagination is supported.

✓ PAN and GSTIN uniqueness are enforced within a tenant.

✓ Cross-tenant access is impossible.

✓ Repository and Service layers are separated.

✓ Controllers remain thin.

✓ All endpoints integrate with existing Authentication and Authorization middleware.

The implementation must remain modular, scalable, and ready for future compliance, engagement, document, and billing modules without requiring architectural changes.
