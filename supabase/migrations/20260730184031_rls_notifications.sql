-- ============================================================================
-- Migration: 016_rls_notifications.sql
-- Description: Row Level Security for notifications
-- ============================================================================


-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;



-- ============================================================================
-- SELECT NOTIFICATIONS
-- ============================================================================
-- Users can only see their own notifications
-- ============================================================================

CREATE POLICY notifications_select_policy
ON notifications
FOR SELECT
TO authenticated
USING (

    tenant_id = (auth.jwt()->>'tenant_id')::uuid

    AND

    user_id = auth.uid()

);



-- ============================================================================
-- INSERT NOTIFICATIONS
-- ============================================================================
-- Notifications should normally be created by:
--
-- 1. Backend using service role
-- 2. Database triggers
-- 3. Background workers
--
-- We do not allow normal users to create fake notifications.
-- ============================================================================



-- ============================================================================
-- UPDATE NOTIFICATIONS
-- ============================================================================
-- User can only mark their own notifications as read
-- ============================================================================

CREATE POLICY notifications_update_policy
ON notifications
FOR UPDATE
TO authenticated
USING (

    tenant_id = (auth.jwt()->>'tenant_id')::uuid

    AND

    user_id = auth.uid()

)
WITH CHECK (

    tenant_id = (auth.jwt()->>'tenant_id')::uuid

    AND

    user_id = auth.uid()

);



-- ============================================================================
-- DELETE NOTIFICATIONS
-- ============================================================================
-- User can delete only their own notifications
-- ============================================================================

CREATE POLICY notifications_delete_policy
ON notifications
FOR DELETE
TO authenticated
USING (

    tenant_id = (auth.jwt()->>'tenant_id')::uuid

    AND

    user_id = auth.uid()

);