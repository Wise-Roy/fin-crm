# Task Management Module Implementation Specification

## Context

You are implementing the **Task Management** module for **FinCRM**, a production-grade multi-tenant SaaS CRM.

Completed modules:

* Authentication (Supabase Auth)
* Authorization (RBAC)
* Tenant Management
* Employee Management
* Client Management

Every authenticated request already contains:

* req.user
* req.role
* req.permissions
* req.tenant

Authentication and RBAC middleware already exist.

Do not modify previous modules unless integration requires it.

---

# Objective

Implement a scalable Task Management system.

A task represents a unit of work assigned to one or more employees for a specific client.

Tasks should support assignment, prioritization, status tracking, due dates, comments, attachments, and future workflow automation.

The architecture should support organizations managing hundreds of thousands of tasks.

---

# Responsibilities

The Task module is responsible for:

* Task creation
* Task assignment
* Task status
* Task priority
* Due dates
* Task ownership
* Task search
* Task filtering
* Task lifecycle

The module is NOT responsible for:

* Comments
* Attachments
* Notifications
* Activity Timeline
* Time Tracking
* Recurring Tasks

These will be implemented as separate modules.

---

# Database

Design the task model for enterprise scalability.

Suggested fields

Identity

* id
* tenant_id
* client_id
* task_code

Basic Information

* title
* description

Assignment

* assigned_to
* assigned_by

Classification

* priority
* status
* category

Scheduling

* start_date
* due_date
* completed_at

Metadata

* estimated_hours
* actual_hours

Audit

* created_by
* created_at
* updated_at

---

# Task Code

Generate a unique task code within a tenant.

Examples

TASK-000001

TASK-000002

TASK-000003

Codes must never collide within a tenant.

---

# Task Status

Support

Todo

In Progress

Blocked

Review

Completed

Cancelled

Future statuses should be easy to add.

---

# Task Priority

Support

Low

Medium

High

Critical

---

# Categories

Support task categories.

Examples

Audit

GST

Income Tax

ROC

Compliance

Accounting

Internal

General

Allow future categories without schema redesign.

---

# Assignment

Every task

* belongs to one tenant
* may belong to one client
* is assigned to one employee
* is created by one employee

Rules

Assigned employee must belong to the same tenant.

Client must belong to the same tenant.

---

# Authorization

Permissions

task.read

task.create

task.update

task.assign

task.delete

Only authorized users may perform these actions.

Employees without task.assign cannot assign tasks.

---

# API Endpoints

Implement

GET /tasks

Paginated task list.

GET /tasks/:id

Task details.

POST /tasks

Create task.

PUT /tasks/:id

Update task.

PATCH /tasks/:id/status

Update task status.

PATCH /tasks/:id/assign

Assign or reassign employee.

DELETE /tasks/:id

Soft archive task.

GET /tasks/my

Return tasks assigned to the authenticated employee.

---

# Searching

Support search by

* Task Code
* Title
* Description

Searching must always remain tenant scoped.

---

# Filtering

Support

Status

Priority

Category

Assigned Employee

Client

Due Date

Created Date

Created By

---

# Sorting

Support sorting by

Created Date

Due Date

Priority

Status

Title

Updated Date

---

# Pagination

Support

page

limit

sort

order

Return

* items
* total
* page
* limit
* totalPages

---

# Validation

Validate

Required fields

Due date

Assigned employee

Client existence

Tenant ownership

Status transitions

Reject invalid requests.

---

# Business Rules

Task must belong to current tenant.

Assigned employee must belong to current tenant.

Client must belong to current tenant.

Completed tasks cannot move back unless explicitly allowed.

Cancelled tasks cannot be completed.

Due date cannot be before start date.

Archived tasks cannot be updated.

---

# Multi-Tenant Rules

Every task query must automatically filter using

req.tenant.id

Never expose another tenant's tasks.

Never trust tenant_id from client requests.

---

# Repository Layer

All database access belongs inside repositories.

Controllers must never query Prisma directly.

---

# Service Layer

Business logic belongs inside services.

Responsibilities include

* Task creation
* Assignment
* Status updates
* Priority updates
* Validation
* Search
* Filtering
* Task code generation

---

# Error Handling

400

Validation failed.

401

Unauthenticated.

403

Permission denied.

404

Task not found.

409

Invalid status transition or duplicate task code.

---

# Performance

Support

Pagination

Indexed searching

Filtering

Avoid N+1 queries.

Design for organizations managing hundreds of thousands of tasks.

---

# Audit

Track

Created By

Updated By

Assigned By

Created At

Updated At

Completed At

Prepare for future Audit Log integration.

---

# Future Compatibility

Design for future support of

* Task comments
* Task attachments
* Activity timeline
* Checklists
* Recurring tasks
* Dependencies
* Subtasks
* Time tracking
* SLA tracking
* Approval workflow
* Automation rules
* Notifications
* Calendar integration

The implementation should support these features without requiring schema redesign.

---

# Deliverables

Implement

* Task schema
* Repository layer
* Service layer
* Controllers
* Routes
* Validation
* Search
* Filtering
* Pagination
* Assignment logic
* Status management
* Authorization integration
* Documentation

---

# Acceptance Criteria

✓ Tasks can be created.

✓ Tasks can be assigned.

✓ Tasks can be reassigned.

✓ Task status can be updated.

✓ Search is supported.

✓ Filtering is supported.

✓ Pagination is supported.

✓ Status transition rules are enforced.

✓ Cross-tenant access is impossible.

✓ Repository and Service layers are separated.

✓ Controllers remain thin.

✓ All endpoints integrate with existing Authentication and Authorization middleware.

The implementation must be modular, scalable, and ready for future comments, attachments, workflows, notifications, approvals, and automation modules without requiring architectural redesign.
