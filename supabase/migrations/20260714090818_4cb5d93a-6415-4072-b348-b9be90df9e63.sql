CREATE OR REPLACE FUNCTION public.thay_the_thiet_bi(p_thanh_phan_id uuid, p_thiet_bi_moi_id uuid, p_hong_hoc_id uuid DEFAULT NULL::uuid, p_ghi_chu text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_gan_cu uuid; v_id uuid; v_tt text;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền quản lý thiết bị';
  END IF;

  SELECT trang_thai INTO v_tt
  FROM public.he_thong_thanh_phan
  WHERE id = p_thanh_phan_id
  FOR UPDATE;

  IF v_tt IS NULL THEN
    RAISE EXCEPTION 'Vị trí chức năng không tồn tại';
  END IF;
  IF v_tt <> 'hoat_dong' THEN
    RAISE EXCEPTION 'Vị trí chức năng đã ngừng';
  END IF;

  SELECT id INTO v_gan_cu
  FROM public.gan_chuc_nang
  WHERE thanh_phan_id = p_thanh_phan_id AND den_ngay IS NULL
  FOR UPDATE;

  -- Đóng dòng cũ tại CHÍNH thành phần này; không đóng các vai trò khác của thiết bị mới.
  -- Mô hình hiện tại cho phép 1 thiết bị vật lý đảm nhiệm nhiều thành phần/vai trò.
  IF v_gan_cu IS NOT NULL THEN
    PERFORM public._dong_gan_va_vong_doi(
      v_gan_cu,
      'thay do hỏng',
      p_hong_hoc_id,
      public._map_trang_thai_tb('sửa'),
      'Thay thế do hỏng'
    );
  END IF;

  v_id := public._mo_gan_va_vong_doi(
    p_thanh_phan_id,
    p_thiet_bi_moi_id,
    'thay do hỏng',
    p_hong_hoc_id,
    p_ghi_chu
  );

  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.thay_the_thiet_bi(uuid, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.thay_the_thiet_bi(uuid, uuid, uuid, text) TO authenticated, service_role;