CREATE OR REPLACE FUNCTION public.khai_them_thanh_phan_he_thong(
  p_he_thong_id uuid,
  p_ma_thanh_phan text,
  p_ten text,
  p_loai_thiet_bi_yeu_cau uuid DEFAULT NULL::uuid,
  p_thanh_phan_cha uuid DEFAULT NULL::uuid,
  p_bat_buoc boolean DEFAULT true,
  p_thu_tu integer DEFAULT NULL::integer,
  p_mo_ta text DEFAULT NULL::text
)
RETURNS TABLE(id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_user uuid := public.current_uid();
  v_ma text := NULLIF(btrim(p_ma_thanh_phan), '');
  v_ten text := NULLIF(btrim(p_ten), '');
  v_id uuid;
  v_he_thong public.dm_he_thong%ROWTYPE;
  v_stage text := 'start';
BEGIN
  v_stage := 'auth';
  IF v_user IS NULL OR NOT public.is_active_user(v_user) THEN
    RAISE EXCEPTION 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn'
      USING ERRCODE = '42501';
  END IF;

  IF NOT public.can_manage_equipment(v_user) THEN
    RAISE EXCEPTION 'Tài khoản chưa có quyền khai thêm thành phần hệ thống'
      USING ERRCODE = '42501';
  END IF;

  IF p_he_thong_id IS NULL THEN
    RAISE EXCEPTION 'Chưa chọn hệ thống cha'
      USING ERRCODE = '23502';
  END IF;

  v_stage := 'select_dm_he_thong';
  SELECT *
    INTO v_he_thong
    FROM public.dm_he_thong
   WHERE dm_he_thong.id = p_he_thong_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy hệ thống cha'
      USING ERRCODE = '23503';
  END IF;

  v_stage := 'validate_input';
  IF v_ten IS NULL THEN
    RAISE EXCEPTION 'Chưa nhập tên thành phần'
      USING ERRCODE = '23502';
  END IF;

  v_stage := 'validate_parent';
  IF p_thanh_phan_cha IS NOT NULL AND NOT EXISTS (
    SELECT 1
      FROM public.he_thong_thanh_phan tp
     WHERE tp.id = p_thanh_phan_cha
       AND tp.he_thong_id = p_he_thong_id
  ) THEN
    RAISE EXCEPTION 'Thành phần cha không thuộc hệ thống đã chọn'
      USING ERRCODE = '23503';
  END IF;

  v_stage := 'validate_loai';
  IF p_loai_thiet_bi_yeu_cau IS NOT NULL AND NOT EXISTS (
    SELECT 1
      FROM public.dm_loai_thiet_bi ltb
     WHERE ltb.id = p_loai_thiet_bi_yeu_cau
  ) THEN
    RAISE EXCEPTION 'Chủng loại yêu cầu không tồn tại'
      USING ERRCODE = '23503';
  END IF;

  v_stage := 'generate_code';
  IF v_ma IS NULL THEN
    v_ma := 'TPHT_' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;

  WHILE EXISTS (
    SELECT 1
      FROM public.he_thong_thanh_phan tp
     WHERE tp.he_thong_id = p_he_thong_id
       AND tp.ma_thanh_phan = v_ma
  ) LOOP
    v_ma := 'TPHT_' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END LOOP;

  v_stage := 'insert_he_thong_thanh_phan';
  INSERT INTO public.he_thong_thanh_phan (
    he_thong_id,
    ma_thanh_phan,
    ten,
    loai_thiet_bi_yeu_cau,
    thanh_phan_cha,
    bat_buoc,
    thu_tu,
    mo_ta,
    created_by
  ) VALUES (
    v_he_thong.id,
    v_ma,
    v_ten,
    p_loai_thiet_bi_yeu_cau,
    p_thanh_phan_cha,
    COALESCE(p_bat_buoc, true),
    p_thu_tu,
    NULLIF(btrim(COALESCE(p_mo_ta, '')), ''),
    v_user
  )
  RETURNING he_thong_thanh_phan.id INTO v_id;

  RETURN QUERY SELECT v_id;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'khai_them_thanh_phan_he_thong[%]: %', v_stage, SQLERRM
    USING ERRCODE = SQLSTATE;
END;
$$;

ALTER FUNCTION public.khai_them_thanh_phan_he_thong(uuid, text, text, uuid, uuid, boolean, integer, text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.khai_them_thanh_phan_he_thong(uuid, text, text, uuid, uuid, boolean, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.khai_them_thanh_phan_he_thong(uuid, text, text, uuid, uuid, boolean, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.khai_them_thanh_phan_he_thong(uuid, text, text, uuid, uuid, boolean, integer, text) TO sandbox_exec;
GRANT EXECUTE ON FUNCTION public.khai_them_thanh_phan_he_thong(uuid, text, text, uuid, uuid, boolean, integer, text) TO postgres;
NOTIFY pgrst, 'reload schema';