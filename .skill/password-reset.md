Implement a complete Forgot Password / Reset Password flow in the existing FinFlow project.

First inspect the existing auth, Supabase, Prisma/DB, API, UI, and email architecture and follow the existing conventions.

Requirements:

1. Frontend
- Add "Forgot Password?" to the login page.
- Create /forgot-password with email input, validation, loading, success and error states.
- Create /reset-password?token=<token> with new password + confirm password.
- Reuse existing FinFlow UI components/design system.

2. Backend
- POST /auth/forgot-password
  - Validate/normalize email.
  - Never reveal whether the email exists.
  - Generate a cryptographically secure random reset token.
  - Store only the hashed token in DB.
  - Token expires in 30 minutes.
  - Invalidate previous active reset tokens for the user.
  - Send reset email through Resend.
- POST /auth/reset-password
  - Validate and hash the supplied token.
  - Check existence, expiry and usedAt.
  - Update the user's password using Supabase Auth Admin API.
  - Mark token as used.
  - Invalidate other active tokens.

3. Database
- Add a PasswordResetToken model/table if one does not already exist:
  id, userId, tokenHash, expiresAt, usedAt, createdAt.
- Follow the existing Prisma schema conventions and create the migration.

4. Email
- Use Resend, not Supabase's password-reset email.
- Create/reuse email.config.ts and email.service.ts.
- Create a branded FinFlow password-reset email template.
- Use FRONTEND_URL to construct the reset link.
- Keep RESEND_API_KEY and SUPABASE_SERVICE_ROLE_KEY server-side only.

5. Security
- Never store/log raw reset tokens or passwords.
- Never expose whether an email exists.
- Use crypto.randomBytes for tokens.
- Validate everything server-side.
- Handle expired, invalid and already-used tokens.
- Apply existing rate limiting if available.
- Do not modify unrelated authentication, tenant, role or permission logic.

6. Testing
Test:
- Valid reset flow
- Unknown email
- Invalid/expired/used token
- Password mismatch/validation
- Resend failure
- Supabase update failure
- Existing login/logout/auth flow
- TypeScript, lint and build

Do not just create the UI. Implement and verify the complete end-to-end flow. At the end, summarize files created/modified, DB changes, env variables, API endpoints and tests performed.