-- ============================================================================
-- Migration: 005_clients.sql
-- Description: Creates client and client_group tables
-- Depends On:
--      003_tenant.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CLIENT
-- ----------------------------------------------------------------------------

CREATE TABLE client (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,

    email VARCHAR(255),

    phone VARCHAR(20),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT client_name_unique_per_tenant
        UNIQUE (tenant_id, name)
);

-- ----------------------------------------------------------------------------
-- CLIENT GROUP
-- ----------------------------------------------------------------------------

CREATE TABLE client_group (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    client_id UUID NOT NULL
        REFERENCES client(id)
        ON DELETE CASCADE,

    group_name VARCHAR(255) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT client_group_name_unique
        UNIQUE (client_id, group_name)
);