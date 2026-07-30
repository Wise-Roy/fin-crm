-- ============================================================================
-- Migration: 004_users.sql
-- Description: Creates application users table
-- Depends On:
--      003_tenant.sql
-- ============================================================================

CREATE TABLE users (
    -- Supabase Auth User ID
    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,

    email VARCHAR(255) NOT NULL,

    phone VARCHAR(20),

    role user_role NOT NULL,

    position VARCHAR(100),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_email_unique_per_tenant
        UNIQUE (tenant_id, email)
);