-- ============================================================================
-- Migration: 003_tenant.sql
-- Description: Creates tenant and tenant_config tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TENANT
-- ----------------------------------------------------------------------------

CREATE TABLE tenant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,

    subdomain VARCHAR(100) NOT NULL UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- TENANT CONFIG
-- ----------------------------------------------------------------------------

CREATE TABLE tenant_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    config_key VARCHAR(100) NOT NULL,

    config_value JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT tenant_config_unique_key
        UNIQUE (tenant_id, config_key)
);