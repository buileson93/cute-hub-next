
-- Bỏ ràng buộc unique để cho phép cùng 1 tài sản có nhiều dòng gán hiệu lực.
DROP INDEX IF EXISTS public.uq_gcn_thiet_bi_active;

-- RPC UI đang dùng: KHÔNG tự đóng bản ghi active cũ nữa.
CREATE OR REPLACE FUNCTION public.lap_tai_san_vao_thanh_phan(
  p_thiet_bi_id uuid,
  p_thanh_phan_id uuid,
  p_ly_do text DEFAULT 'lắp mới',
  p_ghi_chu text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  -- Chỉ chặn trùng ở CÙNG một thành phần (đã có partial unique uq_gcn_thanh_phan_active).
  INSERT INTO public.gan_chuc_nang (thanh_phan_id, thiet_bi_id, ly_do, ghi_chu, nguoi_thuc_hien)
  VALUES (p_thanh_phan_id, p_thiet_bi_id, p_ly_do, p_ghi_chu, current_uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
