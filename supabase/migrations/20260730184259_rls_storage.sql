-- ============================================================================
-- Migration: 017_storage.sql
-- Description: Supabase Storage buckets and RLS policies
-- ============================================================================


-- ============================================================================
-- CREATE PRIVATE BUCKET
-- ============================================================================

INSERT INTO storage.buckets
(
    id,
    name,
    public
)
VALUES
(
    'reimbursement-proofs',
    'reimbursement-proofs',
    false
)
ON CONFLICT (id)
DO NOTHING;



-- ============================================================================
-- STORAGE OBJECT SELECT
-- ============================================================================
-- Users can view only files from their tenant
--
-- Path:
-- reimbursement-proofs/{tenant_id}/...
-- ============================================================================


CREATE POLICY "tenant_can_view_reimbursement_files"
ON storage.objects
FOR SELECT
TO authenticated
USING (

    bucket_id = 'reimbursement-proofs'

    AND

    (storage.foldername(name))[1]
    =
    (auth.jwt()->>'tenant_id')

);



-- ============================================================================
-- STORAGE OBJECT INSERT
-- ============================================================================
-- Users can upload only inside their tenant folder
-- ============================================================================


CREATE POLICY "tenant_can_upload_reimbursement_files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (

    bucket_id = 'reimbursement-proofs'

    AND

    (storage.foldername(name))[1]
    =
    (auth.jwt()->>'tenant_id')

);



-- ============================================================================
-- STORAGE OBJECT UPDATE
-- ============================================================================


CREATE POLICY "tenant_can_update_reimbursement_files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (

    bucket_id = 'reimbursement-proofs'

    AND

    (storage.foldername(name))[1]
    =
    (auth.jwt()->>'tenant_id')

);



-- ============================================================================
-- STORAGE OBJECT DELETE
-- ============================================================================


CREATE POLICY "tenant_can_delete_reimbursement_files"
ON storage.objects
FOR DELETE
TO authenticated
USING (

    bucket_id = 'reimbursement-proofs'

    AND

    (
        (auth.jwt()->>'role')
        IN ('OWNER','ADMIN')
    )

);