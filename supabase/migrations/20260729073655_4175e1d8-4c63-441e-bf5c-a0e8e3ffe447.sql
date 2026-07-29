CREATE POLICY "dacv_storage_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'du-an-cong-van');
CREATE POLICY "dacv_storage_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'du-an-cong-van');
CREATE POLICY "dacv_storage_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'du-an-cong-van') WITH CHECK (bucket_id = 'du-an-cong-van');
CREATE POLICY "dacv_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'du-an-cong-van');