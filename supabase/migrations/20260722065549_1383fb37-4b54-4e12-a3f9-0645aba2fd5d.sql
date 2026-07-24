-- Scope license reads to user's don_vi; managers keep full visibility.

DROP POLICY IF EXISTS lookup_read_active ON public.dm_he_thong;
CREATE POLICY dm_he_thong_read_scope ON public.dm_he_thong
  FOR SELECT TO authenticated
  USING (
    is_active_user(current_uid())
    AND (
      can_manage_equipment(current_uid())
      OR don_vi_id IS NULL
      OR don_vi_id = get_user_don_vi_id(current_uid())
    )
  );

DROP POLICY IF EXISTS gpkt_read_active ON public.giay_phep_khai_thac;
CREATE POLICY gpkt_read_scope ON public.giay_phep_khai_thac
  FOR SELECT TO authenticated
  USING (
    is_active_user(current_uid())
    AND (
      can_manage_equipment(current_uid())
      OR he_thong_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.dm_he_thong h
        WHERE h.id = giay_phep_khai_thac.he_thong_id
          AND (h.don_vi_id IS NULL OR h.don_vi_id = get_user_don_vi_id(current_uid()))
      )
    )
  );