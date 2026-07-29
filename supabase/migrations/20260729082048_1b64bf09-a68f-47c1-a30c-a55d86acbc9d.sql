
-- 1) r2_cau_hinh: admin-only explicit policy
DROP POLICY IF EXISTS r2_cau_hinh_admin_all ON public.r2_cau_hinh;
CREATE POLICY r2_cau_hinh_admin_all ON public.r2_cau_hinh
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) dot_bao_duong_audit_log: fix tautology in WITH CHECK
DROP POLICY IF EXISTS dbd_audit_insert ON public.dot_bao_duong_audit_log;
CREATE POLICY dbd_audit_insert ON public.dot_bao_duong_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    actor = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.dot_bao_duong_hang_muc h
      WHERE h.id = dot_bao_duong_audit_log.hang_muc_id
        AND (
          public.has_role(auth.uid(), 'admin'::public.app_role)
          OR public.has_role(auth.uid(), 'phong_kt'::public.app_role)
          OR h.don_vi_id = public.get_user_don_vi_id(auth.uid())
          OR dot_bao_duong_audit_log.don_vi_id = public.get_user_don_vi_id(auth.uid())
        )
    )
  );

-- 3) Storage: tighten writes to managers on equipment/model/form/incident buckets
DO $$
DECLARE
  b text;
  buckets text[] := ARRAY[
    'thiet-bi-hinh-anh','thiet-bi-tai-lieu','model-anh','model-tai-lieu',
    'vi-tri-media','su-co-images','form-attachments','form-pdf','nha-san-xuat-logo'
  ];
BEGIN
  FOREACH b IN ARRAY buckets LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_insert');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_update');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_delete');

    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = %L AND public.can_manage_equipment(auth.uid()))
    $f$, b || '_insert', b);

    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects
        FOR UPDATE TO authenticated
        USING (bucket_id = %L AND public.can_manage_equipment(auth.uid()))
        WITH CHECK (bucket_id = %L AND public.can_manage_equipment(auth.uid()))
    $f$, b || '_update', b, b);

    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects
        FOR DELETE TO authenticated
        USING (bucket_id = %L AND public.can_manage_equipment(auth.uid()))
    $f$, b || '_delete', b);
  END LOOP;
END $$;

-- 4) chu-ky: owner-folder scoping
DROP POLICY IF EXISTS "chu-ky_insert" ON storage.objects;
DROP POLICY IF EXISTS "chu-ky_update" ON storage.objects;
DROP POLICY IF EXISTS "chu-ky_delete" ON storage.objects;
DROP POLICY IF EXISTS "chu-ky_select" ON storage.objects;

CREATE POLICY "chu-ky_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chu-ky' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "chu-ky_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chu-ky' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "chu-ky_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'chu-ky' AND (storage.foldername(name))[1] = (auth.uid())::text)
  WITH CHECK (bucket_id = 'chu-ky' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "chu-ky_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chu-ky' AND (storage.foldername(name))[1] = (auth.uid())::text);

-- 5) chat-files: owner-folder scoping (name pattern: <uid>/...)
DROP POLICY IF EXISTS "chat-files_insert" ON storage.objects;
DROP POLICY IF EXISTS "chat-files_update" ON storage.objects;
DROP POLICY IF EXISTS "chat-files_delete" ON storage.objects;
DROP POLICY IF EXISTS "chat-files_select" ON storage.objects;

CREATE POLICY "chat-files_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "chat-files_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "chat-files_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = (auth.uid())::text)
  WITH CHECK (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "chat-files_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = (auth.uid())::text);
