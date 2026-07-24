DROP POLICY IF EXISTS gcn_select ON public.gan_chuc_nang;

CREATE POLICY gcn_select
ON public.gan_chuc_nang
FOR SELECT
USING (
  public.is_active_user(auth.uid())
  AND (
    public.can_manage_equipment(auth.uid())
    OR public.can_view_thiet_bi(thiet_bi_id, auth.uid())
    OR (don_vi_id_snapshot IS NOT NULL AND don_vi_id_snapshot = public.get_user_don_vi_id(auth.uid()))
    OR EXISTS (
      SELECT 1
      FROM public.he_thong_thanh_phan tp
      JOIN public.dm_he_thong h ON h.id = tp.he_thong_id
      WHERE tp.id = gan_chuc_nang.thanh_phan_id
        AND h.don_vi_id = public.get_user_don_vi_id(auth.uid())
    )
  )
);