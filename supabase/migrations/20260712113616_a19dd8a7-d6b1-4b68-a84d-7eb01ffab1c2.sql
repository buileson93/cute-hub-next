-- T05: Restrict write access to the manufacturer logo storage bucket.
-- Read stays open to all signed-in users; create/update/delete only for
-- equipment managers (admin, phong_kt), mirroring the model-anh bucket.

DROP POLICY IF EXISTS nsx_logo_insert ON storage.objects;
DROP POLICY IF EXISTS nsx_logo_update ON storage.objects;
DROP POLICY IF EXISTS nsx_logo_delete ON storage.objects;
-- SELECT policy (nsx_logo_select) is left unchanged: authenticated read.

CREATE POLICY nsx_logo_insert_manager ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'nha-san-xuat-logo' AND can_manage_equipment(auth.uid()));

CREATE POLICY nsx_logo_update_manager ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'nha-san-xuat-logo' AND can_manage_equipment(auth.uid()))
  WITH CHECK (bucket_id = 'nha-san-xuat-logo' AND can_manage_equipment(auth.uid()));

CREATE POLICY nsx_logo_delete_manager ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'nha-san-xuat-logo' AND can_manage_equipment(auth.uid()));