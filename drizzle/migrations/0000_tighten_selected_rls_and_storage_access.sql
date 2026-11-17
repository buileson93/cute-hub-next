DROP POLICY IF EXISTS "Read anonymized stats" ON public.ocr_runtime_profile_stats;
CREATE POLICY "Read anonymized stats"
ON public.ocr_runtime_profile_stats
FOR SELECT
TO authenticated
USING (public.can_manage_equipment(auth.uid()));

DROP POLICY IF EXISTS "Users can insert events" ON public.du_an_su_kien;
CREATE POLICY "Users can insert events"
ON public.du_an_su_kien
FOR INSERT
TO authenticated
WITH CHECK (
  du_an_id IS NOT NULL
  AND public.can_access_du_an(du_an_id, auth.uid())
  AND actor_id = auth.uid()
);

DROP POLICY IF EXISTS "System can insert audit logs" ON public.api_audit_log;
CREATE POLICY "System can insert audit logs"
ON public.api_audit_log
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow authenticated users to read compatibility" ON public.thiet_bi_he_thong_tuong_thich;
CREATE POLICY "Allow authenticated users to read compatibility"
ON public.thiet_bi_he_thong_tuong_thich
FOR SELECT
TO authenticated
USING (
  public.can_view_thiet_bi(thiet_bi_id, auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.dm_he_thong hs
    WHERE hs.id = thiet_bi_he_thong_tuong_thich.he_thong_id
  )
);

DROP POLICY IF EXISTS "tbha_select_auth" ON storage.objects;

DROP POLICY IF EXISTS "model-anh_select" ON storage.objects;
CREATE POLICY "model-anh_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'model-anh'
  AND (
    public.can_manage_equipment(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.dm_model m
      WHERE m.hinh_anh = storage.objects.name
        AND m.active = true
    )
  )
);

DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
CREATE POLICY "avatars_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "dacv_storage_update" ON storage.objects;
CREATE POLICY "dacv_storage_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'du-an-cong-van'
  AND public.storage_don_vi_allowed('du-an-cong-van', name)
)
WITH CHECK (
  bucket_id = 'du-an-cong-van'
  AND public.storage_don_vi_allowed('du-an-cong-van', name)
);

DROP POLICY IF EXISTS "nha-san-xuat-logo_select" ON storage.objects;
CREATE POLICY "nha-san-xuat-logo_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'nha-san-xuat-logo'
  AND (
    public.can_manage_equipment(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.dm_nha_san_xuat nsx
      WHERE nsx.logo = storage.objects.name
        AND nsx.active = true
    )
  )
);

DROP POLICY IF EXISTS "model-tai-lieu_select" ON storage.objects;
CREATE POLICY "model-tai-lieu_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'model-tai-lieu'
  AND public.can_manage_equipment(auth.uid())
);