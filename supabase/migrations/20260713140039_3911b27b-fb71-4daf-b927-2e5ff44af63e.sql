-- ============================================================================
-- MÔ HÌNH 3 LỚP — BƯỚC 3: RPC nghiệp vụ atomic (lắp/tháo/thay/điều chuyển/tráo).
-- ============================================================================

-- Helper: ánh xạ từ khóa trạng thái -> id trong dm_trang_thai_thiet_bi.
CREATE OR REPLACE FUNCTION public._map_trang_thai_tb(p_key text)
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ma text; v_id uuid;
BEGIN
  v_ma := CASE
    WHEN p_key ILIKE '%hư hỏng%' OR p_key ILIKE '%hỏng%'            THEN 'HONG'
    WHEN p_key ILIKE '%sửa%'                                          THEN 'DANG_SUA_CHUA'
    WHEN p_key ILIKE '%ngừng%' OR p_key ILIKE '%thôi khai thác%'     THEN 'NGUNG_KHAI_THAC'
    WHEN p_key ILIKE '%thanh lý%'                                     THEN 'THANH_LY'
    WHEN p_key ILIKE '%sử dụng%' OR p_key ILIKE '%khai thác%' OR p_key ILIKE '%lắp%' THEN 'DANG_KHAI_THAC'
    ELSE 'CHO_XU_LY'   -- tháo/trong kho/mặc định
  END;
  SELECT id INTO v_id FROM public.dm_trang_thai_thiet_bi WHERE ma = v_ma LIMIT 1;
  RETURN v_id;
END;
$$;

-- Helper: đóng dòng gán hiệu lực + set trạng thái + ghi vòng đời cho thiết bị.
CREATE OR REPLACE FUNCTION public._dong_gan_va_vong_doi(
  p_gan_id uuid, p_ly_do_gan text, p_hong_hoc_id uuid,
  p_trang_thai_moi uuid, p_ly_do_vd text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tb uuid; v_cu uuid;
BEGIN
  UPDATE public.gan_chuc_nang
    SET den_ngay = now(),
        ly_do = COALESCE(p_ly_do_gan, ly_do),
        hong_hoc_id = COALESCE(p_hong_hoc_id, hong_hoc_id)
    WHERE id = p_gan_id
    RETURNING thiet_bi_id INTO v_tb;

  IF p_trang_thai_moi IS NOT NULL AND v_tb IS NOT NULL THEN
    SELECT trang_thai_id INTO v_cu FROM public.thiet_bi WHERE id = v_tb;
    UPDATE public.thiet_bi SET trang_thai_id = p_trang_thai_moi WHERE id = v_tb;
    INSERT INTO public.thiet_bi_vong_doi(thiet_bi_id, tu_trang_thai_id, den_trang_thai_id, thoi_diem, ly_do, nguoi_thuc_hien)
    VALUES (v_tb, v_cu, p_trang_thai_moi, now(), COALESCE(p_ly_do_vd,'Cập nhật trạng thái'), auth.uid());
  END IF;
END;
$$;

-- Helper: mở dòng gán mới + set 'Đang khai thác' + ghi vòng đời.
CREATE OR REPLACE FUNCTION public._mo_gan_va_vong_doi(
  p_thanh_phan_id uuid, p_thiet_bi_id uuid, p_ly_do text, p_hong_hoc_id uuid, p_ghi_chu text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_cu uuid; v_dang uuid;
BEGIN
  v_dang := public._map_trang_thai_tb('khai thác');
  INSERT INTO public.gan_chuc_nang(thanh_phan_id, thiet_bi_id, ly_do, hong_hoc_id, ghi_chu, nguoi_thuc_hien)
  VALUES (p_thanh_phan_id, p_thiet_bi_id, p_ly_do, p_hong_hoc_id, p_ghi_chu, auth.uid())
  RETURNING id INTO v_id;

  SELECT trang_thai_id INTO v_cu FROM public.thiet_bi WHERE id = p_thiet_bi_id;
  UPDATE public.thiet_bi SET trang_thai_id = v_dang WHERE id = p_thiet_bi_id;
  INSERT INTO public.thiet_bi_vong_doi(thiet_bi_id, tu_trang_thai_id, den_trang_thai_id, thoi_diem, ly_do, nguoi_thuc_hien)
  VALUES (p_thiet_bi_id, v_cu, v_dang, now(), 'Lắp vào vị trí chức năng', auth.uid());
  RETURN v_id;
END;
$$;

-- 1. LẮP thiết bị vào vị trí trống.
CREATE OR REPLACE FUNCTION public.lap_thiet_bi(
  p_thanh_phan_id uuid, p_thiet_bi_id uuid, p_ghi_chu text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tt text; v_id uuid;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền quản lý thiết bị';
  END IF;
  SELECT trang_thai INTO v_tt FROM public.he_thong_thanh_phan WHERE id = p_thanh_phan_id FOR UPDATE;
  IF v_tt IS NULL THEN RAISE EXCEPTION 'Vị trí chức năng không tồn tại'; END IF;
  IF v_tt <> 'hoat_dong' THEN RAISE EXCEPTION 'Vị trí chức năng đã ngừng, không thể gán thiết bị'; END IF;
  IF EXISTS (SELECT 1 FROM public.gan_chuc_nang WHERE thanh_phan_id = p_thanh_phan_id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Vị trí chức năng đang có thiết bị, hãy dùng Thay thế/Điều chuyển';
  END IF;
  IF EXISTS (SELECT 1 FROM public.gan_chuc_nang WHERE thiet_bi_id = p_thiet_bi_id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Thiết bị đang được lắp ở vị trí khác';
  END IF;
  v_id := public._mo_gan_va_vong_doi(p_thanh_phan_id, p_thiet_bi_id, 'lắp mới', NULL, p_ghi_chu);
  RETURN v_id;
END;
$$;

-- 2. THÁO thiết bị khỏi vị trí.
CREATE OR REPLACE FUNCTION public.thao_thiet_bi(
  p_thanh_phan_id uuid, p_ly_do text DEFAULT 'tháo', p_ghi_chu text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_gan uuid;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền quản lý thiết bị';
  END IF;
  SELECT id INTO v_gan FROM public.gan_chuc_nang
    WHERE thanh_phan_id = p_thanh_phan_id AND den_ngay IS NULL FOR UPDATE;
  IF v_gan IS NULL THEN RAISE EXCEPTION 'Vị trí chức năng chưa có thiết bị để tháo'; END IF;
  PERFORM public._dong_gan_va_vong_doi(
    v_gan, 'tháo', NULL, public._map_trang_thai_tb(p_ly_do),
    'Tháo khỏi vị trí chức năng: ' || COALESCE(p_ly_do,'tháo'));
END;
$$;

-- 3. THAY THẾ thiết bị (do hỏng) trong 1 transaction.
CREATE OR REPLACE FUNCTION public.thay_the_thiet_bi(
  p_thanh_phan_id uuid, p_thiet_bi_moi_id uuid,
  p_hong_hoc_id uuid DEFAULT NULL, p_ghi_chu text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_gan_cu uuid; v_id uuid; v_tt text;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền quản lý thiết bị';
  END IF;
  SELECT trang_thai INTO v_tt FROM public.he_thong_thanh_phan WHERE id = p_thanh_phan_id FOR UPDATE;
  IF v_tt IS NULL THEN RAISE EXCEPTION 'Vị trí chức năng không tồn tại'; END IF;
  IF v_tt <> 'hoat_dong' THEN RAISE EXCEPTION 'Vị trí chức năng đã ngừng'; END IF;
  IF EXISTS (SELECT 1 FROM public.gan_chuc_nang WHERE thiet_bi_id = p_thiet_bi_moi_id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Thiết bị mới đang được lắp ở vị trí khác';
  END IF;

  SELECT id INTO v_gan_cu FROM public.gan_chuc_nang
    WHERE thanh_phan_id = p_thanh_phan_id AND den_ngay IS NULL FOR UPDATE;

  -- Đóng dòng cũ trước để không vi phạm unique index (vị trí + hiệu lực).
  IF v_gan_cu IS NOT NULL THEN
    PERFORM public._dong_gan_va_vong_doi(
      v_gan_cu, 'thay do hỏng', p_hong_hoc_id,
      public._map_trang_thai_tb('sửa'), 'Thay thế do hỏng');
  END IF;

  -- Mở dòng mới cho thiết bị thay thế.
  v_id := public._mo_gan_va_vong_doi(p_thanh_phan_id, p_thiet_bi_moi_id, 'thay do hỏng', p_hong_hoc_id, p_ghi_chu);
  RETURN v_id;
END;
$$;

-- 4. ĐIỀU CHUYỂN một thiết bị sang vị trí đích.
CREATE OR REPLACE FUNCTION public.dieu_chuyen(
  p_thiet_bi_id uuid, p_thanh_phan_dich uuid, p_ghi_chu text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_gan_cu uuid; v_tt text; v_id uuid;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền quản lý thiết bị';
  END IF;
  SELECT trang_thai INTO v_tt FROM public.he_thong_thanh_phan WHERE id = p_thanh_phan_dich FOR UPDATE;
  IF v_tt IS NULL THEN RAISE EXCEPTION 'Vị trí đích không tồn tại'; END IF;
  IF v_tt <> 'hoat_dong' THEN RAISE EXCEPTION 'Vị trí đích đã ngừng'; END IF;
  IF EXISTS (SELECT 1 FROM public.gan_chuc_nang WHERE thanh_phan_id = p_thanh_phan_dich AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Vị trí đích đang có thiết bị';
  END IF;

  SELECT id INTO v_gan_cu FROM public.gan_chuc_nang
    WHERE thiet_bi_id = p_thiet_bi_id AND den_ngay IS NULL FOR UPDATE;
  IF v_gan_cu IS NOT NULL THEN
    UPDATE public.gan_chuc_nang SET den_ngay = now(), ly_do = 'điều chuyển' WHERE id = v_gan_cu;
  END IF;

  INSERT INTO public.gan_chuc_nang(thanh_phan_id, thiet_bi_id, ly_do, ghi_chu, nguoi_thuc_hien)
  VALUES (p_thanh_phan_dich, p_thiet_bi_id, 'điều chuyển', p_ghi_chu, auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 5. TRÁO thiết bị giữa hai vị trí (đóng cả hai trước, mở chéo sau).
CREATE OR REPLACE FUNCTION public.dieu_chuyen_trao(
  p_thanh_phan_a uuid, p_thanh_phan_b uuid, p_ghi_chu text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ga uuid; v_gb uuid; v_tba uuid; v_tbb uuid;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền quản lý thiết bị';
  END IF;
  SELECT id, thiet_bi_id INTO v_ga, v_tba FROM public.gan_chuc_nang
    WHERE thanh_phan_id = p_thanh_phan_a AND den_ngay IS NULL FOR UPDATE;
  SELECT id, thiet_bi_id INTO v_gb, v_tbb FROM public.gan_chuc_nang
    WHERE thanh_phan_id = p_thanh_phan_b AND den_ngay IS NULL FOR UPDATE;
  IF v_ga IS NULL OR v_gb IS NULL THEN
    RAISE EXCEPTION 'Cả hai vị trí phải đang có thiết bị để tráo';
  END IF;

  UPDATE public.gan_chuc_nang SET den_ngay = now(), ly_do = 'điều chuyển' WHERE id IN (v_ga, v_gb);

  INSERT INTO public.gan_chuc_nang(thanh_phan_id, thiet_bi_id, ly_do, ghi_chu, nguoi_thuc_hien)
  VALUES (p_thanh_phan_a, v_tbb, 'điều chuyển', p_ghi_chu, auth.uid()),
         (p_thanh_phan_b, v_tba, 'điều chuyển', p_ghi_chu, auth.uid());
END;
$$;

-- Quyền thực thi: REVOKE anon, GRANT authenticated + service_role.
REVOKE ALL ON FUNCTION public.lap_thiet_bi(uuid,uuid,text) FROM anon, public;
REVOKE ALL ON FUNCTION public.thao_thiet_bi(uuid,text,text) FROM anon, public;
REVOKE ALL ON FUNCTION public.thay_the_thiet_bi(uuid,uuid,uuid,text) FROM anon, public;
REVOKE ALL ON FUNCTION public.dieu_chuyen(uuid,uuid,text) FROM anon, public;
REVOKE ALL ON FUNCTION public.dieu_chuyen_trao(uuid,uuid,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.lap_thiet_bi(uuid,uuid,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.thao_thiet_bi(uuid,text,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.thay_the_thiet_bi(uuid,uuid,uuid,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dieu_chuyen(uuid,uuid,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dieu_chuyen_trao(uuid,uuid,text) TO authenticated, service_role;