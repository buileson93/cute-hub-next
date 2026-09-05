DROP POLICY IF EXISTS "tbha_select_auth" ON storage.objects;
CREATE POLICY "tbha_select_auth" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'thiet-bi-hinh-anh');

DROP POLICY IF EXISTS "tbha_insert_manager" ON storage.objects;
CREATE POLICY "tbha_insert_manager" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'thiet-bi-hinh-anh' AND public.can_manage_equipment(auth.uid()));

DROP POLICY IF EXISTS "tbha_update_manager" ON storage.objects;
CREATE POLICY "tbha_update_manager" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'thiet-bi-hinh-anh' AND public.can_manage_equipment(auth.uid()))
  WITH CHECK (bucket_id = 'thiet-bi-hinh-anh' AND public.can_manage_equipment(auth.uid()));

DROP POLICY IF EXISTS "tbha_delete_manager" ON storage.objects;
CREATE POLICY "tbha_delete_manager" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'thiet-bi-hinh-anh' AND public.can_manage_equipment(auth.uid()));