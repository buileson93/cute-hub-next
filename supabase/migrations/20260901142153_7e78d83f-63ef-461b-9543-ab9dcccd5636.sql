DROP POLICY IF EXISTS dacv_storage_insert ON storage.objects;
CREATE POLICY dacv_storage_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'du-an-cong-van'
  AND public.storage_don_vi_allowed('du-an-cong-van', name)
);