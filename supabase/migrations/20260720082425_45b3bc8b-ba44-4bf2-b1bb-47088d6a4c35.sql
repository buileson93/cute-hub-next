
-- 1) Fix function search_path
ALTER FUNCTION public._danh_muc_merge_ref_map() SET search_path = public;

-- 2) so_do_tep_dinh_kem DELETE requires owner or manager
DROP POLICY IF EXISTS so_do_tep_delete ON public.so_do_tep_dinh_kem;
CREATE POLICY so_do_tep_delete ON public.so_do_tep_dinh_kem
  FOR DELETE TO authenticated
  USING (
    can_access_so_do(so_do_id, current_uid())
    AND (created_by = current_uid() OR can_manage_equipment(current_uid()))
  );

-- 3) Scope policies to authenticated (drop {public}, recreate identical for {authenticated})

-- cay_node_edit SELECT
DROP POLICY IF EXISTS cay_node_edit_select ON public.cay_node_edit;
CREATE POLICY cay_node_edit_select ON public.cay_node_edit
  FOR SELECT TO authenticated
  USING (can_manage_equipment(current_uid()) OR created_by = current_uid());

-- cong_viec_bao_tri
DROP POLICY IF EXISTS cvbt_select ON public.cong_viec_bao_tri;
CREATE POLICY cvbt_select ON public.cong_viec_bao_tri
  FOR SELECT TO authenticated
  USING (
    is_active_user(current_uid()) AND (
      can_manage_equipment(current_uid())
      OR (thiet_bi_id IS NOT NULL AND can_view_thiet_bi(thiet_bi_id, current_uid()))
      OR (don_vi_id_snapshot IS NOT NULL AND don_vi_id_snapshot = get_user_don_vi_id(current_uid()))
    )
  );
DROP POLICY IF EXISTS cvbt_write ON public.cong_viec_bao_tri;
CREATE POLICY cvbt_write ON public.cong_viec_bao_tri
  FOR ALL TO authenticated
  USING (can_manage_equipment(current_uid()))
  WITH CHECK (can_manage_equipment(current_uid()));

-- gan_chuc_nang
DROP POLICY IF EXISTS gcn_select ON public.gan_chuc_nang;
CREATE POLICY gcn_select ON public.gan_chuc_nang
  FOR SELECT TO authenticated
  USING (
    is_active_user(current_uid()) AND (
      can_manage_equipment(current_uid())
      OR can_view_thiet_bi(thiet_bi_id, current_uid())
      OR (don_vi_id_snapshot IS NOT NULL AND don_vi_id_snapshot = get_user_don_vi_id(current_uid()))
    )
  );
DROP POLICY IF EXISTS gcn_write_manager ON public.gan_chuc_nang;
CREATE POLICY gcn_write_manager ON public.gan_chuc_nang
  FOR ALL TO authenticated
  USING (can_manage_equipment(current_uid()))
  WITH CHECK (can_manage_equipment(current_uid()));

-- kho_giao_dich
DROP POLICY IF EXISTS kgd_insert ON public.kho_giao_dich;
CREATE POLICY kgd_insert ON public.kho_giao_dich
  FOR INSERT TO authenticated
  WITH CHECK (true);
DROP POLICY IF EXISTS kgd_select ON public.kho_giao_dich;
CREATE POLICY kgd_select ON public.kho_giao_dich
  FOR SELECT TO authenticated
  USING (
    is_active_user(current_uid()) AND (
      can_manage_equipment(current_uid())
      OR don_vi_id IS NULL
      OR don_vi_id = get_user_don_vi_id(current_uid())
    )
  );

-- model_tai_lieu
DROP POLICY IF EXISTS model_tai_lieu_select ON public.model_tai_lieu;
CREATE POLICY model_tai_lieu_select ON public.model_tai_lieu
  FOR SELECT TO authenticated
  USING (can_manage_equipment(current_uid()));

-- nhan_vien
DROP POLICY IF EXISTS nhan_vien_select ON public.nhan_vien;
CREATE POLICY nhan_vien_select ON public.nhan_vien
  FOR SELECT TO authenticated
  USING (can_manage_equipment(current_uid()));

-- node_note
DROP POLICY IF EXISTS node_note_select ON public.node_note;
CREATE POLICY node_note_select ON public.node_note
  FOR SELECT TO authenticated
  USING (can_manage_equipment(current_uid()));

-- thiet_bi_tep_dinh_kem
DROP POLICY IF EXISTS tep_select_scope ON public.thiet_bi_tep_dinh_kem;
CREATE POLICY tep_select_scope ON public.thiet_bi_tep_dinh_kem
  FOR SELECT TO authenticated
  USING (
    is_active_user(current_uid()) AND (
      can_manage_equipment(current_uid())
      OR EXISTS (
        SELECT 1 FROM thiet_bi tb
         WHERE tb.id = thiet_bi_tep_dinh_kem.thiet_bi_id
           AND NOT (tb.don_vi_quan_ly_id IS DISTINCT FROM get_user_don_vi_id(current_uid()))
      )
    )
  );
DROP POLICY IF EXISTS tep_write_manager ON public.thiet_bi_tep_dinh_kem;
CREATE POLICY tep_write_manager ON public.thiet_bi_tep_dinh_kem
  FOR ALL TO authenticated
  USING (can_manage_equipment(current_uid()))
  WITH CHECK (can_manage_equipment(current_uid()));

-- van_de
DROP POLICY IF EXISTS van_de_select ON public.van_de;
CREATE POLICY van_de_select ON public.van_de
  FOR SELECT TO authenticated
  USING (
    is_active_user(current_uid()) AND (
      can_manage_equipment(current_uid())
      OR (thiet_bi_id IS NOT NULL AND can_view_thiet_bi(thiet_bi_id, current_uid()))
      OR (don_vi_id_snapshot IS NOT NULL AND don_vi_id_snapshot = get_user_don_vi_id(current_uid()))
    )
  );
DROP POLICY IF EXISTS van_de_write ON public.van_de;
CREATE POLICY van_de_write ON public.van_de
  FOR ALL TO authenticated
  USING (can_manage_equipment(current_uid()))
  WITH CHECK (can_manage_equipment(current_uid()));
