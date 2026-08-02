# Employee Management Module Implementation Specification

## Context

You are implementing the **Employee Management** module for **FinCRM**, a production-grade multi-tenant SaaS CRM.

Completed modules:

* Authentication (Supabase Auth)
* Authorization (RBAC)

Every authenticated request already contains:

* req.user
* req.role
* req.permissions
* req.tenant

RBAC middleware is already implemented.

Do not modify Authentication or Authorization unless integration requires it.

---

# Objective

Implement a complete Employee Management system.

An employee represents a person working inside a tenant (organization).

Every employee belongs to exactly one tenant.

Employees can be assigned work, own clients, create tasks, receive notifications, and appear throughout the CRM.

This module should become the central identity module for all business operations.

---

# Responsibilities

The Employee module is responsible for:

* Employee profile
* Employee onboarding
* Employee lifecycle
* Employee status
* Employee role assignment
* Reporting manager
* Department
* Designation
* Search
* Pagination
* Filtering

The module is NOT responsible for:

* Authentication
* Permissions
* Payroll
* Attendance
* Leave Management

---

# Database

Design the employee model for enterprise scalability.

Suggested fields

Identity

* id
* tenant_id
* user_id
* employee_code

Personal

* first_name
* last_name
* full_name
* email
* phone
* profile_image

Organization

* department
* designation
* reporting_manager_id

Employment

* joined_at
* employment_type
* status

Audit

* created_at
* updated_at
* created_by

---

# Employee Status

Support

Active

Inactive

Suspended

Resigned

Deleted employees should never be hard deleted.

Use soft lifecycle management.

---

# Employment Type

Support

Full Time

Part Time

Contract

Intern

Consultant

The implementation should allow future expansion.

---

# Employee Code

Each employee should receive a unique employee code within a tenant.

Examples

EMP-0001

EMP-0002

EMP-0003

Codes must never collide inside the same tenant.

---

# Reporting Structure

Employees may report to another employee.

Rules

* Reporting manager must belong to the same tenant.
* Employee cannot report to themselves.
* Prevent circular reporting relationships.

Example

CEO

↓

Director

↓

Manager

↓

Employee

---

# Authorization

Permission Required

employee.read

employee.create

employee.update

employee.delete

Only authorized users may manage employees.

Employees should only be able to view or update their own profile unless granted additional permissions.

---

# API Endpoints

Implement

GET /employees

Paginated employee list.

GET /employees/:id

Employee details.

POST /employees

Create employee.

PUT /employees/:id

Update employee.

PATCH /employees/:id/status

Update employee status.

DELETE /employees/:id

Soft delete employee.

GET /employees/me

Current employee profile.

PATCH /employees/me

Update own profile.

---

# Searching

Support

* Name
* Email
* Employee Code
* Department
* Designation

Searching must always remain tenant scoped.

---

# Filtering

Support filters

Status

Department

Designation

Employment Type

Reporting Manager

Date Joined

---

# Pagination

Support

page

limit

sort

order

Return

items

total

page

limit

totalPages

---

# Validation

Validate

Required fields

Email format

Phone format

Unique employee code

Reporting manager

Tenant ownership

Reject invalid requests.

---

# Business Rules

Employee email must be unique within the tenant.

Employee cannot belong to another tenant.

Reporting manager must exist.

Suspended employees cannot receive assignments.

Inactive employees cannot log in.

Deleted employees cannot appear in normal searches.

---

# Multi-Tenant Rules

Every employee query must automatically filter by

req.tenant.id

Never expose employees belonging to another tenant.

Never trust tenant_id supplied by clients.

---

# Future Compatibility

Design for future support of

* Departments module
* Teams
* Attendance
* Leave Management
* Payroll
* Performance Reviews
* Employee Documents
* Skills
* Certifications
* Emergency Contacts

The architecture should not require redesign later.

---

# Repository Layer

All database access must exist inside repositories.

Controllers must never query Prisma directly.

---

# Service Layer

Business logic belongs inside services.

Responsibilities include

* Employee creation
* Status updates
* Manager validation
* Employee code generation
* Search
* Filtering

---

# Error Handling

400

Validation failed.

401

Unauthenticated.

403

Permission denied.

404

Employee not found.

409

Duplicate employee code or duplicate email.

---

# Performance

Support

Pagination

Indexed searching

Filtering

Avoid N+1 queries.

Design for organizations with thousands of employees.

---

# Audit

Track

Created By

Updated By

Created At

Updated At

Prepare for future audit logging integration.

---

# Deliverables

Implement

* Employee schema updates
* Repository layer
* Service layer
* Controllers
* Routes
* Validation
* Search
* Filtering
* Pagination
* Authorization integration
* Documentation

---

# Acceptance Criteria

✓ Employees can be created.

✓ Employees can be updated.

✓ Employees can be suspended.

✓ Employees can be searched.

✓ Employees can be filtered.

✓ Pagination is supported.

✓ Employee hierarchy works.

✓ Soft delete is implemented.

✓ Cross-tenant access is impossible.

✓ Repository and Service layers are separated.

✓ Controllers remain thin.

✓ All endpoints use existing Authentication and Authorization middleware.

The implementation must integrate cleanly with the existing architecture and remain extensible for future HR, payroll, and organizational modules.
