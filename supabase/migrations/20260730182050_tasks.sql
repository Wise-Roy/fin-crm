-- ============================================================================
-- Migration: 007_tasks.sql
-- Description: Creates task and task_history tables
-- Depends On:
--      003_tenant.sql
--      004_users.sql
--      005_clients.sql
--      006_categories.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TASK
-- ----------------------------------------------------------------------------

CREATE TABLE task (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    category_id UUID
        REFERENCES categories(id)
        ON DELETE SET NULL,

    subcategory_id UUID
        REFERENCES sub_categories(id)
        ON DELETE SET NULL,

    assigned_to_employee_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    client_id UUID
        REFERENCES client(id)
        ON DELETE SET NULL,

    client_group_id UUID
        REFERENCES client_group(id)
        ON DELETE SET NULL,

    created_by UUID NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    status task_status NOT NULL DEFAULT 'TODO',

    priority task_priority NOT NULL DEFAULT 'MEDIUM',

    due_date TIMESTAMPTZ,

    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- TASK HISTORY
-- ----------------------------------------------------------------------------

CREATE TABLE task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    task_id UUID NOT NULL
        REFERENCES task(id)
        ON DELETE CASCADE,

    changed_by_user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    action VARCHAR(100) NOT NULL,

    old_value JSONB,

    new_value JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);