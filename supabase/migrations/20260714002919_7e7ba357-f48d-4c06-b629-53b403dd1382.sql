CREATE OR REPLACE FUNCTION public.dieu_chuyen_thiet_bi(
  p_thiet_bi_id uuid,
  p_thanh_phan_moi_id uuid,
  p_ghi_chu text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_gan_cu uuid; v_tt text; v_id uuid;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền quản lý thiết bị';
  END IF;

  -- Khe đích phải tồn tại, đang hoạt động và còn trống.
  SELECT trang_thai INTO v_tt FROM public.he_thong_thanh_phan
    WHERE id = p_thanh_phan_moi_id FOR UPDATE;
  IF v_tt IS NULL THEN RAISE EXCEPTION 'Khe chức năng đích không tồn tại'; END IF;
  IF v_tt <> 'hoat_dong' THEN RAISE EXCEPTION 'Khe chức năng đích đã ngừng'; END IF;
  IF EXISTS (SELECT 1 FROM public.gan_chuc_nang
             WHERE thanh_phan_id = p_thanh_phan_moi_id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Khe đích đang có thiết bị, hãy dùng Thay thế';
  END IF;

  -- Đóng dòng gán hiện tại của thiết bị (nếu có), giữ nguyên trạng thái vì
  -- thiết bị vẫn tiếp tục khai thác ở khe mới.
  SELECT id INTO v_gan_cu FROM public.gan_chuc_nang
    WHERE thiet_bi_id = p_thiet_bi_id AND den_ngay IS NULL FOR UPDATE;
  IF v_gan_cu IS NOT NULL THEN
    PERFORM public._dong_gan_va_vong_doi(
      v_gan_cu, 'điều chuyển', NULL, NULL, 'Điều chuyển sang khe khác');
  END IF;

  -- Mở dòng gán mới ở khe đích.
  v_id := public._mo_gan_va_vong_doi(
    p_thanh_phan_moi_id, p_thiet_bi_id, 'điều chuyển', NULL, p_ghi_chu);
  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.dieu_chuyen_thiet_bi(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dieu_chuyen_thiet_bi(uuid, uuid, text) TO authenticated, service_role;