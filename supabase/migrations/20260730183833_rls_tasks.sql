-- ============================================================================
-- Migration: 014_rls_tasks.sql
-- Description: Row Level Security for task and task_history
-- ============================================================================


-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE task ENABLE ROW LEVEL SECURITY;
ALTER TABLE task FORCE ROW LEVEL SECURITY;

ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history FORCE ROW LEVEL SECURITY;



-- ============================================================================
-- TASK POLICIES
-- ============================================================================


-- ----------------------------------------------------------------------------
-- SELECT TASK
-- ----------------------------------------------------------------------------
-- OWNER / ADMIN / MANAGER:
--     Can see all tasks inside their tenant
--
-- EMPLOYEE:
--     Can see only assigned tasks
-- ----------------------------------------------------------------------------

CREATE POLICY task_select_policy
ON task
FOR SELECT
TO authenticated
USING (

    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid

    AND

    (
        (auth.jwt() ->> 'role')
        IN ('OWNER','ADMIN','MANAGER')

        OR

        assigned_to_employee_id = auth.uid()
    )
);



-- ----------------------------------------------------------------------------
-- CREATE TASK
-- ----------------------------------------------------------------------------
-- Only management roles can create tasks
-- ----------------------------------------------------------------------------

CREATE POLICY task_insert_policy
ON task
FOR INSERT
TO authenticated
WITH CHECK (

    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid

    AND

    (auth.jwt() ->> 'role')
    IN ('OWNER','ADMIN','MANAGER')

);



-- ----------------------------------------------------------------------------
-- UPDATE TASK
-- ----------------------------------------------------------------------------
--
-- OWNER / ADMIN / MANAGER:
--     Update any task
--
-- EMPLOYEE:
--     Update only assigned tasks
--
-- Column restrictions should be handled by API layer.
-- ----------------------------------------------------------------------------

CREATE POLICY task_update_policy
ON task
FOR UPDATE
TO authenticated
USING (

    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid

    AND

    (
        (auth.jwt() ->> 'role')
        IN ('OWNER','ADMIN','MANAGER')

        OR

        assigned_to_employee_id = auth.uid()
    )

)
WITH CHECK (

    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid

);



-- ----------------------------------------------------------------------------
-- DELETE TASK
-- ----------------------------------------------------------------------------
-- Only OWNER and ADMIN
-- ----------------------------------------------------------------------------

CREATE POLICY task_delete_policy
ON task
FOR DELETE
TO authenticated
USING (

    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid

    AND

    (auth.jwt() ->> 'role')
    IN ('OWNER','ADMIN')

);



-- ============================================================================
-- TASK HISTORY POLICIES
-- ============================================================================


-- ----------------------------------------------------------------------------
-- READ HISTORY
-- ----------------------------------------------------------------------------

CREATE POLICY task_history_select_policy
ON task_history
FOR SELECT
TO authenticated
USING (

    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid

    AND

    (

        (auth.jwt() ->> 'role')
        IN ('OWNER','ADMIN','MANAGER')


        OR


        EXISTS (

            SELECT 1
            FROM task t

            WHERE t.id = task_history.task_id

            AND t.assigned_to_employee_id = auth.uid()

        )

    )

);



-- ----------------------------------------------------------------------------
-- INSERT HISTORY
-- ----------------------------------------------------------------------------
--
-- No authenticated user policy intentionally.
--
-- History should be created by:
-- - backend server
-- - Supabase service role
-- - database trigger
--
-- This prevents users from faking audit logs.
-- ----------------------------------------------------------------------------



-- ----------------------------------------------------------------------------
-- UPDATE / DELETE HISTORY
-- ----------------------------------------------------------------------------
--
-- No policies.
--
-- History is immutable.
-- ----------------------------------------------------------------------------