-- ============================================================================
-- Migration: 009_notifications.sql
-- Description: Creates notifications table
-- Depends On:
--      003_tenant.sql
--      004_users.sql
--      007_tasks.sql
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    task_id UUID
        REFERENCES task(id)
        ON DELETE SET NULL,

    title VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);