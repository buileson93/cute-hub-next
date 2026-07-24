-- Lưu toàn văn "Báo cáo ban đầu" và mã nhóm liên kết nhiều thiết bị trong cùng một sự cố
ALTER TABLE public.su_co
  ADD COLUMN IF NOT EXISTS bao_cao_ban_dau jsonb,
  ADD COLUMN IF NOT EXISTS ma_nhom_bc text;

CREATE INDEX IF NOT EXISTS su_co_ma_nhom_bc_idx ON public.su_co (ma_nhom_bc);

-- Cho phép người dùng thuộc đúng đơn vị quản lý thiết bị được lập phiếu sự cố cho thiết bị đó
-- (bổ sung, không thay thế chính sách quản lý thiết bị hiện có)
DROP POLICY IF EXISTS su_co_insert_owner ON public.su_co;
CREATE POLICY su_co_insert_owner ON public.su_co
  FOR INSERT TO authenticated
  WITH CHECK (
    is_active_user(auth.uid())
    AND thiet_bi IS NOT NULL
    AND can_view_thiet_bi_ma(thiet_bi, auth.uid())
  );