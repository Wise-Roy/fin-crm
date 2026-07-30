-- ============================================================================
-- Migration: 015_rls_finance.sql
-- Description: RLS policies for task payments and reimbursements
-- ============================================================================


-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE task_payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_payment FORCE ROW LEVEL SECURITY;


ALTER TABLE task_reimbursement ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_reimbursement FORCE ROW LEVEL SECURITY;



-- ============================================================================
-- TASK PAYMENT
-- ============================================================================


-- ----------------------------------------------------------------------------
-- VIEW PAYMENTS
-- OWNER / ADMIN / MANAGER
-- ----------------------------------------------------------------------------

CREATE POLICY task_payment_select_policy
ON task_payment
FOR SELECT
TO authenticated
USING (

    tenant_id = (auth.jwt()->>'tenant_id')::uuid

    AND

    (auth.jwt()->>'role')
    IN ('OWNER','ADMIN','MANAGER')

);



-- ----------------------------------------------------------------------------
-- CREATE PAYMENT
-- OWNER / ADMIN ONLY
-- ----------------------------------------------------------------------------

CREATE POLICY task_payment_insert_policy
ON task_payment
FOR INSERT
TO authenticated
WITH CHECK (

    tenant_id = (auth.jwt()->>'tenant_id')::uuid

    AND

    (auth.jwt()->>'role')
    IN ('OWNER','ADMIN')

);



-- ----------------------------------------------------------------------------
-- UPDATE PAYMENT
-- OWNER / ADMIN ONLY
-- ----------------------------------------------------------------------------

CREATE POLICY task_payment_update_policy
ON task_payment
FOR UPDATE
TO authenticated
USING (

    tenant_id = (auth.jwt()->>'tenant_id')::uuid

    AND

    (auth.jwt()->>'role')
    IN ('OWNER','ADMIN')

)
WITH CHECK (

    tenant_id = (auth.jwt()->>'tenant_id')::uuid

);



-- ----------------------------------------------------------------------------
-- DELETE PAYMENT
-- OWNER ONLY
-- ----------------------------------------------------------------------------

CREATE POLICY task_payment_delete_policy
ON task_payment
FOR DELETE
TO authenticated
USING (

    tenant_id = (auth.jwt()->>'tenant_id')::uuid

    AND

    (auth.jwt()->>'role')='OWNER'

);



-- ============================================================================
-- TASK REIMBURSEMENT
-- ============================================================================


-- ----------------------------------------------------------------------------
-- VIEW REIMBURSEMENT
--
-- Management:
--    All reimbursements
--
-- Employee:
--    Only own reimbursements
-- ----------------------------------------------------------------------------


CREATE POLICY reimbursement_select_policy
ON task_reimbursement
FOR SELECT
TO authenticated
USING (

    tenant_id = (auth.jwt()->>'tenant_id')::uuid

    AND

    (

        (auth.jwt()->>'role')
        IN ('OWNER','ADMIN','MANAGER')


        OR


        EXISTS (

            SELECT 1
            FROM task t

            WHERE t.id = task_reimbursement.task_id

            AND t.assigned_to_employee_id = auth.uid()

        )

    )

);



-- ----------------------------------------------------------------------------
-- CREATE REIMBURSEMENT
--
-- Employees can create for their assigned task
-- Management can create too
-- ----------------------------------------------------------------------------


CREATE POLICY reimbursement_insert_policy
ON task_reimbursement
FOR INSERT
TO authenticated
WITH CHECK (

    tenant_id = (auth.jwt()->>'tenant_id')::uuid

    AND

    (

        (auth.jwt()->>'role')
        IN ('OWNER','ADMIN','MANAGER')


        OR


        EXISTS (

            SELECT 1
            FROM task t

            WHERE t.id = task_id

            AND t.assigned_to_employee_id = auth.uid()

        )

    )

);



-- ----------------------------------------------------------------------------
-- UPDATE REIMBURSEMENT
--
-- Owner/Admin/Manager:
--    Can update status
--
-- Employee:
--    Can update own pending reimbursement
-- ----------------------------------------------------------------------------


CREATE POLICY reimbursement_update_policy
ON task_reimbursement
FOR UPDATE
TO authenticated
USING (

    tenant_id = (auth.jwt()->>'tenant_id')::uuid

    AND

    (

        (auth.jwt()->>'role')
        IN ('OWNER','ADMIN','MANAGER')


        OR


        EXISTS (

            SELECT 1
            FROM task t

            WHERE t.id = task_reimbursement.task_id

            AND t.assigned_to_employee_id = auth.uid()

        )

    )

)
WITH CHECK (

    tenant_id = (auth.jwt()->>'tenant_id')::uuid

);



-- ----------------------------------------------------------------------------
-- DELETE REIMBURSEMENT
--
-- Owner only
-- ----------------------------------------------------------------------------


CREATE POLICY reimbursement_delete_policy
ON task_reimbursement
FOR DELETE
TO authenticated
USING (

    tenant_id = (auth.jwt()->>'tenant_id')::uuid

    AND

    (auth.jwt()->>'role')='OWNER'

);