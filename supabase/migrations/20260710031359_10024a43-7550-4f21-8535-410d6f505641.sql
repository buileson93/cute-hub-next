CREATE POLICY chu_ky_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'chu-ky' AND is_active_user(auth.uid()));

CREATE POLICY chu_ky_write_manager ON storage.objects
  FOR ALL
  USING (bucket_id = 'chu-ky' AND can_manage_equipment(auth.uid()))
  WITH CHECK (bucket_id = 'chu-ky' AND can_manage_equipment(auth.uid()));