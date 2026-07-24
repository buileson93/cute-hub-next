-- ============================================================
-- PART 1: ID-based equipment access for operational tables
-- ============================================================
ALTER TABLE public.su_co    ADD COLUMN IF NOT EXISTS thiet_bi_id uuid REFERENCES public.thiet_bi(id);
ALTER TABLE public.bao_tri  ADD COLUMN IF NOT EXISTS thiet_bi_id uuid REFERENCES public.thiet_bi(id);
ALTER TABLE public.ban_giao ADD COLUMN IF NOT EXISTS thiet_bi_id uuid REFERENCES public.thiet_bi(id);
ALTER TABLE public.hong_hoc ADD COLUMN IF NOT EXISTS thiet_bi_hong_id uuid REFERENCES public.thiet_bi(id);
ALTER TABLE public.hong_hoc ADD COLUMN IF NOT EXISTS thiet_bi_thay_the_id uuid REFERENCES public.thiet_bi(id);

CREATE INDEX IF NOT EXISTS idx_su_co_thiet_bi_id ON public.su_co(thiet_bi_id);
CREATE INDEX IF NOT EXISTS idx_bao_tri_thiet_bi_id ON public.bao_tri(thiet_bi_id);
CREATE INDEX IF NOT EXISTS idx_ban_giao_thiet_bi_id ON public.ban_giao(thiet_bi_id);
CREATE INDEX IF NOT EXISTS idx_hong_hoc_thiet_bi_hong_id ON public.hong_hoc(thiet_bi_hong_id);

-- ID-based access helper
CREATE OR REPLACE FUNCTION public.can_view_thiet_bi(_id uuid, _user uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.thiet_bi t
    WHERE t.id = _id
      AND (
        public.can_manage_equipment(_user)
        OR (t.don_vi_quan_ly_id IS NOT DISTINCT FROM public.get_user_don_vi_id(_user))
        OR (t.don_vi_id IS NOT DISTINCT FROM public.get_user_don_vi_id(_user))
      )
  )
$$;

-- Recreate operational SELECT/INSERT policies using ID-based helper
DROP POLICY IF EXISTS su_co_select ON public.su_co;
CREATE POLICY su_co_select ON public.su_co FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND (can_manage_equipment(auth.uid())
    OR (thiet_bi_id IS NOT NULL AND can_view_thiet_bi(thiet_bi_id, auth.uid()))));

DROP POLICY IF EXISTS su_co_insert_owner ON public.su_co;
CREATE POLICY su_co_insert_owner ON public.su_co FOR INSERT TO authenticated
  WITH CHECK (is_active_user(auth.uid()) AND thiet_bi_id IS NOT NULL
    AND can_view_thiet_bi(thiet_bi_id, auth.uid()));

DROP POLICY IF EXISTS bao_tri_select ON public.bao_tri;
CREATE POLICY bao_tri_select ON public.bao_tri FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND (can_manage_equipment(auth.uid())
    OR (thiet_bi_id IS NOT NULL AND can_view_thiet_bi(thiet_bi_id, auth.uid()))));

DROP POLICY IF EXISTS ban_giao_select ON public.ban_giao;
CREATE POLICY ban_giao_select ON public.ban_giao FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND (can_manage_equipment(auth.uid())
    OR (thiet_bi_id IS NOT NULL AND can_view_thiet_bi(thiet_bi_id, auth.uid()))));

DROP POLICY IF EXISTS hong_hoc_select ON public.hong_hoc;
CREATE POLICY hong_hoc_select ON public.hong_hoc FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND (can_manage_equipment(auth.uid())
    OR (thiet_bi_hong_id IS NOT NULL AND can_view_thiet_bi(thiet_bi_hong_id, auth.uid()))));

-- Remove now-unused text-matching helper
DROP FUNCTION IF EXISTS public.can_view_thiet_bi_ma(text, uuid);

-- ============================================================
-- PART 2: Restrict public-schema policies to authenticated only
-- ============================================================
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS form_submission_select_scope ON public.form_submission;
CREATE POLICY form_submission_select_scope ON public.form_submission FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND (can_manage_equipment(auth.uid()) OR (created_by = auth.uid())
    OR ((status <> 'draft'::form_submission_status) AND (don_vi_id IS NOT NULL)
        AND (don_vi_id = get_user_don_vi_id(auth.uid())))));

DROP POLICY IF EXISTS giay_phep_read_scope ON public.giay_phep;
CREATE POLICY giay_phep_read_scope ON public.giay_phep FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND (can_manage_equipment(auth.uid()) OR (EXISTS (
    SELECT 1 FROM thiet_bi tb WHERE tb.id = giay_phep.thiet_bi_id
      AND NOT (tb.don_vi_quan_ly_id IS DISTINCT FROM get_user_don_vi_id(auth.uid()))))));

DROP POLICY IF EXISTS tep_select_scope ON public.thiet_bi_tep_dinh_kem;
CREATE POLICY tep_select_scope ON public.thiet_bi_tep_dinh_kem FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND (can_manage_equipment(auth.uid()) OR (EXISTS (
    SELECT 1 FROM thiet_bi tb WHERE tb.id = thiet_bi_tep_dinh_kem.thiet_bi_id
      AND NOT (tb.don_vi_quan_ly_id IS DISTINCT FROM get_user_don_vi_id(auth.uid()))))));

DROP POLICY IF EXISTS tep_write_manager ON public.thiet_bi_tep_dinh_kem;
CREATE POLICY tep_write_manager ON public.thiet_bi_tep_dinh_kem FOR ALL TO authenticated
  USING (can_manage_equipment(auth.uid())) WITH CHECK (can_manage_equipment(auth.uid()));

-- ============================================================
-- PART 3: Storage policies — restrict to authenticated / own folder
-- ============================================================
DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
CREATE POLICY avatars_owner_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.uid())::text);

DROP POLICY IF EXISTS tep_storage_select_scope ON storage.objects;
CREATE POLICY tep_storage_select_scope ON storage.objects FOR SELECT TO authenticated
  USING ((bucket_id = ANY (ARRAY['thiet-bi-hinh-anh'::text, 'thiet-bi-tai-lieu'::text]))
    AND is_active_user(auth.uid()) AND (can_manage_equipment(auth.uid()) OR (EXISTS (
      SELECT 1 FROM thiet_bi tb WHERE (tb.id)::text = split_part(objects.name, '/', 1)
        AND NOT (tb.don_vi_quan_ly_id IS DISTINCT FROM get_user_don_vi_id(auth.uid()))))));

DROP POLICY IF EXISTS tep_storage_write_manager ON storage.objects;
CREATE POLICY tep_storage_write_manager ON storage.objects FOR ALL TO authenticated
  USING ((bucket_id = ANY (ARRAY['thiet-bi-hinh-anh'::text, 'thiet-bi-tai-lieu'::text]))
    AND can_manage_equipment(auth.uid()))
  WITH CHECK ((bucket_id = ANY (ARRAY['thiet-bi-hinh-anh'::text, 'thiet-bi-tai-lieu'::text]))
    AND can_manage_equipment(auth.uid()));

-- ============================================================
-- PART 4: Function EXECUTE hardening
-- ============================================================
-- 4a) Trigger-only + internal-only SECURITY DEFINER fns: no direct callers.
REVOKE EXECUTE ON FUNCTION public.notify_ticket_comment() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_message() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_ticket_update() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_ticket_new() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_cong_viec_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.audit_row_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.protect_profile_privileged_fields() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public._cay_apply(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_app_event(text, text, text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public._admin_check_table(text) FROM anon, authenticated, public;

-- 4b) RLS helpers + client RPCs: keep authenticated, remove anon/public.
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.has_role(uuid, app_role)',
    'public.can_manage_equipment(uuid)',
    'public.can_access_ticket(uuid, uuid)',
    'public.can_access_so_do(uuid, uuid)',
    'public.can_access_du_an(uuid, uuid)',
    'public.can_manage_du_an(uuid, uuid)',
    'public.can_edit_cong_viec(uuid, uuid)',
    'public.is_conv_participant(uuid, uuid)',
    'public.is_active_user(uuid)',
    'public.get_user_don_vi_ma(uuid)',
    'public.get_user_don_vi_id(uuid)',
    'public.can_view_thiet_bi(uuid, uuid)',
    'public.get_ai_public_config()',
    'public.ai_describe_schema()',
    'public.phan_quyen_thong_ke()',
    'public.cay_submit_change(text, text, text, jsonb)',
    'public.cay_duyet(uuid, boolean)',
    'public.cay_hoan_tac(uuid)',
    'public.admin_add_column(text, text, text, boolean, text)',
    'public.admin_drop_column(text, text)',
    'public.admin_rename_column(text, text, text)',
    'public.admin_list_schema()',
    'public.admin_rollback_audit(uuid)'
  ]
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, public;', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated;', fn);
  END LOOP;
END $$;