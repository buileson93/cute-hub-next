-- 1) Trường tùy chọn: đánh dấu hành động khắc phục là BẮT BUỘC (mặc định false)
ALTER TABLE public.cong_viec_bao_tri
  ADD COLUMN IF NOT EXISTS bat_buoc boolean NOT NULL DEFAULT false;

-- 2) RPC: đóng vấn đề (RCA) có kiểm soát
--    - Chỉ admin | phong_kt (đồng bộ can_manage_equipment).
--    - Chặn đóng khi còn hành động BẮT BUỘC chưa HOÀN_THÀNH/HỦY.
--    - Ghi audit chuyển trạng thái (ngoài audit trigger sẵn có của van_de).
CREATE OR REPLACE FUNCTION public.dong_van_de(p_id uuid, p_ghi_chu text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old text;
  v_blocking int;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền đóng vấn đề';
  END IF;

  SELECT trang_thai INTO v_old FROM public.van_de WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy vấn đề'; END IF;

  SELECT count(*) INTO v_blocking
  FROM public.cong_viec_bao_tri
  WHERE van_de_id = p_id
    AND bat_buoc = true
    AND trang_thai NOT IN ('HOAN_THANH','HUY');

  IF v_blocking > 0 THEN
    RAISE EXCEPTION 'Còn % hành động bắt buộc chưa hoàn thành, không thể đóng vấn đề', v_blocking;
  END IF;

  IF v_old IS DISTINCT FROM 'dong' THEN
    UPDATE public.van_de
      SET trang_thai = 'dong', updated_at = now()
      WHERE id = p_id;

    -- Audit rõ ràng cho chuyển trạng thái (kèm audit trigger của bảng)
    PERFORM public.log_app_event(
      'chuyen_trang_thai_van_de',
      'van_de',
      p_id::text,
      jsonb_build_object('tu', v_old, 'den', 'dong', 'ghi_chu', p_ghi_chu)
    );
  END IF;
END; $$;

REVOKE ALL ON FUNCTION public.dong_van_de(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.dong_van_de(uuid, text) TO authenticated, service_role;