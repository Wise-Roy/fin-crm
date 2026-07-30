-- ============================================================================
-- Migration: 011_triggers.sql
-- Description: Automatically maintain updated_at timestamps
-- ============================================================================

-- ============================================================================
-- FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- TENANT
-- ============================================================================

CREATE TRIGGER trg_tenant_updated_at
BEFORE UPDATE ON tenant
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TENANT CONFIG
-- ============================================================================

CREATE TRIGGER trg_tenant_config_updated_at
BEFORE UPDATE ON tenant_config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CLIENT
-- ============================================================================

CREATE TRIGGER trg_client_updated_at
BEFORE UPDATE ON client
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CLIENT GROUP
-- ============================================================================

CREATE TRIGGER trg_client_group_updated_at
BEFORE UPDATE ON client_group
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CATEGORIES
-- ============================================================================

CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SUB CATEGORIES
-- ============================================================================

CREATE TRIGGER trg_sub_categories_updated_at
BEFORE UPDATE ON sub_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TASK
-- ============================================================================

CREATE TRIGGER trg_task_updated_at
BEFORE UPDATE ON task
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TASK PAYMENT
-- ============================================================================

CREATE TRIGGER trg_task_payment_updated_at
BEFORE UPDATE ON task_payment
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TASK REIMBURSEMENT
-- ============================================================================

CREATE TRIGGER trg_task_reimbursement_updated_at
BEFORE UPDATE ON task_reimbursement
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();