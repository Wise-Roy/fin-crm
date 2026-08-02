# Authentication Module Specification

## Module

Authentication

## Status

Planned

## Owner

Platform

---

# Goal

Implement a secure authentication system using **Supabase Auth**.

The backend **must not implement its own authentication system**. Authentication, password hashing, email verification, password reset, session management, and JWT issuance are delegated to Supabase.

The application backend is responsible only for:

* Authorization
* Business rules
* User provisioning
* Tenant access validation
* Role & permission checks

---

# Authentication Provider

Supabase Auth

Authentication Method:

* Email + Password

Future Support:
* Google OAuth

---

# Responsibilities

Supabase is responsible for:

* User registration
* Login
* Logout
* Refresh Tokens
* JWT Generation
* Password Reset
* Email Verification
* Session Management

CRM Backend is responsible for:

* Creating application profile
* Mapping auth.users → public.users
* Assigning tenant
* Assigning default role
* Validating active status
* RBAC
* Permission checks

---

# Authentication Flow

## Sign Up

1. User enters email and password.
2. Frontend calls Supabase Auth.
3. Supabase creates auth.users record.
4. Email verification is sent.
5. User verifies email.
6. Backend provisions application user if needed.
7. Default role is assigned.
8. User can access CRM.

---

## Login

1. User logs in using Supabase.
2. Supabase returns JWT.
3. Frontend stores session securely.
4. Every API request includes:

Authorization: Bearer <JWT>

5. Backend validates JWT.
6. Backend loads current user.
7. Backend validates:

* User exists
* Tenant exists
* User active
* Role active

8. Request proceeds.

---

## Logout

Frontend signs out through Supabase.

Backend stores no session.

---

# Authorization

Authentication != Authorization.

Every protected request must verify:

* Authenticated user
* Tenant membership
* Active account
* Active tenant
* Role
* Permissions

---

# User Model

Authentication User

Managed by Supabase

auth.users

Application User

Stored inside public.users

Contains:

* id
* auth_user_id
* tenant_id
* employee_id
* role_id
* status
* created_at
* updated_at

The application never stores passwords.

---

# JWT

Backend trusts only JWTs issued by Supabase.

JWT must be verified before accessing protected resources.

Never trust client-provided user IDs.

Current user is always derived from the verified JWT.

---

# Session Strategy

Stateless Authentication

Backend stores no sessions.

Supabase manages refresh tokens.

---

# Password Policy

Delegated to Supabase.

Minimum:

* 8 characters
* Uppercase
* Lowercase
* Number
* Special character

---

# Email Verification

Required before CRM access.

Users without verified email cannot access protected APIs.

---

# Password Reset

Handled completely by Supabase.

Backend has no password reset endpoints.

---

# Roles

Initial role assignment:

Owner

Admin

Manager

Employee

Actual permissions are enforced by the authorization module.

---

# Security Requirements

Never expose Service Role Key to frontend.

Never trust JWT without verification.

Never expose internal IDs unnecessarily.

Rate-limit authentication-related endpoints if proxying through backend.

Always use HTTPS.

---

# Backend Responsibilities

The backend must provide middleware that:

* Validates JWT
* Loads current application user
* Loads tenant
* Loads role
* Attaches authenticated user context to request

Example:

req.user

req.tenant

req.role

---

# Error Responses

401 Unauthorized

* Missing token
* Invalid token
* Expired token

403 Forbidden

* Missing permission
* Tenant mismatch
* Inactive account

404 Not Found

* User not provisioned

---

# Future Enhancements

* Multi-Factor Authentication
* SSO
* Microsoft Entra ID
* Google Workspace Login
* Audit Logs
* Device Sessions
* Session Revocation
* Trusted Devices

---

# Acceptance Criteria

* Users can sign up using Supabase Auth.
* Email verification is enforced.
* Users can log in and receive a valid JWT.
* Backend accepts only valid Supabase JWTs.
* Every protected API requires authentication.
* User context is available throughout request processing.
* Passwords are never stored in application tables.
* Authorization is separated from authentication.
