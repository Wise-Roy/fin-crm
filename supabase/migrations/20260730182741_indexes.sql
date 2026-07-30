-- ============================================================================
-- Migration: 010_indexes.sql
-- Description: Performance indexes
-- ============================================================================

-- ============================================================================
-- USERS
-- ============================================================================

CREATE INDEX idx_users_tenant
ON users (tenant_id);

CREATE INDEX idx_users_role
ON users (tenant_id, role);

-- ============================================================================
-- CLIENT
-- ============================================================================

CREATE INDEX idx_client_tenant
ON client (tenant_id);

-- ============================================================================
-- CLIENT GROUP
-- ============================================================================

CREATE INDEX idx_client_group_tenant
ON client_group (tenant_id);

CREATE INDEX idx_client_group_client
ON client_group (client_id);

-- ============================================================================
-- CATEGORIES
-- ============================================================================

CREATE INDEX idx_categories_tenant
ON categories (tenant_id);

CREATE INDEX idx_sub_categories_category
ON sub_categories (category_id);

CREATE INDEX idx_sub_categories_tenant
ON sub_categories (tenant_id);

-- ============================================================================
-- TASK
-- ============================================================================

CREATE INDEX idx_task_tenant
ON task (tenant_id);

CREATE INDEX idx_task_status
ON task (tenant_id, status);

CREATE INDEX idx_task_employee
ON task (tenant_id, assigned_to_employee_id);

CREATE INDEX idx_task_client
ON task (tenant_id, client_id);

CREATE INDEX idx_task_client_group
ON task (tenant_id, client_group_id);

CREATE INDEX idx_task_category
ON task (tenant_id, category_id);

CREATE INDEX idx_task_subcategory
ON task (tenant_id, subcategory_id);

CREATE INDEX idx_task_created_by
ON task (tenant_id, created_by);

CREATE INDEX idx_task_due_date
ON task (tenant_id, due_date);

CREATE INDEX idx_task_created_at
ON task (tenant_id, created_at DESC);

-- ============================================================================
-- TASK HISTORY
-- ============================================================================

CREATE INDEX idx_task_history_task
ON task_history (task_id);

CREATE INDEX idx_task_history_user
ON task_history (changed_by_user_id);

CREATE INDEX idx_task_history_created
ON task_history (task_id, created_at DESC);

-- ============================================================================
-- PAYMENTS
-- ============================================================================

CREATE INDEX idx_task_payment_task
ON task_payment (task_id);

CREATE INDEX idx_task_payment_status
ON task_payment (payment_status);

-- ============================================================================
-- REIMBURSEMENT
-- ============================================================================

CREATE INDEX idx_task_reimbursement_task
ON task_reimbursement (task_id);

CREATE INDEX idx_task_reimbursement_status
ON task_reimbursement (status);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE INDEX idx_notifications_user
ON notifications (user_id);

CREATE INDEX idx_notifications_unread
ON notifications (user_id, is_read);

CREATE INDEX idx_notifications_created
ON notifications (user_id, created_at DESC);