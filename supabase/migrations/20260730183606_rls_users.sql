-- ============================================================================
-- Migration: 012_rls_users.sql
-- Description: Row Level Security for users
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enable RLS
-- ----------------------------------------------------------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT
-- ============================================================================

CREATE POLICY "users_select_policy"
ON users
FOR SELECT
TO authenticated
USING (
    (
        tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND
        (
            (auth.jwt() ->> 'role') IN ('OWNER','ADMIN','MANAGER')
            OR
            id = auth.uid()
        )
    )
);

-- ============================================================================
-- INSERT
-- ============================================================================

CREATE POLICY "users_insert_policy"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid)
    AND
    (auth.jwt() ->> 'role') IN ('OWNER','ADMIN')
);

-- ============================================================================
-- UPDATE
-- ============================================================================

CREATE POLICY "users_update_policy"
ON users
FOR UPDATE
TO authenticated
USING (
    tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid)
)
WITH CHECK (
    (
        (auth.jwt() ->> 'role') IN ('OWNER','ADMIN')
    )
    OR
    (
        id = auth.uid()
        AND
        tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid)
    )
);

-- ============================================================================
-- DELETE
-- ============================================================================

CREATE POLICY "users_delete_policy"
ON users
FOR DELETE
TO authenticated
USING (
    tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid)
    AND
    (auth.jwt() ->> 'role') = 'OWNER'
);