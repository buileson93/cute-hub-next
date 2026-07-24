-- Bảng lưu sơ đồ hệ thống (vẽ bằng React Flow), phân phạm vi theo đơn vị
CREATE TABLE public.so_do_he_thong (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  don_vi_id uuid REFERENCES public.dm_don_vi(id) ON DELETE SET NULL,
  ten text NOT NULL,
  mo_ta text,
  du_lieu jsonb NOT NULL DEFAULT '{"nodes":[],"edges":[]}'::jsonb,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.so_do_he_thong TO authenticated;
GRANT ALL ON public.so_do_he_thong TO service_role;

ALTER TABLE public.so_do_he_thong ENABLE ROW LEVEL SECURITY;

-- Xem: người dùng đang hoạt động; admin/phòng KT xem toàn hệ thống, còn lại chỉ xem sơ đồ đơn vị mình
CREATE POLICY "so_do_read_scope" ON public.so_do_he_thong
  FOR SELECT
  USING (
    is_active_user(auth.uid())
    AND (
      can_manage_equipment(auth.uid())
      OR don_vi_id = get_user_don_vi_id(auth.uid())
    )
  );

-- Tạo mới: chỉ trong phạm vi đơn vị của mình (hoặc admin/phòng KT), và created_by = chính mình
CREATE POLICY "so_do_insert_scope" ON public.so_do_he_thong
  FOR INSERT
  WITH CHECK (
    is_active_user(auth.uid())
    AND created_by = auth.uid()
    AND (
      can_manage_equipment(auth.uid())
      OR don_vi_id = get_user_don_vi_id(auth.uid())
    )
  );

-- Sửa: trong phạm vi đơn vị của mình (hoặc admin/phòng KT)
CREATE POLICY "so_do_update_scope" ON public.so_do_he_thong
  FOR UPDATE
  USING (
    can_manage_equipment(auth.uid())
    OR don_vi_id = get_user_don_vi_id(auth.uid())
  )
  WITH CHECK (
    can_manage_equipment(auth.uid())
    OR don_vi_id = get_user_don_vi_id(auth.uid())
  );

-- Xoá: trong phạm vi đơn vị của mình (hoặc admin/phòng KT)
CREATE POLICY "so_do_delete_scope" ON public.so_do_he_thong
  FOR DELETE
  USING (
    can_manage_equipment(auth.uid())
    OR don_vi_id = get_user_don_vi_id(auth.uid())
  );

CREATE TRIGGER trg_so_do_updated_at
  BEFORE UPDATE ON public.so_do_he_thong
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_so_do_don_vi ON public.so_do_he_thong(don_vi_id);