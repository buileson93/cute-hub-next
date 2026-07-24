-- Kênh ghi có kiểm soát cho trợ lý AI: 4 RPC hẹp, SECURITY DEFINER.
-- Chỉ Admin/Phòng kỹ thuật (can_manage_equipment). Có validate + ghi audit_log.
-- KHÔNG cấp INSERT/UPDATE/DELETE trực tiếp; AI chỉ ghi qua các hàm này.

-- 1) Thêm sự cố
CREATE OR REPLACE FUNCTION public.agent_add_su_co(
  p_he_thong text,
  p_hien_tuong text,
  p_thiet_bi text DEFAULT NULL,
  p_don_vi text DEFAULT NULL,
  p_muc_do text DEFAULT NULL,
  p_ngay_phat_hien date DEFAULT NULL,
  p_nguoi_bao_cao text DEFAULT NULL,
  p_nguyen_nhan text DEFAULT NULL,
  p_bien_phap_xu_ly text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Bạn không có quyền ghi dữ liệu sự cố';
  END IF;
  IF p_he_thong IS NULL OR length(btrim(p_he_thong)) = 0 THEN
    RAISE EXCEPTION 'Trường hệ thống là bắt buộc';
  END IF;
  IF p_hien_tuong IS NULL OR length(btrim(p_hien_tuong)) = 0 THEN
    RAISE EXCEPTION 'Trường hiện tượng là bắt buộc';
  END IF;

  INSERT INTO public.su_co (he_thong, hien_tuong, thiet_bi, don_vi, muc_do,
                            ngay_phat_hien, nguoi_bao_cao, nguyen_nhan, bien_phap_xu_ly, created_by)
  VALUES (btrim(p_he_thong), btrim(p_hien_tuong), p_thiet_bi, p_don_vi, p_muc_do,
          COALESCE(p_ngay_phat_hien, current_date), p_nguoi_bao_cao, p_nguyen_nhan, p_bien_phap_xu_ly, auth.uid())
  RETURNING id INTO v_id;

  PERFORM public.log_app_event('agent_add_su_co', 'su_co', v_id::text,
    jsonb_build_object('he_thong', p_he_thong, 'via', 'ai_agent'));
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END; $$;

-- 2) Thêm bảo dưỡng
CREATE OR REPLACE FUNCTION public.agent_add_bao_tri(
  p_he_thong text,
  p_mo_ta_cong_viec text,
  p_thiet_bi text DEFAULT NULL,
  p_don_vi text DEFAULT NULL,
  p_loai_bao_tri text DEFAULT NULL,
  p_ke_hoach text DEFAULT NULL,
  p_ngay_bat_dau date DEFAULT NULL,
  p_ngay_hoan_thanh date DEFAULT NULL,
  p_ket_qua text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Bạn không có quyền ghi dữ liệu bảo dưỡng';
  END IF;
  IF p_he_thong IS NULL OR length(btrim(p_he_thong)) = 0 THEN
    RAISE EXCEPTION 'Trường hệ thống là bắt buộc';
  END IF;
  IF p_mo_ta_cong_viec IS NULL OR length(btrim(p_mo_ta_cong_viec)) = 0 THEN
    RAISE EXCEPTION 'Trường mô tả công việc là bắt buộc';
  END IF;

  INSERT INTO public.bao_tri (he_thong, mo_ta_cong_viec, thiet_bi, don_vi, loai_bao_tri,
                              ke_hoach, ngay_bat_dau, ngay_hoan_thanh, ket_qua, created_by)
  VALUES (btrim(p_he_thong), btrim(p_mo_ta_cong_viec), p_thiet_bi, p_don_vi, p_loai_bao_tri,
          p_ke_hoach, p_ngay_bat_dau, p_ngay_hoan_thanh, p_ket_qua, auth.uid())
  RETURNING id INTO v_id;

  PERFORM public.log_app_event('agent_add_bao_tri', 'bao_tri', v_id::text,
    jsonb_build_object('he_thong', p_he_thong, 'via', 'ai_agent'));
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END; $$;

-- 3) Thêm hỏng hóc
CREATE OR REPLACE FUNCTION public.agent_add_hong_hoc(
  p_thiet_bi_hong text,
  p_mo_ta_hong_hoc text,
  p_su_co text DEFAULT NULL,
  p_ngay_hong date DEFAULT NULL,
  p_bo_phan_hong text DEFAULT NULL,
  p_phuong_an text DEFAULT NULL,
  p_thiet_bi_thay_the text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Bạn không có quyền ghi dữ liệu hỏng hóc';
  END IF;
  IF p_thiet_bi_hong IS NULL OR length(btrim(p_thiet_bi_hong)) = 0 THEN
    RAISE EXCEPTION 'Trường thiết bị hỏng là bắt buộc';
  END IF;
  IF p_mo_ta_hong_hoc IS NULL OR length(btrim(p_mo_ta_hong_hoc)) = 0 THEN
    RAISE EXCEPTION 'Trường mô tả hỏng hóc là bắt buộc';
  END IF;

  INSERT INTO public.hong_hoc (thiet_bi_hong, mo_ta_hong_hoc, su_co, ngay_hong,
                               bo_phan_hong, phuong_an, thiet_bi_thay_the, created_by)
  VALUES (btrim(p_thiet_bi_hong), btrim(p_mo_ta_hong_hoc), p_su_co,
          COALESCE(p_ngay_hong, current_date), p_bo_phan_hong, p_phuong_an, p_thiet_bi_thay_the, auth.uid())
  RETURNING id INTO v_id;

  PERFORM public.log_app_event('agent_add_hong_hoc', 'hong_hoc', v_id::text,
    jsonb_build_object('thiet_bi_hong', p_thiet_bi_hong, 'via', 'ai_agent'));
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END; $$;

-- 4) Thêm kiểm kê
CREATE OR REPLACE FUNCTION public.agent_add_kiem_ke(
  p_thiet_bi_id uuid,
  p_tinh_trang text,
  p_nguoi_kiem text DEFAULT NULL,
  p_ghi_chu text DEFAULT NULL,
  p_vi_tri_gps text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Bạn không có quyền ghi dữ liệu kiểm kê';
  END IF;
  IF p_thiet_bi_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu id thiết bị';
  END IF;
  IF p_tinh_trang IS NULL OR length(btrim(p_tinh_trang)) = 0 THEN
    RAISE EXCEPTION 'Trường tình trạng là bắt buộc';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.thiet_bi WHERE id = p_thiet_bi_id) THEN
    RAISE EXCEPTION 'Không tìm thấy thiết bị với id đã cho';
  END IF;

  INSERT INTO public.kiem_ke (thiet_bi_id, tinh_trang, nguoi_kiem, ghi_chu, vi_tri_gps, thoi_diem, created_by)
  VALUES (p_thiet_bi_id, btrim(p_tinh_trang), p_nguoi_kiem, p_ghi_chu, p_vi_tri_gps, now(), auth.uid())
  RETURNING id INTO v_id;

  PERFORM public.log_app_event('agent_add_kiem_ke', 'kiem_ke', v_id::text,
    jsonb_build_object('thiet_bi_id', p_thiet_bi_id, 'via', 'ai_agent'));
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END; $$;

-- Chỉ cho phép user đã đăng nhập gọi (bên trong hàm còn kiểm tra vai trò).
REVOKE ALL ON FUNCTION public.agent_add_su_co(text,text,text,text,text,date,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.agent_add_bao_tri(text,text,text,text,text,text,date,date,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.agent_add_hong_hoc(text,text,text,date,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.agent_add_kiem_ke(uuid,text,text,text,text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.agent_add_su_co(text,text,text,text,text,date,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.agent_add_bao_tri(text,text,text,text,text,text,date,date,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.agent_add_hong_hoc(text,text,text,date,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.agent_add_kiem_ke(uuid,text,text,text,text) TO authenticated;