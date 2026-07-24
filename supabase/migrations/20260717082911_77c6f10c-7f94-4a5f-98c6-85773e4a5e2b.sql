
CREATE OR REPLACE FUNCTION public._validate_vi_tri_tuong_thich(
  p_vi_tri_id uuid,
  p_thanh_phan_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vt_ma text;
  v_vt_active boolean;
  v_dv_ma text;
  v_dv_id uuid;
BEGIN
  IF p_vi_tri_id IS NULL THEN RETURN; END IF;

  SELECT ma, active INTO v_vt_ma, v_vt_active
  FROM public.dm_vi_tri WHERE id = p_vi_tri_id;

  IF v_vt_ma IS NULL THEN
    RAISE EXCEPTION 'Vị trí đích không tồn tại' USING ERRCODE = '22023';
  END IF;
  IF v_vt_active IS FALSE THEN
    RAISE EXCEPTION 'Vị trí đích "%" đã ngừng hoạt động', v_vt_ma USING ERRCODE = '22023';
  END IF;

  SELECT ht.don_vi_id, dv.ma
    INTO v_dv_id, v_dv_ma
  FROM public.he_thong_thanh_phan tp
  JOIN public.dm_he_thong ht ON ht.id = tp.he_thong_id
  LEFT JOIN public.dm_don_vi dv ON dv.id = ht.don_vi_id
  WHERE tp.id = p_thanh_phan_id;

  IF v_vt_ma = 'KHO_CONG_TY' THEN RETURN; END IF;

  IF v_dv_ma IS NULL THEN
    RAISE EXCEPTION 'Thành phần chưa xác định đơn vị quản lý; chỉ được chọn KHO_CONG_TY làm vị trí đích'
      USING ERRCODE = '22023';
  END IF;

  IF v_vt_ma = v_dv_ma OR v_vt_ma ILIKE ('%\_' || v_dv_ma) THEN RETURN; END IF;

  RAISE EXCEPTION 'Vị trí "%" không thuộc đơn vị quản lý "%". Vui lòng chọn kho/xưởng của đơn vị này hoặc KHO_CONG_TY.',
    v_vt_ma, v_dv_ma
    USING ERRCODE = '22023';
END;
$$;

CREATE OR REPLACE FUNCTION public.thay_the_thiet_bi(
  p_thanh_phan_id uuid,
  p_thiet_bi_moi_id uuid,
  p_hong_hoc_id uuid DEFAULT NULL,
  p_ghi_chu text DEFAULT NULL,
  p_vi_tri_tai_san_cu_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gan_cu uuid;
  v_tb_cu  uuid;
  v_id     uuid;
  v_tt     text;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền quản lý thiết bị';
  END IF;

  IF p_vi_tri_tai_san_cu_id IS NOT NULL THEN
    PERFORM public._validate_vi_tri_tuong_thich(p_vi_tri_tai_san_cu_id, p_thanh_phan_id);
  END IF;

  SELECT trang_thai INTO v_tt
  FROM public.he_thong_thanh_phan
  WHERE id = p_thanh_phan_id
  FOR UPDATE;

  IF v_tt IS NULL THEN RAISE EXCEPTION 'Vị trí chức năng không tồn tại'; END IF;
  IF v_tt <> 'hoat_dong' THEN RAISE EXCEPTION 'Vị trí chức năng đã ngừng'; END IF;

  SELECT id, thiet_bi_id INTO v_gan_cu, v_tb_cu
  FROM public.gan_chuc_nang
  WHERE thanh_phan_id = p_thanh_phan_id AND den_ngay IS NULL
  FOR UPDATE;

  IF v_gan_cu IS NOT NULL THEN
    PERFORM public._dong_gan_va_vong_doi(
      v_gan_cu, 'thay do hỏng', p_hong_hoc_id,
      public._map_trang_thai_tb('sửa'), 'Thay thế do hỏng'
    );
    IF p_vi_tri_tai_san_cu_id IS NOT NULL AND v_tb_cu IS NOT NULL THEN
      UPDATE public.thiet_bi SET vi_tri_id = p_vi_tri_tai_san_cu_id WHERE id = v_tb_cu;
    END IF;
  END IF;

  v_id := public._mo_gan_va_vong_doi(
    p_thanh_phan_id, p_thiet_bi_moi_id, 'thay do hỏng', p_hong_hoc_id, p_ghi_chu
  );
  RETURN v_id;
END;
$$;

-- Thêm validation vào RPC tháo tài sản, giữ nguyên chữ ký hiện có
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT oid, pg_get_function_identity_arguments(oid) AS args
    FROM pg_proc WHERE proname='thao_tai_san_khoi_thanh_phan'
  LOOP
    RAISE NOTICE 'existing thao_tai_san_khoi_thanh_phan(%)', r.args;
  END LOOP;
END $$;
