
ALTER TABLE public.giay_phep_khai_thac
  ADD COLUMN IF NOT EXISTS file_gpkt text,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Storage policies cho bucket 'giay-phep-khai-thac'
DROP POLICY IF EXISTS "gpkt_files_read_auth" ON storage.objects;
DROP POLICY IF EXISTS "gpkt_files_write_manager" ON storage.objects;
DROP POLICY IF EXISTS "gpkt_files_update_manager" ON storage.objects;
DROP POLICY IF EXISTS "gpkt_files_delete_manager" ON storage.objects;

CREATE POLICY "gpkt_files_read_auth"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'giay-phep-khai-thac');

CREATE POLICY "gpkt_files_write_manager"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'giay-phep-khai-thac' AND public.can_manage_equipment(public.current_uid()));

CREATE POLICY "gpkt_files_update_manager"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'giay-phep-khai-thac' AND public.can_manage_equipment(public.current_uid()))
  WITH CHECK (bucket_id = 'giay-phep-khai-thac' AND public.can_manage_equipment(public.current_uid()));

CREATE POLICY "gpkt_files_delete_manager"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'giay-phep-khai-thac' AND public.can_manage_equipment(public.current_uid()));
