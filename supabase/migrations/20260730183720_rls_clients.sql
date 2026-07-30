-- ============================================================================
-- Migration: 013_rls_clients.sql
-- Description: RLS for client & client_group
-- ============================================================================

ALTER TABLE client ENABLE ROW LEVEL SECURITY;
ALTER TABLE client FORCE ROW LEVEL SECURITY;

ALTER TABLE client_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_group FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- CLIENT
-- ============================================================================

CREATE POLICY client_select
ON client
FOR SELECT
TO authenticated
USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
);

CREATE POLICY client_insert
ON client
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND
    (auth.jwt()->>'role') IN ('OWNER','ADMIN','MANAGER')
);

CREATE POLICY client_update
ON client
FOR UPDATE
TO authenticated
USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
)
WITH CHECK (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND
    (auth.jwt()->>'role') IN ('OWNER','ADMIN','MANAGER')
);

CREATE POLICY client_delete
ON client
FOR DELETE
TO authenticated
USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND
    (auth.jwt()->>'role')='OWNER'
);

-- ============================================================================
-- CLIENT GROUP
-- ============================================================================

CREATE POLICY client_group_select
ON client_group
FOR SELECT
TO authenticated
USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
);

CREATE POLICY client_group_insert
ON client_group
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND
    (auth.jwt()->>'role') IN ('OWNER','ADMIN','MANAGER')
);

CREATE POLICY client_group_update
ON client_group
FOR UPDATE
TO authenticated
USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
)
WITH CHECK (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND
    (auth.jwt()->>'role') IN ('OWNER','ADMIN','MANAGER')
);

CREATE POLICY client_group_delete
ON client_group
FOR DELETE
TO authenticated
USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND
    (auth.jwt()->>'role')='OWNER'
);