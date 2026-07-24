-- Thay thế RPC thay_the_thiet_bi: thêm tham số p_vi_tri_tai_san_cu_id (tuỳ chọn).
-- Khi có giá trị và tồn tại tài sản cũ tại vị trí chức năng, cập nhật thiet_bi.vi_tri_id
-- cho tài sản cũ về vị trí đích (kho/xưởng), tương tự thao_tai_san_khoi_thanh_phan.
DROP FUNCTION IF EXISTS public.thay_the_thiet_bi(uuid, uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.thay_the_thiet_bi(
  p_thanh_phan_id uuid,
  p_thiet_bi_moi_id uuid,
  p_hong_hoc_id uuid DEFAULT NULL,
  p_ghi_chu text DEFAULT NULL,
  p_vi_tri_tai_san_cu_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_gan_cu uuid;
  v_tb_cu  uuid;
  v_id     uuid;
  v_tt     text;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền quản lý thiết bị';
  END IF;

  IF p_vi_tri_tai_san_cu_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.dm_vi_tri WHERE id = p_vi_tri_tai_san_cu_id) THEN
    RAISE EXCEPTION 'Vị trí đích cho tài sản cũ không tồn tại';
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

  SELECT id, thiet_bi_id
    INTO v_gan_cu, v_tb_cu
  FROM public.gan_chuc_nang
  WHERE thanh_phan_id = p_thanh_phan_id AND den_ngay IS NULL
  FOR UPDATE;

  -- Đóng bản ghi cũ + ghi vòng đời tài sản cũ.
  IF v_gan_cu IS NOT NULL THEN
    PERFORM public._dong_gan_va_vong_doi(
      v_gan_cu,
      'thay do hỏng',
      p_hong_hoc_id,
      public._map_trang_thai_tb('sửa'),
      'Thay thế do hỏng'
    );

    -- Nếu người dùng chỉ định vị trí đích → chuyển tài sản cũ về đó.
    IF p_vi_tri_tai_san_cu_id IS NOT NULL AND v_tb_cu IS NOT NULL THEN
      UPDATE public.thiet_bi
         SET vi_tri_id = p_vi_tri_tai_san_cu_id
       WHERE id = v_tb_cu;
    END IF;
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

REVOKE ALL ON FUNCTION public.thay_the_thiet_bi(uuid, uuid, uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.thay_the_thiet_bi(uuid, uuid, uuid, text, uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.thay_the_thiet_bi(uuid, uuid, uuid, text, uuid) IS
'Thay thế tài sản tại vị trí chức năng. Nếu p_vi_tri_tai_san_cu_id được truyền, tài sản cũ được chuyển về vị trí đó (thường là kho sửa chữa/xưởng). Nếu bỏ trống, tài sản cũ giữ nguyên vị trí (tương thích ngược).';