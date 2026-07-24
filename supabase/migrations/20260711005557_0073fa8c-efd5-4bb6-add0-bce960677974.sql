-- Kênh ghi có kiểm soát cho AI agent: 4 RPC hẹp, SECURITY DEFINER,
-- chỉ Admin/Phòng kỹ thuật (can_manage_equipment), có validate + ghi audit_log.
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
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public.can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Chỉ Admin hoặc Phòng kỹ thuật mới được thêm sự cố';
  END IF;
  IF p_he_thong IS NULL OR length(btrim(p_he_thong)) = 0 THEN
    RAISE EXCEPTION 'Thiếu tên hệ thống';
  END IF;
  IF p_hien_tuong IS NULL OR length(btrim(p_hien_tuong)) = 0 THEN
    RAISE EXCEPTION 'Thiếu mô tả hiện tượng sự cố';
  END IF;
  INSERT INTO public.su_co (he_thong, thiet_bi, don_vi, hien_tuong, muc_do, ngay_phat_hien, nguoi_bao_cao, nguyen_nhan, bien_phap_xu_ly)
  VALUES (btrim(p_he_thong), NULLIF(btrim(coalesce(p_thiet_bi,'')),''), NULLIF(btrim(coalesce(p_don_vi,'')),''),
          btrim(p_hien_tuong), NULLIF(btrim(coalesce(p_muc_do,'')),''), COALESCE(p_ngay_phat_hien, CURRENT_DATE),
          NULLIF(btrim(coalesce(p_nguoi_bao_cao,'')),''), NULLIF(btrim(coalesce(p_nguyen_nhan,'')),''),
          NULLIF(btrim(coalesce(p_bien_phap_xu_ly,'')),''))
  RETURNING id INTO new_id;
  PERFORM public.log_app_event('agent_add_su_co','su_co',new_id::text,
    jsonb_build_object('he_thong',p_he_thong,'hien_tuong',p_hien_tuong,'source','ai_agent'));
  RETURN jsonb_build_object('ok',true,'id',new_id,'bang','su_co');
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
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public.can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Chỉ Admin hoặc Phòng kỹ thuật mới được thêm bảo dưỡng';
  END IF;
  IF p_he_thong IS NULL OR length(btrim(p_he_thong)) = 0 THEN
    RAISE EXCEPTION 'Thiếu tên hệ thống';
  END IF;
  IF p_mo_ta_cong_viec IS NULL OR length(btrim(p_mo_ta_cong_viec)) = 0 THEN
    RAISE EXCEPTION 'Thiếu mô tả công việc bảo dưỡng';
  END IF;
  INSERT INTO public.bao_tri (he_thong, thiet_bi, don_vi, loai_bao_tri, ke_hoach, ngay_bat_dau, ngay_hoan_thanh, mo_ta_cong_viec, ket_qua)
  VALUES (btrim(p_he_thong), NULLIF(btrim(coalesce(p_thiet_bi,'')),''), NULLIF(btrim(coalesce(p_don_vi,'')),''),
          NULLIF(btrim(coalesce(p_loai_bao_tri,'')),''), NULLIF(btrim(coalesce(p_ke_hoach,'')),''),
          p_ngay_bat_dau, p_ngay_hoan_thanh, btrim(p_mo_ta_cong_viec), NULLIF(btrim(coalesce(p_ket_qua,'')),''))
  RETURNING id INTO new_id;
  PERFORM public.log_app_event('agent_add_bao_tri','bao_tri',new_id::text,
    jsonb_build_object('he_thong',p_he_thong,'mo_ta',p_mo_ta_cong_viec,'source','ai_agent'));
  RETURN jsonb_build_object('ok',true,'id',new_id,'bang','bao_tri');
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
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public.can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Chỉ Admin hoặc Phòng kỹ thuật mới được thêm hỏng hóc';
  END IF;
  IF p_thiet_bi_hong IS NULL OR length(btrim(p_thiet_bi_hong)) = 0 THEN
    RAISE EXCEPTION 'Thiếu tên thiết bị hỏng';
  END IF;
  IF p_mo_ta_hong_hoc IS NULL OR length(btrim(p_mo_ta_hong_hoc)) = 0 THEN
    RAISE EXCEPTION 'Thiếu mô tả hỏng hóc';
  END IF;
  INSERT INTO public.hong_hoc (thiet_bi_hong, mo_ta_hong_hoc, su_co, ngay_hong, bo_phan_hong, phuong_an, thiet_bi_thay_the)
  VALUES (btrim(p_thiet_bi_hong), btrim(p_mo_ta_hong_hoc), NULLIF(btrim(coalesce(p_su_co,'')),''),
          p_ngay_hong, NULLIF(btrim(coalesce(p_bo_phan_hong,'')),''), NULLIF(btrim(coalesce(p_phuong_an,'')),''),
          NULLIF(btrim(coalesce(p_thiet_bi_thay_the,'')),''))
  RETURNING id INTO new_id;
  PERFORM public.log_app_event('agent_add_hong_hoc','hong_hoc',new_id::text,
    jsonb_build_object('thiet_bi_hong',p_thiet_bi_hong,'mo_ta',p_mo_ta_hong_hoc,'source','ai_agent'));
  RETURN jsonb_build_object('ok',true,'id',new_id,'bang','hong_hoc');
END; $$;

-- 4) Thêm kiểm kê (thiet_bi_id bắt buộc, phải tồn tại)
CREATE OR REPLACE FUNCTION public.agent_add_kiem_ke(
  p_thiet_bi_id uuid,
  p_tinh_trang text,
  p_nguoi_kiem text DEFAULT NULL,
  p_ghi_chu text DEFAULT NULL,
  p_vi_tri_gps text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public.can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Chỉ Admin hoặc Phòng kỹ thuật mới được thêm kiểm kê';
  END IF;
  IF p_thiet_bi_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu id thiết bị';
  END IF;
  IF p_tinh_trang IS NULL OR length(btrim(p_tinh_trang)) = 0 THEN
    RAISE EXCEPTION 'Thiếu tình trạng kiểm kê';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.thiet_bi WHERE id = p_thiet_bi_id) THEN
    RAISE EXCEPTION 'Không tìm thấy thiết bị với id đã cho';
  END IF;
  INSERT INTO public.kiem_ke (thiet_bi_id, tinh_trang, nguoi_kiem, ghi_chu, vi_tri_gps)
  VALUES (p_thiet_bi_id, btrim(p_tinh_trang), NULLIF(btrim(coalesce(p_nguoi_kiem,'')),''),
          NULLIF(btrim(coalesce(p_ghi_chu,'')),''), NULLIF(btrim(coalesce(p_vi_tri_gps,'')),''))
  RETURNING id INTO new_id;
  PERFORM public.log_app_event('agent_add_kiem_ke','kiem_ke',new_id::text,
    jsonb_build_object('thiet_bi_id',p_thiet_bi_id,'tinh_trang',p_tinh_trang,'source','ai_agent'));
  RETURN jsonb_build_object('ok',true,'id',new_id,'bang','kiem_ke');
END; $$;

-- Chỉ authenticated được gọi; kiểm tra vai trò nằm trong hàm. Không cấp cho anon.
REVOKE ALL ON FUNCTION public.agent_add_su_co(text,text,text,text,text,date,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.agent_add_bao_tri(text,text,text,text,text,text,date,date,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.agent_add_hong_hoc(text,text,text,date,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.agent_add_kiem_ke(uuid,text,text,text,text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.agent_add_su_co(text,text,text,text,text,date,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.agent_add_bao_tri(text,text,text,text,text,text,date,date,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.agent_add_hong_hoc(text,text,text,date,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.agent_add_kiem_ke(uuid,text,text,text,text) TO authenticated;