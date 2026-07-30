-- ============================================================================
-- Migration: 008_finance.sql
-- Description: Creates task_payment and task_reimbursement tables
-- Depends On:
--      003_tenant.sql
--      007_tasks.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TASK PAYMENT
-- ----------------------------------------------------------------------------

CREATE TABLE task_payment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    task_id UUID NOT NULL
        REFERENCES task(id)
        ON DELETE RESTRICT,

    payment_type VARCHAR(100) NOT NULL,

    amount NUMERIC(12,2) NOT NULL
        CHECK (amount >= 0),

    payment_status payment_status NOT NULL,

    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- TASK REIMBURSEMENT
-- ----------------------------------------------------------------------------

CREATE TABLE task_reimbursement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    task_id UUID NOT NULL
        REFERENCES task(id)
        ON DELETE RESTRICT,

    amount NUMERIC(12,2) NOT NULL
        CHECK (amount >= 0),

    proof_file TEXT,

    description TEXT,

    status reimbursement_status NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);