
DROP POLICY IF EXISTS "su_co_images_insert_own" ON storage.objects;
CREATE POLICY "su_co_images_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'su-co-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "su_co_images_read_own_or_admin" ON storage.objects;
CREATE POLICY "su_co_images_read_own_or_admin"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'su-co-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );

DROP POLICY IF EXISTS "su_co_images_delete_own_or_admin" ON storage.objects;
CREATE POLICY "su_co_images_delete_own_or_admin"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'su-co-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );
