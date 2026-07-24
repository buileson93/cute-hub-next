
-- Task 31: inline-edit RPCs — whitelist field + state-machine transitions.

-- Cập nhật ghi_chu / mo_ta / vi_tri_hien_tai của thiết bị (an toàn, không đụng ID/serial).
CREATE OR REPLACE FUNCTION public.cap_nhat_field_thiet_bi(
  p_id uuid,
  p_field text,
  p_gia_tri text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Không có quyền cập nhật thiết bị';
  END IF;

  IF p_field NOT IN ('ghi_chu', 'mo_ta', 'vi_tri_hien_tai') THEN
    RAISE EXCEPTION 'Trường "%" không được phép cập nhật qua inline edit', p_field;
  END IF;

  EXECUTE format('UPDATE public.thiet_bi SET %I = $1, updated_at = now() WHERE id = $2', p_field)
    USING p_gia_tri, p_id;
END;
$$;

-- Cập nhật ghi chú vật tư (chặn tuyệt đối cột tồn kho).
CREATE OR REPLACE FUNCTION public.cap_nhat_field_vat_tu(
  p_id uuid,
  p_field text,
  p_gia_tri text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Không có quyền cập nhật vật tư';
  END IF;

  IF p_field NOT IN ('ghi_chu', 'mo_ta', 'don_vi_tinh') THEN
    RAISE EXCEPTION 'Trường "%" không được phép cập nhật qua inline edit', p_field;
  END IF;

  EXECUTE format('UPDATE public.vat_tu SET %I = $1, updated_at = now() WHERE id = $2', p_field)
    USING p_gia_tri, p_id;
END;
$$;

-- Chuyển trạng thái sự cố — kiểm ràng buộc vòng đời ở tầng DB.
CREATE OR REPLACE FUNCTION public.chuyen_trang_thai_su_co(
  p_id uuid,
  p_trang_thai text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hien_tai text;
  v_hop_le boolean := false;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Không có quyền chuyển trạng thái sự cố';
  END IF;

  SELECT trang_thai INTO v_hien_tai FROM public.su_co WHERE id = p_id;
  IF v_hien_tai IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy sự cố';
  END IF;

  -- Ma trận chuyển hợp lệ (đối chiếu với su-co-state.ts).
  v_hop_le := (v_hien_tai, p_trang_thai) IN (
    ('Mới', 'Đang xử lý'), ('Mới', 'Đã khắc phục'), ('Mới', 'Đóng'),
    ('Đang xử lý', 'Đã khắc phục'), ('Đang xử lý', 'Đóng'), ('Đang xử lý', 'Mới'),
    ('Đã khắc phục', 'Đóng'), ('Đã khắc phục', 'Đang xử lý'),
    ('Đóng', 'Đang xử lý')
  );

  IF NOT v_hop_le THEN
    RAISE EXCEPTION 'Không được chuyển trạng thái từ "%" sang "%"', v_hien_tai, p_trang_thai;
  END IF;

  UPDATE public.su_co SET trang_thai = p_trang_thai, updated_at = now() WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cap_nhat_field_thiet_bi(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cap_nhat_field_vat_tu(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chuyen_trang_thai_su_co(uuid, text) TO authenticated;
