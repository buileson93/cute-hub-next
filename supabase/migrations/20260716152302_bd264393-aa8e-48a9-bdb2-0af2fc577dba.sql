
DROP POLICY IF EXISTS bao_tri_select ON public.bao_tri;
CREATE POLICY bao_tri_select ON public.bao_tri FOR SELECT TO authenticated
USING (public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (thiet_bi_id IS NOT NULL AND public.can_view_thiet_bi(thiet_bi_id, public.current_uid()))));

DROP POLICY IF EXISTS su_co_select ON public.su_co;
CREATE POLICY su_co_select ON public.su_co FOR SELECT TO authenticated
USING (public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (thiet_bi_id IS NOT NULL AND public.can_view_thiet_bi(thiet_bi_id, public.current_uid()))));

DROP POLICY IF EXISTS ban_giao_select ON public.ban_giao;
CREATE POLICY ban_giao_select ON public.ban_giao FOR SELECT TO authenticated
USING (public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (thiet_bi_id IS NOT NULL AND public.can_view_thiet_bi(thiet_bi_id, public.current_uid()))));

DROP POLICY IF EXISTS hong_hoc_select ON public.hong_hoc;
CREATE POLICY hong_hoc_select ON public.hong_hoc FOR SELECT TO authenticated
USING (public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (thiet_bi_hong_id IS NOT NULL AND public.can_view_thiet_bi(thiet_bi_hong_id, public.current_uid()))));

DROP POLICY IF EXISTS "auth_upd_chat-files" ON storage.objects;
CREATE POLICY "auth_upd_chat-files" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'chat-files' AND owner = auth.uid())
WITH CHECK (bucket_id = 'chat-files' AND owner = auth.uid());

DROP POLICY IF EXISTS "auth_del_chat-files" ON storage.objects;
CREATE POLICY "auth_del_chat-files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-files' AND owner = auth.uid());
