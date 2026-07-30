-- ============================================================================
-- Migration: 006_categories.sql
-- Description: Creates categories and sub_categories tables
-- Depends On:
--      003_tenant.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CATEGORIES
-- ----------------------------------------------------------------------------

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    name VARCHAR(150) NOT NULL,

    is_predefined BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT categories_name_unique
        UNIQUE (tenant_id, name)
);

-- ----------------------------------------------------------------------------
-- SUB CATEGORIES
-- ----------------------------------------------------------------------------

CREATE TABLE sub_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    category_id UUID NOT NULL
        REFERENCES categories(id)
        ON DELETE CASCADE,

    name VARCHAR(150) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT sub_categories_name_unique
        UNIQUE (category_id, name)
);