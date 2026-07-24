
-- Siết chính sách INSERT trên kho_giao_dich: khớp scope đơn vị/quyền quản lý (giống policy SELECT).
DROP POLICY IF EXISTS kgd_insert ON public.kho_giao_dich;
CREATE POLICY kgd_insert ON public.kho_giao_dich
  FOR INSERT TO authenticated
  WITH CHECK (
    is_active_user(current_uid())
    AND (
      can_manage_equipment(current_uid())
      OR don_vi_id = get_user_don_vi_id(current_uid())
    )
  );

-- Siết chính sách UPDATE trên node_note: chỉ chủ sở hữu hoặc người có quyền quản lý.
DROP POLICY IF EXISTS node_note_update_auth ON public.node_note;
CREATE POLICY node_note_update_auth ON public.node_note
  FOR UPDATE TO authenticated
  USING (
    can_manage_equipment(current_uid())
    OR updated_by = current_uid()
  )
  WITH CHECK (updated_by = current_uid());
