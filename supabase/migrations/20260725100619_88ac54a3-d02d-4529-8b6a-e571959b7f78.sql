
CREATE POLICY dbd_bucket_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'dot-bao-duong');
CREATE POLICY dbd_bucket_write ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dot-bao-duong');
CREATE POLICY dbd_bucket_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'dot-bao-duong') WITH CHECK (bucket_id = 'dot-bao-duong');
CREATE POLICY dbd_bucket_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'dot-bao-duong');
