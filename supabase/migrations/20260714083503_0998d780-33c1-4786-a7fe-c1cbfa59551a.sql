-- Cho phép 1 thiết bị vật lý đảm trách NHIỀU thành phần (many-to-one từ thành phần → thiết bị)
DROP INDEX IF EXISTS public.uq_gcn_thiet_bi_active;

-- Bỏ ràng buộc "Thiết bị đang được lắp ở vị trí khác" trong RPC lap_thiet_bi
CREATE OR REPLACE FUNCTION public.lap_thiet_bi(p_thanh_phan_id uuid, p_thiet_bi_id uuid, p_ghi_chu text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  -- KHÔNG chặn thiết bị đang lắp ở vị trí khác: 1 thiết bị được phép phục vụ nhiều thành phần.
  IF EXISTS (SELECT 1 FROM public.gan_chuc_nang WHERE thanh_phan_id = p_thanh_phan_id AND thiet_bi_id = p_thiet_bi_id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Thiết bị này đã được lắp tại chính vị trí chức năng này';
  END IF;
  v_id := public._mo_gan_va_vong_doi(p_thanh_phan_id, p_thiet_bi_id, 'lắp mới', NULL, p_ghi_chu);
  RETURN v_id;
END;
$function$;