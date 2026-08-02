# Authorization Module Implementation Specification

## Context

You are implementing the Authorization (RBAC) module for **FinCRM**, a production-grade multi-tenant SaaS CRM.

The Authentication module is already complete.

Authentication is handled entirely by Supabase Auth.

The backend already:

* Validates Supabase JWT
* Loads authenticated application user
* Loads tenant
* Loads role
* Attaches `req.user`, `req.tenant`, and `req.role`

Your task is to implement Authorization only.

Do **not** modify the Authentication module unless required for integration.

---

# Objective

Implement a scalable Role-Based Access Control (RBAC) system that works across all CRM modules.

The system must support:

* Multi-tenancy
* Role-based permissions
* Permission middleware
* Future custom roles
* Future enterprise scalability

---

# Existing Architecture

Repository Structure

```text
apps/
    api/

packages/
    db/

supabase/
    migrations/
```

Current Database Tables

* tenants
* users
* roles

Users belong to exactly one tenant.

Users have exactly one role.

Authentication already guarantees that the request contains:

* req.user
* req.role
* req.tenant

---

# Responsibilities

The Authorization module is responsible for:

* Permission validation
* Route authorization
* Role authorization
* Tenant isolation
* Permission lookup
* Authorization middleware

The Authorization module is NOT responsible for:

* Login
* Logout
* Passwords
* JWT validation
* Email verification

---

# Database Changes

Create the following database objects.

## permissions

Represents every permission available in the CRM.

Suggested fields:

* id
* key
* module
* action
* description
* created_at

Examples

employee.read

employee.create

employee.update

employee.delete

client.read

client.create

client.update

client.delete

task.read

task.create

task.assign

task.delete

tenant.manage

role.manage

user.manage

audit.read

dashboard.read

---

## role_permissions

Maps roles to permissions.

Suggested fields

* role_id
* permission_id

Composite unique key:

(role_id, permission_id)

---

# Default Roles

Every tenant must contain these roles:

Owner

Admin

Manager

Employee

Do not hardcode permission checks throughout the application.

Permissions should be assigned to roles through the database.

---

# Permission Convention

Use the naming convention

```
<module>.<action>
```

Examples

employee.read

task.assign

client.delete

audit.read

role.manage

This convention must remain consistent across the CRM.

---

# Middleware

Implement reusable authorization middleware.

## requirePermission(permission)

Example

```ts
requirePermission("client.create")
```

Behavior

* User must already be authenticated.
* Check whether the user's role contains the required permission.
* Continue request if allowed.
* Return HTTP 403 if permission is missing.

---

## requireRole(role)

Example

```ts
requireRole("owner")
```

Used for endpoints restricted to specific roles.

Return HTTP 403 if the role does not match.

---

# Request Context

During authentication, load the user's permissions once.

Expose

```ts
req.permissions
```

Authorization middleware must use this cached list.

Do not query the database for every permission check.

---

# Tenant Isolation

Every protected endpoint must only access records belonging to

```
req.tenant.id
```

Authorization must never allow cross-tenant access.

This is mandatory.

---

# Route Protection Examples

Employee Module

GET /employees

Requires

employee.read

POST /employees

Requires

employee.create

PUT /employees/:id

Requires

employee.update

DELETE /employees/:id

Requires

employee.delete

Client Module

GET /clients

Requires

client.read

POST /clients

Requires

client.create

Task Module

POST /tasks

Requires

task.create

PATCH /tasks/:id/assign

Requires

task.assign

DELETE /tasks/:id

Requires

task.delete

Administration

Create Role

Requires

role.manage

Update Tenant

Requires

tenant.manage

---

# Error Handling

Return

401

Unauthenticated request

403

Permission denied

404

Only where resource truly does not exist.

Do not leak permission information.

---

# Seed Data

Seed all default permissions.

Seed default role-to-permission mappings.

Owner should receive every permission.

Admin should receive operational permissions.

Manager should receive business permissions.

Employee should receive only permissions necessary for daily work.

---

# Extensibility

The implementation must support future features without redesign.

Examples

* Custom Roles
* Department-level permissions
* Feature flags
* Object-level permissions
* Temporary permissions
* Permission groups
* Enterprise editions

---

# Code Quality Requirements

The implementation must:

* Follow SOLID principles.
* Keep authorization logic outside controllers.
* Use reusable middleware.
* Avoid duplicated permission checks.
* Be strongly typed.
* Keep permission names centralized.
* Be easy to extend.

---

# Deliverables

Implement:

* Database schema changes
* Database migrations
* Seed data
* Permission middleware
* Role middleware
* Permission loading
* Permission caching on request
* Route protection examples
* Documentation
* Unit-test-ready architecture

---

# Acceptance Criteria

✓ Every protected route requires authentication.

✓ Every business route validates permissions.

✓ Roles are mapped through the database.

✓ Permissions are loaded once per request.

✓ Cross-tenant access is impossible.

✓ Owner has full access.

✓ Default roles are seeded.

✓ Authorization is completely separated from Authentication.

✓ The architecture is extensible for enterprise-scale RBAC.

Do not introduce breaking changes to the existing Authentication module. Integrate cleanly with the existing request context and middleware.
