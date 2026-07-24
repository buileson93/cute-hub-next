
DROP POLICY IF EXISTS ban_giao_select ON public.ban_giao;
CREATE POLICY ban_giao_select ON public.ban_giao FOR SELECT
  USING (
    public.can_manage_equipment(public.current_uid())
    OR (thiet_bi_id IS NOT NULL AND public.can_view_thiet_bi(thiet_bi_id, public.current_uid()))
  );

DROP POLICY IF EXISTS bao_tri_select ON public.bao_tri;
CREATE POLICY bao_tri_select ON public.bao_tri FOR SELECT
  USING (
    public.can_manage_equipment(public.current_uid())
    OR (thiet_bi_id IS NOT NULL AND public.can_view_thiet_bi(thiet_bi_id, public.current_uid()))
  );

DROP POLICY IF EXISTS hong_hoc_select ON public.hong_hoc;
CREATE POLICY hong_hoc_select ON public.hong_hoc FOR SELECT
  USING (
    public.can_manage_equipment(public.current_uid())
    OR (thiet_bi_hong_id IS NOT NULL AND public.can_view_thiet_bi(thiet_bi_hong_id, public.current_uid()))
  );

DROP POLICY IF EXISTS su_co_select ON public.su_co;
CREATE POLICY su_co_select ON public.su_co FOR SELECT
  USING (
    public.can_manage_equipment(public.current_uid())
    OR (thiet_bi_id IS NOT NULL AND public.can_view_thiet_bi(thiet_bi_id, public.current_uid()))
  );

-- Storage: enforce ownership on write/delete
DO $$
DECLARE
  b text;
  user_buckets text[] := ARRAY['avatars','chat-files','chu-ky','model-anh','model-tai-lieu',
                               'nha-san-xuat-logo','so-do-tep','so-do-thu-vien','vi-tri-media'];
BEGIN
  FOREACH b IN ARRAY user_buckets LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'auth_upd_' || b);
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'auth_del_' || b);
    EXECUTE format($f$CREATE POLICY %I ON storage.objects FOR UPDATE
        USING (bucket_id = %L AND (owner = auth.uid() OR public.can_manage_equipment(public.current_uid())))
        WITH CHECK (bucket_id = %L AND (owner = auth.uid() OR public.can_manage_equipment(public.current_uid())))$f$,
      'auth_upd_' || b, b, b);
    EXECUTE format($f$CREATE POLICY %I ON storage.objects FOR DELETE
        USING (bucket_id = %L AND (owner = auth.uid() OR public.can_manage_equipment(public.current_uid())))$f$,
      'auth_del_' || b, b);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "auth_read_database-backups" ON storage.objects;
DROP POLICY IF EXISTS "auth_ins_database-backups" ON storage.objects;
DROP POLICY IF EXISTS "auth_upd_database-backups" ON storage.objects;
DROP POLICY IF EXISTS "auth_del_database-backups" ON storage.objects;

CREATE POLICY backups_read_mgr ON storage.objects FOR SELECT
  USING (bucket_id = 'database-backups' AND public.can_manage_equipment(public.current_uid()));
CREATE POLICY backups_ins_mgr ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'database-backups' AND public.can_manage_equipment(public.current_uid()));
CREATE POLICY backups_upd_mgr ON storage.objects FOR UPDATE
  USING (bucket_id = 'database-backups' AND public.can_manage_equipment(public.current_uid()))
  WITH CHECK (bucket_id = 'database-backups' AND public.can_manage_equipment(public.current_uid()));
CREATE POLICY backups_del_mgr ON storage.objects FOR DELETE
  USING (bucket_id = 'database-backups' AND public.can_manage_equipment(public.current_uid()));
